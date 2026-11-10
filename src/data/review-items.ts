import { getReviewId } from "@/lib/review-schedule";
import type { Lesson, Question, ReviewCard } from "./types";

export type ReviewItem = {
  id: string;
  lessonId: string;
  lessonTitle: string;
} & (
  | { kind: "card"; card: ReviewCard }
  | { kind: "question"; question: Question }
);

export function getReviewItems(lessons: readonly Lesson[]): ReviewItem[] {
  return lessons.flatMap((lesson): ReviewItem[] => {
    const source = { lessonId: lesson.id, lessonTitle: lesson.title };
    return [
      ...lesson.quickReview.map((card) => ({
        ...source, id: getReviewId(lesson.id, "card", card.id), kind: "card" as const, card,
      })),
      ...lesson.questions.map((question) => ({
        ...source, id: getReviewId(lesson.id, "question", question.id), kind: "question" as const, question,
      })),
    ];
  });
}

export function getReviewPrompt(item: ReviewItem) {
  return item.kind === "card" ? item.card.prompt : item.question.prompt;
}
