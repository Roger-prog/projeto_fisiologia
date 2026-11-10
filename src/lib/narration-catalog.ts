import { lessons, type Lesson } from "../data/index";
import { getStepSpeechText } from "./lesson-speech";
import { getLessonSteps, type LessonStep } from "./lesson-steps";
import { narrationMessages } from "./narration-messages";

type NarrationClip = { id: string; path: string; text: string };
const sentenceSegmenter = new Intl.Segmenter("pt-BR", { granularity: "sentence" });
const blockLimit = 400;

function splitForListening(text: string) {
  const blocks: string[] = [];
  let block = "";
  for (const paragraph of text.split("\n")) {
    let separator = "\n";
    for (const { segment } of sentenceSegmenter.segment(paragraph)) {
      const sentence = segment.trim();
      if (!sentence) continue;
      if (block && block.length + sentence.length + 1 > blockLimit) {
        blocks.push(block);
        block = "";
      }
      block = block ? block + separator + sentence : sentence;
      separator = " ";
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
  return [
    ...lessons.flatMap(getLessonNarrationClips),
    ...Object.entries(narrationMessages).map(([key, text]) => ({
      id: `interface/${key}`,
      path: `interface/${key}`,
      text,
    })),
  ];
}
