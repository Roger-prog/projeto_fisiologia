"use client";

import { Brain, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { useVoiceActions } from "@/components/voice/voice-provider";
import type { ReviewCard } from "@/data";
import { fixedNarration, narratedMessage, reviewCardNarration } from "@/lib/narration-messages";
import { getReviewId } from "@/lib/review-schedule";
import { QuickReviewRating } from "./review-grades";

export function QuickReview({ id, title, lessonId, summary, items }: {
  id: string;
  title: string;
  lessonId: string;
  summary: readonly string[];
  items: readonly ReviewCard[];
}) {
  const panel = useRef<HTMLElement>(null);
  const currentCard = useRef(0);

  useVoiceActions((command) => {
    const hash = window.location.hash;
    const currentPanel = hash.startsWith("#revisao-") ? hash === `#${id}` : panel.current?.contains(document.activeElement);
    if (!items.length || !currentPanel) return;
    const focused = document.activeElement?.closest("details[id^='cartao-']");
    const focusedIndex = items.findIndex((item) => focused?.id === `cartao-${item.id}`);
    const index = focusedIndex >= 0 ? focusedIndex : currentCard.current;
    if (command.kind === "next-question" || command.kind === "previous-question") {
      const next = index + (command.kind === "next-question" ? 1 : -1);
      if (next < 0 || next >= items.length) {
        return narratedMessage(fixedNarration(next < 0 ? "primeiro-cartao" : "ultimo-cartao"));
      }
      currentCard.current = next;
      document.getElementById(`cartao-${items[next].id}`)?.focus();
      return narratedMessage(reviewCardNarration(items[next], false));
    }
    if (command.kind === "reveal-review-answer" || command.kind === "read-question" ||
      command.kind === "start-reading" || command.kind === "repeat-reading") {
      const card = items[index];
      const details = document.getElementById(`cartao-${card.id}`);
      if (!(details instanceof HTMLDetailsElement)) return;
      currentCard.current = index;
      if (command.kind === "reveal-review-answer") details.open = true;
      return narratedMessage(reviewCardNarration(card, details.open && command.kind !== "read-question"));
    }
  });

  if (!items.length) return null;

  return (
    <section ref={panel} className="study-panel quick-review" id={id} aria-labelledby={`${id}-titulo`} tabIndex={-1}>
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
