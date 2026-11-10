"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getLesson, lessons } from "@/data";
import { getLessonSteps, guidedLessonHref } from "@/lib/lesson-steps";
import { speakVoiceFeedback, stopActiveSpeech } from "@/lib/speech-playback";
import { getClientStudyState } from "@/lib/study-storage";
import { parseVoiceCommand, type VoiceCommand } from "@/lib/voice-commands";
import { useVoiceSession } from "./use-voice-session";
import { describeVoiceOptions, getVoiceContext } from "./voice-context";

export type VoiceAction = VoiceCommand | { kind: "session-ended" };
export type VoiceActionResult = { message: string; speak?: boolean };
type ActionHandler = (command: VoiceAction) => VoiceActionResult | undefined;
type RegisterAction = (handler: ActionHandler) => () => void;
type Feedback = { message: string; announce: boolean };
type VoiceInterface = {
  session: ReturnType<typeof useVoiceSession>;
  feedback: Feedback | null;
  activate: () => void;
  end: () => void;
  hearOptions: () => void;
  stopNarration: () => void;
};

const ActionsContext = createContext<RegisterAction | null>(null);
const ControlsContext = createContext<VoiceInterface | null>(null);
const navigationTimeout = 5000;

export function useVoiceActions(handler: ActionHandler) {
  const register = useContext(ActionsContext);
  const currentHandler = useRef(handler);
  useEffect(() => { currentHandler.current = handler; }, [handler]);
  useEffect(() => register?.((action) => currentHandler.current(action)), [register]);
}

export function useVoiceControls() {
  return useContext(ControlsContext);
}

export function VoiceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const handlers = useRef(new Set<ActionHandler>());
  const pending = useRef<{ href: string; until: number } | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const register = useCallback<RegisterAction>((handler) => {
    handlers.current.add(handler);
    return () => { handlers.current.delete(handler); };
  }, []);

  useEffect(() => {
    if (pending.current?.href === `${pathname}#exercicios` && window.location.hash === "#exercicios") {
      document.getElementById("exercicios")?.focus();
    }
  }, [pathname]);

  function publish({ message, speak = true }: VoiceActionResult) {
    const played = speak && speakVoiceFeedback(message);
    setFeedback({ message, announce: speak && !played });
  }

  function endActions() {
    pending.current = null;
    setFeedback(null);
    handlers.current.forEach((handler) => handler({ kind: "session-ended" }));
  }

  function dispatch(command: VoiceCommand) {
    for (const handler of handlers.current) {
      const result = handler(command);
      if (result) return result;
    }
  }

  function navigate(href: string, message: string): VoiceActionResult {
    const current = window.location.pathname + window.location.hash;
    if (current !== href) {
      pending.current = { href, until: Date.now() + navigationTimeout };
      router.push(href);
    }
    if (href === `${window.location.pathname}#exercicios`) {
      document.getElementById("exercicios")?.focus();
    }
    return { message };
  }

  function handleTranscript(transcript: string) {
    const command = parseVoiceCommand(transcript, lessons);
    if (!command) {
      publish({ message: "Comando não reconhecido. Diga Ajuda para ouvir as opções." });
      return;
    }
    if (command.kind === "end-session") {
      endInteraction();
      return;
    }

    const context = getVoiceContext(pathname, window.location.hash);
    if (command.kind === "help" || command.kind === "options") {
      publish({ message: describeVoiceOptions(context) });
      return;
    }
    if (pending.current) {
      if (pending.current.href !== pathname + window.location.hash && pending.current.until > Date.now()) {
        publish({ message: "Aguarde a página abrir e repita o comando." });
        return;
      }
      pending.current = null;
    }

    publish(runCommand(command, context) ?? {
      message: "Este comando não está disponível nesta tela. Diga Ajuda para ouvir as opções.",
    });
  }

  function runCommand(command: VoiceCommand, context: ReturnType<typeof getVoiceContext>): VoiceActionResult | undefined {
    const { lesson, stepIndex, steps, quiz, reviews } = context;
    switch (command.kind) {
      case "home":
        return navigate("/", "Página inicial.");
      case "reviews":
        return navigate("/minhas-revisoes/", "Minhas Revisões.");
      case "list-lessons":
        return { message: `Aulas disponíveis. ${lessons.map(({ title }) => title).join(". ")}. Diga Abrir aula e o nome da aula.` };
      case "resume-study": {
        const progress = getClientStudyState().progress;
        const lastLesson = progress.lastLesson;
        const savedLesson = lastLesson && getLesson(lastLesson.id);
        const target = savedLesson || lessons[0];
        const targetSteps = getLessonSteps(target);
        const lastSectionId = savedLesson ? lastLesson?.section?.id : undefined;
        const step = targetSteps.find(({ id }) => id === lastSectionId)
          ?? targetSteps.find(({ id }) => id === progress.lessons[target.id]?.lastGuidedStep)
          ?? targetSteps[0];
        return navigate(guidedLessonHref(target.id, step.id), `${target.title}. ${step.title}.`);
      }
      case "open-lesson": {
        const target = getLesson(command.lessonId);
        if (!target) return;
        const step = getLessonSteps(target)[0];
        return navigate(guidedLessonHref(target.id, step.id), `${target.title}. ${step.title}.`);
      }
      case "start-quiz":
        return lesson && navigate(`/aulas/${lesson.id}/#exercicios`, `Exercícios de ${lesson.title}.`);
      case "next-step":
      case "previous-step": {
        const forward = command.kind === "next-step";
        if (quiz || reviews) return dispatch({ kind: forward ? "next-question" : "previous-question" });
        if (!lesson || stepIndex < 0) return;
        const index = stepIndex + (forward ? 1 : -1);
        const target = steps[index];
        if (!target) {
          return { message: forward ? "Esta é a última etapa. Diga Fazer exercícios para praticar." : "Esta é a primeira etapa." };
        }
        return navigate(guidedLessonHref(lesson.id, target.id), `Etapa ${index + 1}. ${target.title}.`);
      }
      default:
        return dispatch(command);
    }
  }

  const session = useVoiceSession(handleTranscript, endActions);

  function endInteraction() {
    session.end();
    stopActiveSpeech();
  }

  const controls: VoiceInterface = {
    session,
    feedback,
    activate() {
      setFeedback(null);
      stopActiveSpeech();
      session.start();
    },
    end: endInteraction,
    hearOptions() {
      const message = session.support === "unavailable"
        ? session.message
        : describeVoiceOptions(getVoiceContext(pathname, window.location.hash));
      publish({ message });
    },
    stopNarration() {
      stopActiveSpeech();
      setFeedback({ message: "Narração interrompida.", announce: !session.active });
    },
  };

  return (
    <ActionsContext.Provider value={register}>
      <ControlsContext.Provider value={controls}>{children}</ControlsContext.Provider>
    </ActionsContext.Provider>
  );
}
