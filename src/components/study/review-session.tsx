"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useVoiceQuestion } from "@/components/voice/use-voice-question";
import { useVoiceActions } from "@/components/voice/voice-provider";
import type { ReviewItem } from "@/data/review-items";
import { narratedMessage, reviewCardNarration } from "@/lib/narration-messages";
import type { ReviewGrade, ReviewRecord } from "@/lib/review-schedule";
import { recordReview } from "@/lib/study-storage";
import { QuestionConfirmation, QuestionFeedback, QuestionOptions } from "./question-parts";
import { ReviewGradeControls } from "./review-grades";

export function ReviewSession({ queue, onClose }: {
  queue: readonly { item: ReviewItem; record?: ReviewRecord }[];
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const current = queue[index];

  useEffect(() => {
    heading.current?.focus();
  }, [index]);

  function gradeItem(grade: ReviewGrade) {
    recordReview(current.item.id, grade, current.record);
    setIndex(index + 1);
  }

  return (
    <section className="study-panel review-session" aria-labelledby="sessao-curta">
      <h2 id="sessao-curta">Sessão curta de estudo</h2>
      {current ? (
        <>
          <h3 ref={heading} tabIndex={-1}>Conceito {index + 1} de {queue.length}</h3>
          <p className="muted">{current.item.lessonTitle}</p>
          <ReviewStep key={current.item.id} item={current.item} onGrade={gradeItem} />
          <button type="button" className="button button-secondary" onClick={onClose}>Encerrar sessão</button>
        </>
      ) : (
        <>
          <h3 ref={heading} tabIndex={-1}>Sessão concluída</h3>
          <p>Você revisou {queue.length} {queue.length === 1 ? "conceito" : "conceitos"}. Consulte as próximas datas na sua lista de revisões.</p>
          <button type="button" className="button button-primary" onClick={onClose}>Voltar para Minhas Revisões</button>
        </>
      )}
    </section>
  );
}

function ReviewStep({ item, onGrade }: { item: ReviewItem; onGrade: (grade: ReviewGrade) => void }) {
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const response = useRef<HTMLParagraphElement>(null);
  const focusResponse = useRef(false);
  const groupName = useId();

  useEffect(() => {
    if (revealed && focusResponse.current) response.current?.focus();
  }, [revealed]);

  function answerQuestion(optionId: string | null, moveFocus = true) {
    if (!optionId || revealed) return false;
    clearVoiceChoice();
    focusResponse.current = moveFocus;
    setSelected(optionId);
    setRevealed(true);
    return true;
  }

  const clearVoiceChoice = useVoiceQuestion({
    question: item.kind === "question" ? item.question : undefined,
    isActive: () => true,
    answered: revealed,
    onSelect: setSelected,
    onConfirm: (optionId) => answerQuestion(optionId, false),
    confirmation: "resposta-conferida",
  });

  useVoiceActions((command) => {
    if (item.kind !== "card") return;
    if (command.kind === "reveal-review-answer") {
      setRevealed(true);
      return narratedMessage(reviewCardNarration(item.card, true));
    }
    if (command.kind === "read-question" || command.kind === "start-reading" || command.kind === "repeat-reading") {
      return narratedMessage(reviewCardNarration(item.card, revealed));
    }
  });

  return (
    <div className="review-session-body">
      {item.kind === "card" ? (
        <>
          <p><strong>{item.card.prompt}</strong></p>
          {revealed ? (
            <p ref={response} tabIndex={-1}>{item.card.answer}</p>
          ) : (
            <button type="button" className="button button-primary" onClick={() => {
              focusResponse.current = true;
              setRevealed(true);
            }}>
              Revelar resposta
            </button>
          )}
        </>
      ) : (
        <form className="review-session-body" onSubmit={(event) => event.preventDefault()}>
          <QuestionOptions
            question={item.question}
            groupName={groupName}
            selectedId={selected}
            onSelect={(optionId) => {
              clearVoiceChoice();
              setSelected(optionId);
            }}
            disabled={revealed}
          />
          {revealed && selected ? (
            <QuestionFeedback question={item.question} lessonId={item.lessonId} optionId={selected} feedbackRef={response} />
          ) : (
            <QuestionConfirmation onConfirm={() => answerQuestion(selected)} />
          )}
        </form>
      )}
      {revealed && <ReviewGradeControls onGrade={onGrade} />}
    </div>
  );
}
