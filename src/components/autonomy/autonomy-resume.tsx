"use client";

import { useId, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { autonomyStepHref } from "@/lib/autonomy-routes";
import { getClientStudyState, subscribeToStudyState } from "@/lib/study-storage";

type LessonChoice = { id: string; title: string; steps: readonly { id: string; title: string }[] };

function getPendingState() {
  return null;
}

export function AutonomyResume({ choices }: { choices: readonly LessonChoice[] }) {
  const state = useSyncExternalStore<ReturnType<typeof getClientStudyState> | null>(
    subscribeToStudyState,
    getClientStudyState,
    getPendingState,
  );
  const descriptionId = useId();

  if (!state) {
    // A fallback link could open the first lesson before the saved step loads.
    return <button className="button button-primary" type="button" disabled>Continuar estudando</button>;
  }

  const { lastLesson, lessons } = state.progress;
  const lesson = choices.find(({ id }) => id === lastLesson?.id) ?? choices[0];
  if (!lesson) return null;

  const lastSectionId = lastLesson?.id === lesson.id ? lastLesson.section?.id : undefined;
  const savedStep = lesson.steps.find(({ id }) => id === lastSectionId)
    ?? lesson.steps.find(({ id }) => id === lessons[lesson.id]?.lastGuidedStep);
  const step = savedStep ?? lesson.steps[0];

  return (
    <div className="resume-study">
      <p id={descriptionId}>
        {savedStep ? "Você estava estudando" : "Comece por"}{" "}
        <strong>{lesson.title} · {step.title}</strong>
      </p>
      <Link className="button button-primary" href={autonomyStepHref(lesson.id, step.id)} aria-describedby={descriptionId}>
        Continuar estudando <ArrowRight size={19} aria-hidden="true" />
      </Link>
    </div>
  );
}
