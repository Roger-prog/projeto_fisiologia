import type { Lesson } from "@/data";

export function getLessonSpeechText(lesson: Lesson) {
  return [
    `${lesson.title}.`,
    `Objetivo de aprendizagem. ${lesson.objective}`,
    "Introdução.",
    lesson.introduction,
    ...lesson.sections.flatMap((section) => [`${section.title}.`, ...section.paragraphs]),
    `Descrição do esquema. ${lesson.figure.title}. ${lesson.figure.description}`,
    "Termos importantes.",
    ...lesson.terms.map(({ term, definition }) => `${term}. ${definition}`),
    "Resumo.",
    ...lesson.summary,
  ].join("\n");
}
