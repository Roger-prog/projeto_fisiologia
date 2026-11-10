import { lessons, type Lesson } from "../data/index";
import { getStepSpeechText } from "./lesson-speech";
import { getLessonSteps, type LessonStep } from "./lesson-steps";
import {
  exerciseResultNarration, exerciseTitleNarration, explanationNarration, fixedNarration,
  lessonListNarration, narrationMessages, questionNarration, questionNumberNarration,
  reviewCardNarration, selectedOptionNarration, stepLabelNarration, type NarrationMessage,
} from "./narration-messages";

type NarrationClip = { id: string; path: string; text: string };
const targetBlockBytes = 700;
const encoder = new TextEncoder();

function splitForListening(text: string) {
  const blocks: string[] = [];
  let block = "";
  for (const paragraph of text.split("\n").map((line) => line.trim()).filter(Boolean)) {
    const candidate = block ? `${block}\n${paragraph}` : paragraph;
    if (block && encoder.encode(candidate).length > targetBlockBytes) {
      blocks.push(block);
      block = paragraph;
    } else {
      block = candidate;
    }
  }
  if (block) blocks.push(block);
  return blocks;
}

function makeClips(lesson: Lesson, sectionId: string, text: string): NarrationClip[] {
  return splitForListening(text).map((block, index) => ({
    id: `lesson/${lesson.id}/${sectionId}/${index + 1}`,
    path: `${lesson.moduleId}/${lesson.id}/${sectionId}-${String(index + 1).padStart(2, "0")}`,
    text: block,
  }));
}

export function getStepNarrationClips(lesson: Lesson, step: LessonStep) {
  return makeClips(lesson, step.id, getStepSpeechText(lesson, step));
}

export function getLessonNarrationClips(lesson: Lesson) {
  const steps = getLessonSteps(lesson);
  const terms = ["Termos importantes.", ...lesson.terms.map(({ term, definition }) => `${term}. ${definition}`)];
  return [
    ...makeClips(lesson, "titulo", `${lesson.title}.`),
    ...steps.slice(0, -1).flatMap((step) => getStepNarrationClips(lesson, step)),
    ...makeClips(lesson, "termos", terms.join("\n")),
    ...getStepNarrationClips(lesson, steps[steps.length - 1]),
  ];
}

export function getNarrationCatalog(): readonly NarrationClip[] {
  const totals = [...new Set(lessons.map(({ questions }) => questions.length))];
  const lines = [
    ...(Object.keys(narrationMessages) as NarrationMessage[]).map(fixedNarration),
    lessonListNarration(lessons),
    ...lessons.flatMap((lesson) => [
      exerciseTitleNarration(lesson),
      ...getLessonSteps(lesson).map((step, index) => stepLabelNarration(lesson, step, index)),
      ...lesson.questions.flatMap((question) => [
        questionNarration(question),
        explanationNarration(question),
        ...question.options.map((_, index) => selectedOptionNarration(question, index)),
      ]),
      ...lesson.quickReview.flatMap((card) => [reviewCardNarration(card, false), reviewCardNarration(card, true)]),
    ]),
    ...Array.from({ length: Math.max(0, ...totals) }, (_, index) => questionNumberNarration(index + 1)),
    ...totals.flatMap((total) => Array.from({ length: total + 1 }, (_, correct) => exerciseResultNarration(correct, total))),
  ];
  return [
    ...lessons.flatMap(getLessonNarrationClips),
    ...lines.map(({ id, text }) => ({ id, path: id, text })),
  ];
}
