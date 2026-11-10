import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { getNarrationCatalog } from "../src/lib/narration-catalog";
import { prepareNarrationText } from "../src/lib/narration-pronunciation";
import { getNarrationProvider, type NarrationVoice } from "./narration-providers";

type Track = { src: string; revision: string };
type Manifest = { version: 1; voices: NarrationVoice[]; clips: Record<string, Record<string, Track>> };

const audioDir = resolve("public", "audio");
const manifestPath = join(audioDir, "manifest.json");
const assetPrefix = "/audio/";
const slug = /^[a-z0-9-]+$/;
const catalogPath = /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/;
const assetPath = /^\/audio\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.mp3$/;
const hash = (text: string) => createHash("sha256").update(text).digest("hex");

function hasErrorCode(error: unknown, code: string) {
  return error instanceof Error && "code" in error && error.code === code;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseManifest(value: unknown): Manifest {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.voices) || !isRecord(value.clips)) {
    throw new Error("O catálogo de áudio deve usar a versão 1 do manifesto.");
  }
  const voices = new Map<string, NarrationVoice>();
  for (const voice of value.voices) {
    if (!isRecord(voice) || typeof voice.id !== "string" || !slug.test(voice.id) || voices.has(voice.id)
      || typeof voice.label !== "string" || !voice.label.trim() || voice.language !== "pt-BR" || voice.kind !== "neural") {
      throw new Error("O manifesto contém uma voz inválida ou duplicada.");
    }
    voices.set(voice.id, { id: voice.id, label: voice.label, language: "pt-BR", kind: "neural" });
  }

  const clips = Object.entries(value.clips).map(([id, byVoice]) => {
    if (!catalogPath.test(id) || !isRecord(byVoice)) throw new Error("O manifesto contém um identificador de trecho inválido.");
    const tracks = Object.entries(byVoice).map(([voiceId, track]) => {
      if (!voices.has(voiceId) || !isRecord(track) || typeof track.src !== "string" || !assetPath.test(track.src)
        || typeof track.revision !== "string" || !/^[a-f0-9]{64}$/.test(track.revision)) {
        throw new Error(`Faixa inválida no manifesto para ${id}.`);
      }
      return [voiceId, { src: track.src, revision: track.revision }] as const;
    });
    return [id, Object.fromEntries(tracks)] as const;
  });
  return { version: 1, voices: [...voices.values()], clips: Object.fromEntries(clips) };
}

async function readManifest(): Promise<Manifest> {
  try {
    return parseManifest(JSON.parse(await readFile(manifestPath, "utf8")));
  } catch (error) {
    if (hasErrorCode(error, "ENOENT")) return { version: 1, voices: [], clips: {} };
    if (error instanceof SyntaxError) throw new Error("O manifesto de áudio não contém JSON válido.");
    throw error;
  }
}

function getAssetFile(src: string) {
  return join(audioDir, src.slice(assetPrefix.length));
}

function isMp3(bytes: Buffer) {
  const header = bytes.subarray(0, 3).toString("ascii");
  return bytes.length >= 512 && (header === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0));
}

async function hasMp3(src: string) {
  try {
    return isMp3(await readFile(getAssetFile(src)));
  } catch (error) {
    if (hasErrorCode(error, "ENOENT")) return false;
    throw error;
  }
}

async function writeAtomic(file: string, value: Buffer | string) {
  await mkdir(dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temp, value, { flag: "wx" });
    await rename(temp, file);
  } finally {
    await rm(temp, { force: true });
  }
}

async function withGenerationLock(work: () => Promise<void>) {
  const path = join(tmpdir(), `fisio-audio-${hash(audioDir).slice(0, 16)}.lock`);
  const lock = await open(path, "wx").catch((error: unknown) => {
    if (hasErrorCode(error, "EEXIST")) throw new Error(`Já existe uma geração de áudio em curso. Arquivo de controle: ${path}`);
    throw error;
  });
  try {
    await work();
  } finally {
    await lock.close();
    await rm(path, { force: true });
  }
}

