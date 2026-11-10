import type { Question } from "@/data";
import { getQuestionOptionLabel } from "@/lib/question-option-label";
import { NarrationControls } from "./narration-controls";

export function QuestionNarration({ question }: { question: Question }) {
  const text = [
    question.prompt,
    ...question.options.map((option, index) => `${getQuestionOptionLabel(index)}. ${option.text}`),
  ].join("\n");

  return (
    <NarrationControls
      key={question.id}
      text={text}
      startLabel="Ouvir pergunta e alternativas"
      repeatLabel="Repetir pergunta"
      unavailableMessage="A leitura da pergunta está indisponível. Consulte a pergunta e as alternativas em texto."
    />
  );
}
