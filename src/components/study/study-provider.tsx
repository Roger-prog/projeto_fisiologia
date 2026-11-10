"use client";

import { Accessibility, ArrowRight, Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  clearStudyProgress,
  getClientStudyState,
  getServerStudyState,
  setStudyPreferences,
  subscribeToStudyState,
  type TextSize,
  toggleLessonCompletion,
} from "@/lib/study-storage";

const StudyContext = createContext(getServerStudyState());

export function StudyProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribeToStudyState, getClientStudyState, getServerStudyState);
  const { contrast, textSize } = state.preferences;

  useEffect(() => {
    document.documentElement.dataset.contrast = contrast;
    document.documentElement.dataset.textSize = textSize;
  }, [contrast, textSize]);

  return <StudyContext.Provider value={state}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  return useContext(StudyContext);
}

export function AccessibilityControls() {
  const { contrast, textSize } = useStudy().preferences;
  const summaryRef = useRef<HTMLElement>(null);
  const sizeId = useId();

  return (
    <details
      className="accessibility-controls"
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
          event.currentTarget.open = false;
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && event.currentTarget.open) {
          event.currentTarget.open = false;
          summaryRef.current?.focus();
        }
      }}
    >
      <summary ref={summaryRef} className="button button-secondary accessibility-trigger">
        <Accessibility aria-hidden="true" size={18} />
        Acessibilidade
        <ChevronDown aria-hidden="true" size={16} />
      </summary>
      <div className="accessibility-panel">
        <button
          type="button"
          className="button button-secondary"
          aria-pressed={contrast === "high"}
          onClick={() => setStudyPreferences({ contrast: contrast === "high" ? "default" : "high" })}
        >
          Alto contraste
        </button>
        <label className="field-label" htmlFor={sizeId}>Tamanho do texto</label>
        <select
          className="study-select"
          id={sizeId}
          value={textSize}
          onChange={(event) => setStudyPreferences({ textSize: event.target.value as TextSize })}
        >
          <option value="normal">Padrão</option>
          <option value="large">Grande</option>
          <option value="extra-large">Extra grande</option>
        </select>
      </div>
    </details>
  );
}

export function ResumeStudy() {
  const { lastLesson } = useStudy().progress;
  const descriptionId = useId();
  if (!lastLesson) return null;

  const lessonHref = `/aulas/${lastLesson.id}/`;
  const { section } = lastLesson;
  const href = section?.mode === "guided"
    ? `${lessonHref}guiado/${section.id}/`
    : section ? `${lessonHref}#${section.id}` : lessonHref;

  return (
    <div className="resume-study">
      <p id={descriptionId}>
        Você estava estudando <strong>{lastLesson.title}</strong>
        {section && <> · {section.title}</>}
      </p>
      <Link className="button button-secondary" href={href} aria-describedby={descriptionId}>
        Continuar estudando
        <ArrowRight aria-hidden="true" size={18} />
      </Link>
    </div>
  );
}

export function LessonProgress({ lessonId }: { lessonId: string }) {
  const completed = Boolean(useStudy().progress.lessons[lessonId]?.completedAt);

  return (
    <div className="control-row lesson-completion">
      <button
        type="button"
        className="button button-secondary"
        aria-pressed={completed}
        onClick={() => toggleLessonCompletion(lessonId)}
      >
        <Check aria-hidden="true" size={18} />
        Marcar aula como concluída
      </button>
      <span role="status">{completed ? "Aula concluída" : ""}</span>
    </div>
  );
}

export function ClearProgress() {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const confirmationId = useId();

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  function closeConfirmation() {
    setConfirming(false);
    triggerRef.current?.focus();
  }

  return (
    <div className="clear-progress">
      <button
        type="button"
        className="button button-secondary"
        ref={triggerRef}
        aria-expanded={confirming}
        aria-controls={confirmationId}
        onClick={() => {
          setMessage("");
          setConfirming(!confirming);
        }}
      >
        Apagar progresso
      </button>
      <div id={confirmationId} hidden={!confirming} className="clear-progress-confirmation">
        <p>Esta ação apaga as respostas, as etapas concluídas, a última aula aberta e as revisões salvas neste navegador.</p>
        <div className="control-row">
          <button
            ref={confirmRef}
            type="button"
            className="button button-primary"
            onClick={() => {
              clearStudyProgress();
              closeConfirmation();
              setMessage("Progresso apagado deste navegador.");
            }}
          >
            Confirmar exclusão
          </button>
          <button type="button" className="button button-secondary" onClick={closeConfirmation}>Cancelar</button>
        </div>
      </div>
      <p className="clear-progress-status" role="status">{message}</p>
    </div>
  );
}
