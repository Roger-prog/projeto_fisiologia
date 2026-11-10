import Link from "next/link";
import type { Ref } from "react";
import type { Question } from "@/data";
import { optionLetter } from "@/lib/voice-question";

export function QuestionOptions({ question, groupName, selectedId, onSelect, disabled }: {
  question: Question;
  groupName: string;
  selectedId: string | null;
  onSelect: (optionId: string) => void;
  disabled: boolean;
}) {
  return (
    <fieldset className="quiz-question" disabled={disabled}>
      <legend>{question.prompt}</legend>
      {question.options.map((option, index) => (
        <label key={`${question.id}-${option.id}`} className="quiz-option" data-selected={selectedId === option.id}>
          <input
            type="radio"
            name={groupName}
            value={option.id}
            checked={selectedId === option.id}
            onChange={() => onSelect(option.id)}
            required
          />
          <span><strong>{optionLetter(index)}.</strong> {option.text}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function QuestionConfirmation({ onConfirm }: { onConfirm: () => void }) {
  return (
    <button
      type="button"
      className="button button-primary"
      onClick={(event) => {
        if (event.currentTarget.form?.reportValidity()) onConfirm();
      }}
    >
      Conferir resposta
    </button>
  );
}

export function QuestionFeedback({ question, lessonId, optionId, feedbackRef }: {
  question: Question;
  lessonId: string;
  optionId: string;
  feedbackRef: Ref<HTMLParagraphElement>;
}) {
  const correct = optionId === question.correctOptionId;
  const correctOption = question.options.find((option) => option.id === question.correctOptionId);

  return (
    <div className="question-feedback-block">
      <p className="quiz-feedback" data-correct={correct} ref={feedbackRef} tabIndex={-1}>
        <strong>{correct ? "Resposta correta." : "Resposta incorreta."}</strong>
        {!correct && correctOption ? ` A alternativa correta é “${correctOption.text}”.` : ""}
        {` ${question.explanation}`}
      </p>
      {!correct && <p><strong>Explicação complementar.</strong> {question.supplement}</p>}
      <Link className="text-link" href={`/aulas/${lessonId}/#${question.sectionId}`}>
        Rever o trecho da aula
      </Link>
    </div>
  );
}
