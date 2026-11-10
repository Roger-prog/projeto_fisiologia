"use client";

import { useEffect } from "react";
import { getClientStudyState, visitLesson } from "@/lib/study-storage";

type Step = { id: string; title: string };

export function TrackLessonVisit({
  lessonId,
  lessonTitle,
  steps,
  guidedStep,
}: {
  lessonId: string;
  lessonTitle: string;
  steps?: readonly Step[];
  guidedStep?: Step;
}) {
  useEffect(() => {
    const lesson = { id: lessonId, title: lessonTitle };

    if (guidedStep) {
      visitLesson({ ...lesson, section: { ...guidedStep, mode: "guided" } });
      document.getElementById("titulo-etapa")?.focus();
      return;
    }

    function recordSection(hash: string) {
      const step = steps?.find(({ id }) => hash === `#${id}`);
      if (step) {
        visitLesson({ ...lesson, section: { ...step, mode: "complete" } });
      } else if (!hash) {
        visitLesson(lesson);
      }
    }

    function recordCurrentSection() {
      recordSection(window.location.hash);
    }

    function recordSamePageLink(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (target?.hash && target.origin === window.location.origin && target.pathname === window.location.pathname) {
        recordSection(target.hash);
      }
    }

    recordCurrentSection();
    if (getClientStudyState().progress.lastLesson?.id !== lessonId) visitLesson(lesson);
    window.addEventListener("hashchange", recordCurrentSection);
    document.addEventListener("click", recordSamePageLink);
    return () => {
      window.removeEventListener("hashchange", recordCurrentSection);
      document.removeEventListener("click", recordSamePageLink);
    };
  }, [guidedStep, lessonId, lessonTitle, steps]);

  return null;
}
