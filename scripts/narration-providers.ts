import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdtemp, readFile, rm, rmdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { promisify } from "node:util";

export type NarrationVoice = { id: string; label: string; language: "pt-BR"; kind: "neural" };
type VoiceRequest = { voice: NarrationVoice; name: string };
type Synthesize = (text: string, name: string) => Promise<Buffer>;

export interface NarrationProvider {
  id: string;
  paid: boolean;
  revision: string;
  maxBytes?: number;
  voices: (names: string[]) => VoiceRequest[];
  connect: () => Promise<Synthesize>;
}

const run = promisify(execFile);
const language = "pt-BR";
const cadu = "pt_BR-cadu-medium";
// The rdh retrain kept the old filename. Pin the voice and configuration together.
const caduModelHash = "d5a662e3f606d5a49dd29ba9ce90c304ae45dd9543f8b0c773bcb0de282499de";
const caduConfigHash = "9fa837b7c1237ea5978bcd7be38c130798e8faa064f754873bb4ce5fc498bd88";
const chirpRate = 0.95;
const piperPace = "1.04";
const sentencePause = "0.24";
const normalization = "loudnorm=I=-19:TP=-2:LRA=7";

function voiceRequest(id: string, name: string, label: string): VoiceRequest {
  return { name, voice: { id, label, language, kind: "neural" } };
}

const google: NarrationProvider = {
  id: "google-chirp3-hd",
  paid: true,
  revision: `v1-mp3-rate-${chirpRate}`,
  maxBytes: 5000,
  voices(names) {
    return (names.length ? names : ["pt-BR-Chirp3-HD-Kore"]).map((name) => {
      const match = /^pt-BR-Chirp3-HD-([A-Za-z]+)$/.exec(name);
      if (!match) throw new Error("Selecione uma voz pt-BR Chirp 3 HD pelo nome exato no catálogo do Google.");
      return voiceRequest(`google-${name.toLowerCase()}`, name, `${match[1]} (Chirp 3 HD)`);
    });
  },
  async connect() {
    const project = process.env.FISIO_TTS_PROJECT?.trim();
    const token = process.env.FISIO_TTS_ACCESS_TOKEN?.trim();
    if (!project || !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(project) || !token || /\s/u.test(token)) {
      throw new Error("Configure FISIO_TTS_PROJECT e um token OAuth local em FISIO_TTS_ACCESS_TOKEN.");
    }
    return async (text, name) => {
      let response: Response;
      try {
        response = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
          method: "POST",
          redirect: "error",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-goog-user-project": project,
            "Content-Type": "application/json; charset=utf-8",
          },
          signal: AbortSignal.timeout(60_000),
          body: JSON.stringify({
            input: { text },
            voice: { languageCode: language, name },
            audioConfig: { audioEncoding: "MP3", speakingRate: chirpRate },
          }),
        });
      } catch {
        throw new Error("Falha de rede ou tempo limite no Google Cloud Text-to-Speech.");
      }
      if (!response.ok) throw new Error(`Google Cloud Text-to-Speech retornou HTTP ${response.status}.`);

      const result: { audioContent?: unknown } | null = await response.json().catch(() => null);
      if (typeof result?.audioContent !== "string") throw new Error("O Google Cloud não retornou áudio.");
      return Buffer.from(result.audioContent, "base64");
    };
  },
};

async function fileHash(path: string) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

async function runLocal(binary: string, args: string[], label: string) {
  const env = { ...process.env };
  delete env.FISIO_TTS_ACCESS_TOKEN;
  try {
    await run(binary, args, { env, windowsHide: true, timeout: 180_000 });
  } catch {
    throw new Error(`Falha ao executar ${label}. Verifique a instalação e os caminhos configurados.`);
  }
}

const piper: NarrationProvider = {
  id: "piper",
  paid: false,
  revision: `v1-${caduModelHash}-${caduConfigHash}-${piperPace}-${sentencePause}-${normalization}`,
  voices(names) {
    if (names.some((name) => name !== cadu)) throw new Error(`O provedor Piper foi configurado para ${cadu}.`);
    return [voiceRequest("piper-pt-br-cadu-medium", cadu, "Cadu (Piper)")];
  },
  async connect() {
    const modelValue = process.env.FISIO_PIPER_MODEL;
    if (!modelValue || basename(modelValue) !== `${cadu}.onnx`) {
      throw new Error(`Configure FISIO_PIPER_MODEL com o caminho de ${cadu}.onnx.`);
    }
    const model = resolve(modelValue);
    const [modelHash, configHash] = await Promise.all([fileHash(model), fileHash(`${model}.json`)]).catch(() => {
      throw new Error("O modelo Piper e sua configuração .onnx.json precisam estar disponíveis localmente.");
    });
    if (modelHash !== caduModelHash || configHash !== caduConfigHash) {
      throw new Error("A cópia do modelo Piper não é a revisão Cadu com base rdh usada pelo projeto. Confira a documentação.");
    }

    const python = process.env.FISIO_PIPER_PYTHON || "python";
    const ffmpeg = process.env.FISIO_FFMPEG || "ffmpeg";
    return async (text) => {
      const dir = await mkdtemp(join(tmpdir(), "fisio-narracao-"));
      const input = join(dir, "texto.txt");
      const wave = join(dir, "fala.wav");
      const mp3 = join(dir, "fala.mp3");
      try {
        await writeFile(input, text, "utf8");
        await runLocal(python, [
          "-m", "piper", "--model", model, "--input-file", input, "--output-file", wave,
          "--length-scale", piperPace, "--sentence-silence", sentencePause,
        ], "Piper");
        await runLocal(ffmpeg, [
          "-nostdin", "-hide_banner", "-loglevel", "error", "-i", wave,
          "-af", normalization, "-ar", "22050", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "64k", mp3,
        ], "FFmpeg");
        return await readFile(mp3);
      } finally {
        await Promise.all([input, wave, mp3].map((path) => rm(path, { force: true })));
        await rmdir(dir);
      }
    };
  },
};

export function getNarrationProvider(id: string) {
  const provider = [google, piper].find((item) => item.id === id);
  if (!provider) throw new Error("Provedor desconhecido. Use google-chirp3-hd ou piper.");
  return provider;
}
