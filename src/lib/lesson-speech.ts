import type { Lesson } from "@/data";
import { getLessonSteps, type LessonStep } from "./lesson-steps";

function getStepNarration(step: LessonStep, figure?: Lesson["figure"]) {
  return [
    `${step.title}.`,
    `Objetivo de aprendizagem. ${step.objective}`,
    ...step.paragraphs,
    ...(step.example
      ? [`Exemplo. ${step.example.title}.`, step.example.formula?.spoken, ...step.example.paragraphs]
      : []),
    ...(step.summary ? [`Resumo da etapa. ${step.summary}`] : []),
    ...(figure ? [`Descrição do esquema. ${figure.title}.`, ...figure.descriptionSteps] : []),
  ].filter(Boolean);
}

export function getStepSpeechText(lesson: Lesson, step: LessonStep) {
  const figure = step.id === lesson.figure.sectionId ? lesson.figure : undefined;
  return getStepNarration(step, figure).join("\n");
}

export function getLessonSpeechText(lesson: Lesson) {
  const steps = getLessonSteps(lesson);
  const summary = steps[steps.length - 1];
  return [
    `${lesson.title}.`,
    ...steps.slice(0, -1).flatMap((step) => getStepNarration(step)),
    `Descrição do esquema. ${lesson.figure.title}.`,
    ...lesson.figure.descriptionSteps,
    "Termos importantes.",
    ...lesson.terms.map(({ term, definition }) => `${term}. ${definition}`),
    ...getStepNarration(summary),
  ].join("\n");
}
