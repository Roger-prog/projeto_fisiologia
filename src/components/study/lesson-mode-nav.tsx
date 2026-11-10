"use client";

import Link from "next/link";
import { useStudy } from "@/components/study/study-provider";
import { guidedLessonHref } from "@/lib/lesson-steps";

export function LessonModeNav({
  lessonId,
  stepIds,
  current,
  stepId,
}: {
  lessonId: string;
  stepIds: readonly string[];
  current: "complete" | "guided";
  stepId?: string;
}) {
  const savedStep = useStudy().progress.lessons[lessonId]?.lastGuidedStep;
  const startStep = savedStep && stepIds.includes(savedStep) ? savedStep : stepIds[0];
  const modes = [
    { id: "complete", label: "Modo completo", href: `/aulas/${lessonId}/${stepId ? `#${stepId}` : ""}` },
    { id: "guided", label: "Modo guiado", href: guidedLessonHref(lessonId, startStep) },
    { id: "review", label: "Modo revisão", href: `/revisao/#revisao-${lessonId}` },
  ];

  return (
    <nav aria-label="Modos de estudo" className="control-row my-4">
      {modes.map((mode) => mode.id === current ? (
        <span className="button button-primary pointer-events-none" key={mode.id} aria-current="page">{mode.label}</span>
      ) : (
        <Link className="button button-secondary" key={mode.id} href={mode.href}>{mode.label}</Link>
      ))}
    </nav>
  );
}
