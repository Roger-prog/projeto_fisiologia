import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { setTimeout as wait } from "node:timers/promises";
import { parseArgs } from "node:util";
import { cardiovascularLesson } from "../src/data/lessons/cardiovascular";
import { getNarrationCatalog } from "../src/lib/narration-catalog";
import { prepareNarrationText } from "../src/lib/narration-pronunciation";
import { auditNarration, isMp3, type Manifest } from "./audit-narration";
import { getNarrationProvider, type NarrationProvider, type NarrationVoice } from "./narration-providers";

const audioDir = resolve("public", "audio");
const samplesDir = resolve("docs", "amostras-narracao");
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

async function readManifest(file = manifestPath): Promise<Manifest> {
  try {
    return parseManifest(JSON.parse(await readFile(file, "utf8")));
  } catch (error) {
    if (hasErrorCode(error, "ENOENT")) return { version: 1, voices: [], clips: {} };
    if (error instanceof SyntaxError) throw new Error("O manifesto de áudio não contém JSON válido.");
    throw error;
  }
}

function getAssetFile(src: string) {
  return join(audioDir, src.slice(assetPrefix.length));
}

async function hasMp3(file: string) {
  try {
    return isMp3(await readFile(file));
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
    // On Windows a concurrent reader can briefly prevent replacement of the manifest.
    for (let attempt = 0; ; attempt += 1) {
      try {
        await rename(temp, file);
        break;
      } catch (error) {
        if (attempt === 5 || !["EPERM", "EACCES", "EBUSY"].some((code) => hasErrorCode(error, code))) throw error;
        await wait(50 * (attempt + 1));
      }
    }
  } finally {
    await rm(temp, { force: true });
  }
}

