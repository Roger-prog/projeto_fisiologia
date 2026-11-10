import type { Question } from "@/data";

export function optionLetter(index: number) {
  return String.fromCharCode("A".charCodeAt(0) + index);
}

export function voiceQuestionText(question: Question) {
  return [
    question.prompt,
    ...question.options.map((option, index) => `Alternativa ${optionLetter(index)}. ${option.text}`),
  ].join("\n");
}
