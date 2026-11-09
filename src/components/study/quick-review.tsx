import { Brain, ChevronDown } from "lucide-react";
import type { ReviewCard } from "@/data";

export function QuickReview({ id, title, items }: { id: string; title: string; items: readonly ReviewCard[] }) {
  if (!items.length) return null;

  return (
    <section className="study-panel quick-review" id={id} aria-labelledby={`${id}-titulo`} tabIndex={-1}>
      <div className="quick-review-heading">
        <Brain aria-hidden="true" size={22} />
        <h2 id={`${id}-titulo`}>{title}</h2>
      </div>
      <ul className="review-list">
        {items.map((item) => (
          <li key={item.id}>
            <details className="review-card">
              <summary>
                <span>{item.prompt}</span>
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <p>{item.answer}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