async function withGenerationLock(directory: string, work: () => Promise<void>) {
  const path = join(tmpdir(), `fisio-audio-${hash(directory).slice(0, 16)}.lock`);
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

async function compareVoices(provider: NarrationProvider, names: string[], generate: boolean) {
  const example = cardiovascularLesson.sections.find(({ id }) => id === "bomba-e-rede")?.example;
  if (!example?.formula?.spoken || !example.paragraphs[0]) throw new Error("O exemplo cardiovascular da comparação está incompleto.");
  const text = prepareNarrationText([`${example.title}.`, example.formula.spoken, example.paragraphs[0]].join(" "));
  if (provider.maxBytes !== undefined && Buffer.byteLength(text) > provider.maxBytes) {
    throw new Error(`A amostra ultrapassa o limite de ${provider.maxBytes} bytes por solicitação.`);
  }
  const comparisonVoices = provider.id === "google-chirp3-hd" && names.length === 0
    ? ["pt-BR-Chirp3-HD-Kore", "pt-BR-Chirp3-HD-Charon", "pt-BR-Chirp3-HD-Aoede"]
    : names;
  const jobs = [];
  for (const { name, voice } of provider.voices(comparisonVoices)) {
    const fingerprint = hash(JSON.stringify([provider.revision, voice.id, text])).slice(0, 16);
    const file = join(samplesDir, `${voice.id}-${fingerprint}.mp3`);
    if (!await hasMp3(file)) jobs.push({ name, file });
  }
  console.log(text);
  console.log(`${provider.id} · ${jobs.length} amostras a gerar · ${[...text].length * jobs.length} caracteres`);
  if (!generate) {
    for (const { file } of jobs) console.log(file);
    return;
  }
  if (jobs.length === 0) return;

  const synthesize = await provider.connect();
  try {
    for (const { name, file } of jobs) {
      const mp3 = await synthesize(text, name);
      if (!isMp3(mp3)) throw new Error(`O provedor não retornou uma amostra MP3 válida para ${name}.`);
      await writeAtomic(file, mp3);
      console.log(file);
    }
  } finally {
    synthesize.close?.();
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
    decode: { type: "boolean" },
    export: { type: "boolean" },
    json: { type: "boolean" },
    samples: { type: "boolean" },
    "authorize-paid": { type: "boolean" },
  } });

  if (values.help) {
    console.log("npm run audio:generate -- [--provider google-chirp3-hd|piper|kokoro] [--voice NOME] [--prefix CAMINHO] [--generate] [--authorize-paid] [--verify] [--samples]");
    console.log("Sem --generate, lista o plano sem chamar o provedor. --voice e --prefix podem ser repetidos.");
    console.log("npm run audio:audit -- [--export] [--decode] [--json]");
    console.log("--verify audita a cobertura e o texto das aulas e da interface, sem gerar áudio.");
    console.log("--samples prepara a mesma explicação para comparação em docs/amostras-narracao, separada das faixas do site.");
    return;
  }

  if (values.verify && values.generate) throw new Error("Use --verify ou --generate em execuções separadas.");
  if (!values.verify && (values.decode || values.export || values.json)) {
    throw new Error("Use --decode, --export e --json com --verify ou npm run audio:audit.");
  }
  const provider = getNarrationProvider(values.provider);
  if (values.generate && provider.paid && !values["authorize-paid"]) {
    throw new Error("Nenhuma solicitação foi enviada. Revise o plano e acrescente --authorize-paid para permitir a cobrança.");
  }
  const names = [...new Set(values.voice)];
  if (values.samples) {
    if (values.verify || values.prefix.length) throw new Error("Use --samples sem --verify ou --prefix.");
    const compare = () => compareVoices(provider, names, Boolean(values.generate));
    if (values.generate) await withGenerationLock(samplesDir, compare);
    else await compare();
    return;
  }
  if (provider.id === "kokoro") throw new Error("O Kokoro está disponível para comparação com --samples.");

  const clips = getNarrationCatalog();
  const catalog = new Map(clips.map((clip) => {
    const text = prepareNarrationText(clip.text);
    if (!catalogPath.test(clip.id) || !catalogPath.test(clip.path) || !text) {
      throw new Error("O catálogo contém um trecho sem texto ou com caminho inválido.");
    }
    return [clip.id, { ...clip, text, revision: hash(text) }] as const;
  }));
  if (catalog.size !== clips.length) throw new Error("O catálogo contém identificadores de trecho duplicados.");

  if (values.verify) {
    const directory = values.export ? resolve("out", "audio") : audioDir;
    const manifest = await readManifest(join(directory, "manifest.json"));
    const complete = await auditNarration({ manifest, catalog, directory, decode: Boolean(values.decode), json: Boolean(values.json) });
    if (!complete) process.exitCode = 1;
    return;
  }

  const selected = [...catalog.values()].filter(({ path }) =>
    values.prefix.length === 0 || values.prefix.some((prefix) => prefix.length > 0 && path.startsWith(prefix)));
  if (selected.length === 0) throw new Error("Nenhum trecho corresponde ao filtro informado.");
  const voices = provider.voices(names);

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
        if (existing?.src === src && existing.revision === track.revision && await hasMp3(getAssetFile(src))) continue;
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
    try {
      for (const { clip, voice, name, track } of jobs) {
        const file = getAssetFile(track.src);
        // Reuse a complete, content-addressed file left by an interrupted manifest update.
        if (!await hasMp3(file)) {
          const mp3 = await synthesize(clip.text, name);
          if (!isMp3(mp3)) throw new Error(`O provedor não retornou um MP3 válido para ${clip.id}.`);
          await writeAtomic(file, mp3);
        }
        if (!manifest.voices.some(({ id }) => id === voice.id)) manifest.voices.push(voice);
        manifest.clips[clip.id] = { ...manifest.clips[clip.id], [voice.id]: track };
        await writeAtomic(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
        console.log(track.src);
      }
    } finally {
      synthesize.close?.();
    }
  }

  if (values.generate) await withGenerationLock(audioDir, planAndGenerate);
  else await planAndGenerate();
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Falha ao gerar as narrações.");
  process.exitCode = 1;
});
