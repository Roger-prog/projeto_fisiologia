"use client";

import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import type { ReviewItem } from "@/data/review-items";
import type { ReviewGrade, ReviewRecord } from "@/lib/review-schedule";
import { recordReview } from "@/lib/study-storage";
import { QuestionFeedback, QuestionOptions } from "./question-parts";
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
  const groupName = useId();

  useEffect(() => {
    if (revealed) response.current?.focus();
  }, [revealed]);

  function answerQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected) setRevealed(true);
  }

  return (
    <div className="review-session-body">
      {item.kind === "card" ? (
        <>
          <p><strong>{item.card.prompt}</strong></p>
          {revealed ? (
            <p ref={response} tabIndex={-1}>{item.card.answer}</p>
          ) : (
            <button type="button" className="button button-primary" onClick={() => setRevealed(true)}>
              Revelar resposta
            </button>
          )}
        </>
      ) : (
        <form className="review-session-body" onSubmit={answerQuestion}>
          <QuestionOptions
            question={item.question}
            groupName={groupName}
            selectedId={selected}
            onSelect={setSelected}
            disabled={revealed}
          />
          {revealed && selected ? (
            <QuestionFeedback question={item.question} lessonId={item.lessonId} optionId={selected} feedbackRef={response} />
          ) : (
            <button type="submit" className="button button-primary">Conferir resposta</button>
          )}
        </form>
      )}
      {revealed && <ReviewGradeControls onGrade={onGrade} />}
    </div>
  );
}
