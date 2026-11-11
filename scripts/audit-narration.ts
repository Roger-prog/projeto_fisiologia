import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { lessons } from "../src/data/index";
import { getLessonSteps } from "../src/lib/lesson-steps";
import { getLessonNarrationClips, getStepNarrationClips } from "../src/lib/narration-catalog";
import type { NarrationVoice } from "./narration-providers";

export type Track = { src: string; revision: string };
export type Manifest = { version: 1; voices: NarrationVoice[]; clips: Record<string, Record<string, Track>> };
type Issue = "sem referência" | "arquivo ausente" | "MP3 inválido" | "texto desatualizado" | "trecho removido";
type AuditedFile = { id: string; src: string | null; issues: Issue[]; durationSeconds?: number };
type Coverage = { ready: number; total: number };
type LessonAudit = {
  id: string;
  title: string;
  complete: Coverage;
  guided: Coverage;
  sections: ({ id: string; title: string } & Coverage)[];
  divergent: string[];
};
type VoiceAudit = { id: string; label: string; files: AuditedFile[]; lessons: LessonAudit[] };

const run = promisify(execFile);

export function isMp3(bytes: Buffer) {
  const header = bytes.subarray(0, 3).toString("ascii");
  return bytes.length >= 512 && (header === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0));
}

async function getDecoder() {
  const binary = process.env.FISIO_FFMPEG || "ffmpeg";
  try {
    await run(binary, ["-version"], { windowsHide: true, timeout: 5000 });
  } catch {
    throw new Error("Configure FISIO_FFMPEG ou instale FFmpeg no PATH para verificar a decodificação e duração.");
  }

  return async (file: string) => {
    const { stderr } = await run(binary, [
      "-nostdin", "-hide_banner", "-v", "info", "-xerror", "-i", file, "-map", "0:a:0", "-f", "null", "-",
    ], { windowsHide: true, timeout: 60_000 });
    const duration = /Duration: (\d+):(\d+):(\d+\.\d+)/u.exec(stderr);
    if (!duration || !stderr.includes("Input #0, mp3,")) throw new Error("MP3 ou duração inválidos.");
    const [, hours, minutes, seconds] = duration;
    return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
  };
}

function getLessonCoverage() {
  return lessons.map((lesson) => {
    const complete = getLessonNarrationClips(lesson);
    const steps = getLessonSteps(lesson);
    const guided = steps.flatMap((step) => getStepNarrationClips(lesson, step));
    const fullText = new Map(complete.map(({ id, text }) => [id, text]));
    const divergent = guided.filter(({ id, text }) => fullText.get(id) !== text).map(({ id }) => id);
    const sections = Map.groupBy(complete, ({ id }) => id.split("/")[2]);
    return {
      id: lesson.id,
      title: lesson.title,
      complete: complete.map(({ id }) => id),
      guided: guided.map(({ id }) => id),
      sections: [...sections].map(([id, clips]) => ({
        id,
        title: steps.find((step) => step.id === id)?.title ?? (id === "titulo" ? "Título" : "Termos importantes"),
        clips: clips.map((clip) => clip.id),
      })),
      divergent,
    };
  });
}

export async function auditNarration({ manifest, catalog, directory, decode, json }: {
  manifest: Manifest;
  catalog: ReadonlyMap<string, { revision: string }>;
  directory: string;
  decode: boolean;
  json: boolean;
}) {
  const lessonCoverage = getLessonCoverage();
  const decoder = decode ? await getDecoder() : undefined;

  async function inspectFile(id: string, voiceId: string): Promise<AuditedFile> {
    const expected = catalog.get(id);
    const track = manifest.clips[id]?.[voiceId];
    const issues: Issue[] = [];
    if (!expected) issues.push("trecho removido");
    if (!track) return { id, src: null, issues: [...issues, "sem referência"] };
    if (expected && expected.revision !== track.revision) issues.push("texto desatualizado");

    const result: AuditedFile = { id, src: track.src, issues };
    const file = join(directory, track.src.slice("/audio/".length));
    let bytes: Buffer;
    try {
      bytes = await readFile(file);
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        issues.push("arquivo ausente");
        return result;
      }
      throw error;
    }
    if (!isMp3(bytes)) issues.push("MP3 inválido");
    else if (decoder) {
      try {
        const seconds = await decoder(file);
        if (seconds <= 0) issues.push("MP3 inválido");
        else result.durationSeconds = seconds;
      } catch {
        issues.push("MP3 inválido");
      }
    }
    return result;
  }

  const report = { directory, decode, expectedClips: catalog.size, voices: [] as VoiceAudit[] };
  for (const voice of manifest.voices) {
    const obsolete = Object.entries(manifest.clips)
      .filter(([id, tracks]) => !catalog.has(id) && tracks[voice.id])
      .map(([id]) => id);
    const ids = [...catalog.keys(), ...obsolete];
    const files: AuditedFile[] = [];
    const batchSize = decode ? 4 : 16;
    for (let index = 0; index < ids.length; index += batchSize) {
      files.push(...await Promise.all(ids.slice(index, index + batchSize).map((id) => inspectFile(id, voice.id))));
    }
    const ready = new Set(files.filter(({ issues }) => issues.length === 0).map(({ id }) => id));
    function count(clips: readonly string[]) {
      return { ready: clips.filter((id) => ready.has(id)).length, total: clips.length };
    }
    report.voices.push({
      id: voice.id, label: voice.label, files,
      lessons: lessonCoverage.map(({ id, title, complete, guided, sections, divergent }) => ({
        id, title, complete: count(complete), guided: count(guided), divergent,
        sections: sections.map((section) => ({ id: section.id, title: section.title, ...count(section.clips) })),
      })),
    });
  }

  if (json) console.log(JSON.stringify(report, null, 2));
  else {
    if (!report.voices.length) console.log("O manifesto não contém vozes neurais.");
    for (const { label, files, lessons: lessonReports } of report.voices) {
      const problems = files.filter(({ issues }) => issues.length > 0);
      const interfaceClips = files.filter(({ id }) => id.startsWith("interface/"));
      console.log(`\n${label} · ${files.length - problems.length}/${catalog.size} faixas prontas`);
      for (const lesson of lessonReports) {
        const { complete, guided } = lesson;
        console.log(`${lesson.title} · Completo ${complete.ready}/${complete.total} · Guiado ${guided.ready}/${guided.total}`);
        for (const section of lesson.sections) console.log(`  ${section.title} · ${section.ready}/${section.total}`);
        for (const id of lesson.divergent) console.log(`  Etapa guiada diverge do texto ou ID no modo completo · ${id}`);
      }
      console.log(`Mensagens da interface · ${interfaceClips.filter(({ issues }) => issues.length === 0).length}/${interfaceClips.length}`);
      for (const { id, src, issues } of problems) console.log(`  ${issues.join(", ")} · ${id}${src ? ` · ${src}` : ""}`);
      if (decode) console.log(`Duração verificada · ${files.reduce((sum, file) => sum + (file.durationSeconds ?? 0), 0).toFixed(2)} s`);
    }
  }
  return report.voices.length > 0 && report.voices.every(({ files, lessons: lessonReports }) =>
    files.every(({ issues }) => issues.length === 0) && lessonReports.every(({ divergent }) => divergent.length === 0));
}
