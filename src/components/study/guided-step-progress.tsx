"use client";

import { Check } from "lucide-react";
import { useStudy } from "@/components/study/study-provider";
import { toggleStepCompletion } from "@/lib/study-storage";

export function GuidedStepProgress({ lessonId, stepId }: { lessonId: string; stepId: string }) {
  const completed = Boolean(useStudy().progress.lessons[lessonId]?.completedSteps[stepId]);

  return (
    <div className="control-row">
      <button
        type="button"
        className="button button-secondary"
        aria-pressed={completed}
        onClick={() => toggleStepCompletion(lessonId, stepId)}
      >
        <Check size={18} aria-hidden="true" />
        Marcar etapa como concluída
      </button>
      <span role="status">{completed ? "Etapa concluída" : ""}</span>
    </div>
  );
}
