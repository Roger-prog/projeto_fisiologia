"use client";

import { formatReviewDate, reviewGradeLabels, type ReviewGrade } from "@/lib/review-schedule";
import { recordReview } from "@/lib/study-storage";
import { useStudy } from "./study-provider";

const grades: readonly ReviewGrade[] = ["easy", "hard", "forgot"];

export function ReviewGradeControls({ onGrade }: { onGrade: (grade: ReviewGrade) => void }) {
  return (
    <div className="review-grade-controls">
      <p>Como foi a lembrança?</p>
      <div className="control-row" role="group" aria-label="Como foi a lembrança?">
        {grades.map((grade) => (
          <button type="button" className="button button-secondary" key={grade} onClick={() => onGrade(grade)}>
            {reviewGradeLabels[grade]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function QuickReviewRating({ reviewId }: { reviewId: string }) {
  const review = useStudy().progress.reviews[reviewId];

  return (
    <div className="review-card-rating">
      <ReviewGradeControls onGrade={(grade) => recordReview(reviewId, grade)} />
      <p className="review-scheduled-status" role="status">
        {review && <>{reviewGradeLabels[review.grade]}. Próxima revisão em <time dateTime={review.dueAt}>{formatReviewDate(review.dueAt)}</time>.</>}
      </p>
    </div>
  );
}
