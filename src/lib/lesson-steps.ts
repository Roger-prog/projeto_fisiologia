import type { Lesson, LessonSection } from "@/data";

export type LessonStep = Omit<LessonSection, "summary"> & {
  kind: "introduction" | "section" | "summary";
  summary?: string;
};

export function getLessonSteps(lesson: Lesson): readonly LessonStep[] {
  return [
    {
      id: "introducao",
      kind: "introduction",
      title: "Introdução",
      objective: lesson.objective,
      paragraphs: [lesson.introduction],
      summary: lesson.introductionSummary,
    },
    ...lesson.sections.map((section): LessonStep => ({ ...section, kind: "section" })),
    {
      id: "resumo",
      kind: "summary",
      title: "Resumo e revisão",
      objective: "Recuperar os conceitos principais da aula e aplicá-los nos exercícios.",
      paragraphs: lesson.summary,
    },
  ];
}

export function guidedLessonHref(lessonId: string, stepId: string) {
  return `/aulas/${lessonId}/guiado/${stepId}/`;
}
