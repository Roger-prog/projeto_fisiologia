"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getReviewPrompt, type ReviewItem } from "@/data/review-items";
import {
  formatReviewDate,
  initialQuestionReview,
  isReviewDue,
  reviewGradeLabels,
  type ReviewRecord,
} from "@/lib/review-schedule";
import { ReviewSession } from "./review-session";
import { ClearProgress, useStudy } from "./study-provider";

type QueuedReview = {
  item: ReviewItem;
  record?: ReviewRecord;
  due: boolean;
  needsPractice: boolean;
};

function getQueue(items: readonly ReviewItem[], progress: ReturnType<typeof useStudy>["progress"], now: Date) {
  return items.flatMap((item): QueuedReview[] => {
    const saved = progress.reviews[item.id];
    const answer = item.kind === "question" ? progress.lessons[item.lessonId]?.questionPractice[item.question.id] : undefined;
    if (item.kind === "question" && !answer && !saved) return [];

    const correct = item.kind === "question" && answer?.optionId === item.question.correctOptionId;
    const record = saved ?? (answer && initialQuestionReview(answer.answeredAt, correct));
    const newerWrongAnswer = answer && !correct && (!saved || Date.parse(answer.answeredAt) > Date.parse(saved.reviewedAt));

    return [{
      item,
      record,
      due: Boolean(record && isReviewDue(record.dueAt, now)),
      needsPractice: Boolean(newerWrongAnswer || (record && record.grade !== "easy")),
    }];
  });
}

function priority(review: QueuedReview) {
  if (review.due) return 0;
  if (review.needsPractice) return 1;
  return review.record ? 3 : 2;
}

function makeSession(queue: readonly QueuedReview[]) {
  const ordered = [...queue].sort((a, b) => priority(a) - priority(b)
    || (a.record?.dueAt ?? "").localeCompare(b.record?.dueAt ?? ""));
  const selected = ordered.slice(0, 5);
  const otherKind = selected.length && ordered.find(({ item }) => item.kind !== selected[0].item.kind);
  if (otherKind && !selected.includes(otherKind)) selected[selected.length - 1] = otherKind;
  return selected;
}

export function ReviewDashboard({ items }: { items: readonly ReviewItem[] }) {
  const { progress } = useStudy();
  const [session, setSession] = useState<QueuedReview[] | null>(null);
  const startButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const queue = getQueue(items, progress, new Date());
  const due = queue.filter((review) => review.due);
  const needsPractice = queue.filter((review) => review.needsPractice);
  const catalog = new Map(items.map((item) => [item.id, item]));
  const history = progress.reviewHistory.flatMap((event) => {
    const item = catalog.get(event.itemId);
    return item ? [{ ...event, item }] : [];
  });

  useEffect(() => {
    if (!session && returnFocus.current) {
      startButton.current?.focus();
      returnFocus.current = false;
    }
  }, [session]);

  if (session) {
    return (
      <ReviewSession queue={session} onClose={() => {
        returnFocus.current = true;
        setSession(null);
      }} />
    );
  }

  return (
    <div className="review-dashboard">
      <section className="study-panel review-session" aria-labelledby="sessao-curta">
        <h2 id="sessao-curta">Sessão curta de estudo</h2>
        <p>Pratique até cinco conceitos. A sessão prioriza revisões previstas para hoje e pode combinar cartões com questões que você já respondeu.</p>
        <div className="control-row">
          <button
            type="button"
            className="button button-primary"
            ref={startButton}
            disabled={!queue.length}
            onClick={() => setSession(makeSession(getQueue(items, progress, new Date())))}
          >
            Iniciar sessão curta
          </button>
          <Link className="text-link" href="/revisao/">Abrir a revisão rápida</Link>
        </div>
      </section>

      <div className="review-grid">
        <section className="study-panel" aria-labelledby="revisoes-hoje">
          <h2 id="revisoes-hoje">Revisões de hoje</h2>
          {due.length ? <ReviewItemList reviews={due} /> : <p>Nenhuma revisão prevista para hoje.</p>}
        </section>
        <section className="study-panel" aria-labelledby="revisoes-pratica">
          <h2 id="revisoes-pratica">Conceitos que precisam de mais prática</h2>
          {needsPractice.length ? <ReviewItemList reviews={needsPractice} /> : <p>Nenhum conceito sinalizado até agora.</p>}
        </section>
      </div>

      <section className="study-panel" aria-labelledby="revisoes-disponiveis">
        <h2 id="revisoes-disponiveis">Conceitos disponíveis para revisão</h2>
        <details className="review-card review-dashboard-details">
          <summary>Ver conceitos disponíveis ({queue.length}) <ChevronDown size={18} aria-hidden="true" /></summary>
          <ReviewItemList reviews={queue} />
        </details>
      </section>

      <section className="study-panel" aria-labelledby="revisoes-historico">
        <h2 id="revisoes-historico">Histórico de revisão</h2>
        {history.length ? (
          <details className="review-card review-dashboard-details">
            <summary>Ver registros ({history.length}) <ChevronDown size={18} aria-hidden="true" /></summary>
            <ol className="review-item-list" role="list">
              {history.map(({ item, grade, reviewedAt }, index) => (
                <li key={`${item.id}-${reviewedAt}-${index}`}>
                  <p><strong>{getReviewPrompt(item)}</strong></p>
                  <p className="muted"><time dateTime={reviewedAt}>{formatReviewDate(reviewedAt)}</time> · {reviewGradeLabels[grade]}</p>
                </li>
              ))}
            </ol>
          </details>
        ) : <p>O histórico aparece quando você registra sua lembrança.</p>}
      </section>

      <section className="study-panel" aria-labelledby="revisoes-dados">
        <h2 id="revisoes-dados">Progresso neste navegador</h2>
        <p>Você pode apagar as revisões, as respostas e o progresso das aulas a qualquer momento.</p>
        <ClearProgress />
      </section>
    </div>
  );
}

function ReviewItemList({ reviews }: { reviews: readonly QueuedReview[] }) {
  return (
    <ul className="review-item-list" role="list">
      {reviews.map(({ item, record }) => (
        <li key={item.id}>
          {item.kind === "card" ? (
            <Link className="text-link" href={`/revisao/#cartao-${item.card.id}`}>{item.card.prompt}</Link>
          ) : (
            <>
              <p><strong>{item.question.prompt}</strong></p>
              <Link className="text-link" href={`/aulas/${item.lessonId}/#${item.question.sectionId}`}>
                Rever {item.question.concept.toLocaleLowerCase("pt-BR")}
              </Link>
            </>
          )}
          <p className="muted">{item.lessonTitle}</p>
          {record && <p>Próxima revisão em <time dateTime={record.dueAt}>{formatReviewDate(record.dueAt)}</time>.</p>}
        </li>
      ))}
    </ul>
  );
}
