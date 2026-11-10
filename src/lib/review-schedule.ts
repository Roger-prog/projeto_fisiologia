export type ReviewGrade = "easy" | "hard" | "forgot";

export type ReviewRecord = {
  dueAt: string;
  intervalIndex: number;
  grade: ReviewGrade;
  reviewedAt: string;
};

export const reviewIntervals = [1, 3, 7] as const;

export const reviewGradeLabels: Record<ReviewGrade, string> = {
  easy: "Lembrei com facilidade",
  hard: "Lembrei com dificuldade",
  forgot: "Não consegui lembrar",
};

export function getReviewId(lessonId: string, kind: "card" | "question", itemId: string) {
  return `${lessonId}:${kind}:${itemId}`;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString();
}

export function isReviewDue(dueAt: string, now: Date) {
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  return Date.parse(dueAt) <= endOfDay.getTime();
}

export function initialQuestionReview(answeredAt: string, correct: boolean): ReviewRecord | undefined {
  const answeredOn = new Date(answeredAt);
  if (!Number.isFinite(answeredOn.getTime())) return undefined;

  return {
    dueAt: addDays(answeredOn, reviewIntervals[0]),
    intervalIndex: 0,
    grade: correct ? "easy" : "forgot",
    reviewedAt: answeredAt,
  };
}

export function scheduleReview(previous: ReviewRecord | undefined, grade: ReviewGrade, now: Date): ReviewRecord {
  const reviewedAt = now.toISOString();
  const maxIndex = reviewIntervals.length - 1;
  const previousIndex = previous ? Math.min(maxIndex, Math.max(0, previous.intervalIndex)) : 0;
  const early = previous && !isReviewDue(previous.dueAt, now);
  if (grade === "easy" && early) {
    return { ...previous, intervalIndex: previousIndex, grade, reviewedAt };
  }

  let intervalIndex = 0;
  if (previous && grade === "easy") {
    intervalIndex = Math.min(previousIndex + 1, maxIndex);
  } else if (previous && grade === "hard") {
    intervalIndex = Math.max(previousIndex - 1, 0);
  }

  const proposed = addDays(now, reviewIntervals[intervalIndex]);
  const dueAt = early && Date.parse(previous.dueAt) < Date.parse(proposed) ? previous.dueAt : proposed;
  return { dueAt, intervalIndex, grade, reviewedAt };
}

const reviewDateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" });

export function formatReviewDate(date: string) {
  return reviewDateFormatter.format(new Date(date));
}