async function main() {
  const { values } = parseArgs({ options: {
    help: { type: "boolean", short: "h" },
    provider: { type: "string", default: "google-chirp3-hd" },
    voice: { type: "string", multiple: true, default: [] },
    prefix: { type: "string", multiple: true, default: [] },
    generate: { type: "boolean" },
    verify: { type: "boolean" },
    "authorize-paid": { type: "boolean" },
  } });

  if (values.help) {
    console.log("npm run audio:generate -- [--provider google-chirp3-hd|piper] [--voice NOME] [--prefix CAMINHO] [--generate] [--authorize-paid] [--verify]");
    console.log("Sem --generate, lista o plano sem chamar o provedor. --voice e --prefix podem ser repetidos.");
    console.log("--verify confere os arquivos referenciados e a versão do texto, sem gerar áudio.");
    return;
  }

  if (values.verify && values.generate) throw new Error("Use --verify ou --generate em execuções separadas.");
  const provider = getNarrationProvider(values.provider);
  if (values.generate && provider.paid && !values["authorize-paid"]) {
    throw new Error("Nenhuma solicitação foi enviada. Revise o plano e acrescente --authorize-paid para permitir a cobrança.");
  }

  const catalog = new Map(getNarrationCatalog().map((clip) => {
    const text = prepareNarrationText(clip.text);
    if (!catalogPath.test(clip.id) || !catalogPath.test(clip.path) || !text) {
      throw new Error("O catálogo contém um trecho sem texto ou com caminho inválido.");
    }
    return [clip.id, { ...clip, text, revision: hash(text) }] as const;
  }));

  if (values.verify) {
    const manifest = await readManifest();
    let count = 0;
    for (const [id, byVoice] of Object.entries(manifest.clips)) {
      for (const [voice, track] of Object.entries(byVoice)) {
        if (catalog.get(id)?.revision !== track.revision) throw new Error(`Texto alterado ou removido em ${id} (${voice}).`);
        if (!await hasMp3(track.src)) throw new Error(`MP3 ausente ou inválido em ${track.src}.`);
        count += 1;
      }
    }
    if (count === 0) throw new Error("O manifesto ainda não contém faixas de áudio.");
    console.log(`${count} faixas verificadas.`);
    return;
  }

  const selected = [...catalog.values()].filter(({ path }) =>
    values.prefix.length === 0 || values.prefix.some((prefix) => prefix.length > 0 && path.startsWith(prefix)));
  if (selected.length === 0) throw new Error("Nenhum trecho corresponde ao filtro informado.");
  const voices = provider.voices([...new Set(values.voice)]);

  async function planAndGenerate() {
    const manifest = await readManifest();
    const jobs = [];
    for (const clip of selected) {
      if (provider.maxBytes !== undefined && Buffer.byteLength(clip.text) > provider.maxBytes) {
        throw new Error(`O trecho ${clip.id} ultrapassa o limite de ${provider.maxBytes} bytes por solicitação.`);
      }
      for (const { voice, name } of voices) {
        const fingerprint = hash(JSON.stringify([provider.revision, voice.id, clip.revision])).slice(0, 16);
        const src = `${assetPrefix}${clip.path}-${voice.id}-${fingerprint}.mp3`;
        const track = { src, revision: clip.revision };
        const existing = manifest.clips[clip.id]?.[voice.id];
        if (existing?.src === src && existing.revision === track.revision && await hasMp3(src)) continue;
        jobs.push({ clip, voice, name, track });
      }
    }
    const characters = jobs.reduce((sum, { clip }) => sum + [...clip.text].length, 0);
    console.log(`${provider.id} · ${selected.length * voices.length - jobs.length} faixas já prontas · ${jobs.length} a gerar · ${characters} caracteres`);
    if (!values.generate) {
      for (const { track } of jobs) console.log(track.src);
      return;
    }
    if (jobs.length === 0) return;

    const synthesize = await provider.connect();
    for (const { clip, voice, name, track } of jobs) {
      const file = getAssetFile(track.src);
      // Reuse a complete, content-addressed file left by an interrupted manifest update.
      if (!await hasMp3(track.src)) {
        const mp3 = await synthesize(clip.text, name);
        if (!isMp3(mp3)) throw new Error(`O provedor não retornou um MP3 válido para ${clip.id}.`);
        await writeAtomic(file, mp3);
      }
      if (!manifest.voices.some(({ id }) => id === voice.id)) manifest.voices.push(voice);
      manifest.clips[clip.id] = { ...manifest.clips[clip.id], [voice.id]: track };
      await writeAtomic(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      console.log(track.src);
    }
  }

  if (values.generate) await withGenerationLock(planAndGenerate);
  else await planAndGenerate();
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Falha ao gerar as narrações.");
  process.exitCode = 1;
});
