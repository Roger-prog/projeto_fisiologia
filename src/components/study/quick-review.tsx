import { Brain, ChevronDown } from "lucide-react";
import Link from "next/link";
import type { ReviewCard } from "@/data";
import { getReviewId } from "@/lib/review-schedule";
import { QuickReviewRating } from "./review-grades";

export function QuickReview({ id, title, lessonId, summary, items }: {
  id: string;
  title: string;
  lessonId: string;
  summary: readonly string[];
  items: readonly ReviewCard[];
}) {
  if (!items.length) return null;

  return (
    <section className="study-panel quick-review" id={id} aria-labelledby={`${id}-titulo`} tabIndex={-1}>
      <div className="quick-review-heading">
        <Brain aria-hidden="true" size={22} />
        <h2 id={`${id}-titulo`}>{title}</h2>
      </div>
      <details className="review-card review-summary">
        <summary>Resumo da aula <ChevronDown size={18} aria-hidden="true" /></summary>
        <ul role="list">{summary.map((point) => <li key={point}>{point}</li>)}</ul>
      </details>
      <ul className="review-list" role="list">
        {items.map((item) => (
          <li key={item.id}>
            <details className="review-card" id={`cartao-${item.id}`} tabIndex={-1}>
              <summary>
                <span>{item.prompt}</span>
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <p>{item.answer}</p>
              <QuickReviewRating reviewId={getReviewId(lessonId, "card", item.id)} />
            </details>
          </li>
        ))}
      </ul>
      <Link className="text-link" href={`/aulas/${lessonId}/#exercicios`}>Abrir os exercícios de {title}</Link>
    </section>
  );
}
