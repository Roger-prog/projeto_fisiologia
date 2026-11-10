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
import { createFilePlayback } from "@/lib/file-playback";
import { getLessonSteps, guidedLessonHref } from "@/lib/lesson-steps";
import { getNarrationPreference, getNarrationSources, useNarrationManifest } from "@/lib/narration-manifest";
import type { NarrationMessage } from "@/lib/narration-messages";
import { prepareNarrationText } from "@/lib/narration-pronunciation";
import { speakVoiceFeedback, stopActiveSpeech } from "@/lib/speech-playback";
import { getClientStudyState } from "@/lib/study-storage";
import { parseVoiceCommand, type VoiceCommand } from "@/lib/voice-commands";
import { sanitizeVoiceDiagnosticCode, type VoiceDiagnosticEvent } from "@/lib/voice-session";
import { useVoiceSession } from "./use-voice-session";
import { describeVoiceOptions, getVoiceContext } from "./voice-context";

export type VoiceAction = VoiceCommand | { kind: "session-ended" };
export type VoiceActionResult = {
  message: string;
  speak?: boolean;
  clips?: readonly NarrationMessage[];
  speechText?: string;
};
type ActionHandler = (command: VoiceAction) => VoiceActionResult | undefined;
type RegisterAction = (handler: ActionHandler) => () => void;
type Feedback = { message: string; announce: boolean };
type DiagnosticEntry = VoiceDiagnosticEvent & { timestamp: string };
type VoiceInterface = {
  session: ReturnType<typeof useVoiceSession>;
  feedback: Feedback | null;
  diagnostics: readonly DiagnosticEntry[] | null;
  hasNeuralNarration: boolean;
  activate: () => void;
  end: () => void;
  hearOptions: () => void;
  stopNarration: () => void;
};

const ActionsContext = createContext<RegisterAction | null>(null);
const ControlsContext = createContext<VoiceInterface | null>(null);
const navigationTimeout = 5000;
const diagnosticLimit = 40;

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
  const [diagnostics, setDiagnostics] = useState<readonly DiagnosticEntry[] | null>(null);
  const narration = useNarrationManifest();

  const register = useCallback<RegisterAction>((handler) => {
    handlers.current.add(handler);
    return () => { handlers.current.delete(handler); };
  }, []);

  useEffect(() => {
    if (pending.current?.href === `${pathname}#exercicios` && window.location.hash === "#exercicios") {
      document.getElementById("exercicios")?.focus();
    }
  }, [pathname]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("diagnostico-voz") === "1") {
      setDiagnostics((current) => current ?? []);
    }
  }, [pathname]);

  const recordDiagnostic = useCallback(({ type, code, attempt, delayMs }: VoiceDiagnosticEvent) => {
    const timestamp = new Date().toISOString();
    const errorCode = code === undefined ? undefined : sanitizeVoiceDiagnosticCode(code);
    setDiagnostics((current) => current === null ? current : [
      ...current.slice(-(diagnosticLimit - 1)),
      { type, code: errorCode, attempt, delayMs, timestamp },
    ]);
  }, []);

  function publish({ message, speak = true, clips = [], speechText }: VoiceActionResult) {
    const entry = { message, announce: false };
    setFeedback(entry);
    if (!speak) return;

    function announceFallback() {
      setFeedback((current) => current === entry ? { ...entry, announce: true } : current);
    }
    const preferred = getNarrationPreference();
    const browserVoice = preferred?.startsWith("browser:") ? preferred.slice("browser:".length) : undefined;
    function speakText(text: string) {
      if (!speakVoiceFeedback(prepareNarrationText(text), announceFallback, browserVoice)) announceFallback();
    }

    const voiceId = preferred ?? narration?.voices[0]?.id;
    const sources = voiceId && getNarrationSources(narration, clips.map((key) => `interface/${key}`), voiceId);
    if (sources && typeof Audio === "function") {
      createFilePlayback({
        sources,
        rate: 1,
        onComplete: () => { if (speechText) speakText(speechText); },
        onError: () => speakText(message),
      }).start();
    } else {
      speakText(clips.length ? message : speechText ?? message);
    }
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
      publish({
        message: "Comando não reconhecido. Diga Ajuda para ouvir as opções.",
        clips: ["comando-desconhecido", "ajuda-comando"],
      });
      return;
    }
    if (command.kind === "end-session") {
      endInteraction();
      return;
    }

    const context = getVoiceContext(pathname, window.location.hash);
    if (command.kind === "help" || command.kind === "options") {
      const message = describeVoiceOptions(context);
      publish(context.route ? { message } : {
        message: `Bem-vindo ao FisioAcessível. ${message}`,
        clips: ["boas-vindas"],
        speechText: message,
      });
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
        const speechText = `${target.title}. ${step.title}.`;
        return savedLesson ? {
          ...navigate(guidedLessonHref(target.id, step.id), `Vamos continuar sua última aula. ${speechText}`),
          clips: ["retomar"],
          speechText,
        } : navigate(guidedLessonHref(target.id, step.id), speechText);
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
        const speechText = `Etapa ${index + 1}. ${target.title}.`;
        return forward ? {
          ...navigate(guidedLessonHref(lesson.id, target.id), `Próxima etapa. ${speechText}`),
          clips: ["proxima-etapa"],
          speechText,
        } : navigate(guidedLessonHref(lesson.id, target.id), speechText);
      }
      default:
        return dispatch(command);
    }
  }

  const session = useVoiceSession(handleTranscript, endActions, diagnostics === null ? undefined : recordDiagnostic);

  function endInteraction() {
    session.end();
    stopActiveSpeech();
  }

  const controls: VoiceInterface = {
    session,
    feedback,
    diagnostics,
    hasNeuralNarration: Boolean(narration?.voices.length),
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
