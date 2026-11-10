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
import { getNarrationPreference, useNarrationManifest } from "@/lib/narration-manifest";
import {
  exerciseTitleNarration, fixedNarration, lessonListNarration, lessonTitleNarration,
  narratedMessage, stepLabelNarration,
} from "@/lib/narration-messages";
import {
  createNarrationPlayback, isBrowserNarrationVoice, resolveNarrationVoice, stopNarrationPlayback,
  subscribeNarrationDiagnostics, temporaryBrowserNotice,
} from "@/lib/narration-playback";
import { isSpeechAvailable } from "@/lib/speech-playback";
import { getClientStudyState } from "@/lib/study-storage";
import { parseVoiceCommand, type VoiceCommand } from "@/lib/voice-commands";
import { sanitizeVoiceDiagnosticCode, type VoiceDiagnosticEvent } from "@/lib/voice-session";
import { useVoiceSession } from "./use-voice-session";
import { describeVoiceOptions, getVoiceContext } from "./voice-context";

export type VoiceAction = VoiceCommand | { kind: "session-ended" };
export type VoiceActionResult = {
  message: string;
  speak?: boolean;
  clipIds?: readonly string[];
};
type ActionHandler = (command: VoiceAction) => VoiceActionResult | undefined;
type RegisterAction = (handler: ActionHandler) => () => void;
type Feedback = VoiceActionResult & {
  announce: boolean;
  notice?: string;
  canRetry?: boolean;
  canUseBrowser?: boolean;
};
type DiagnosticEntry = VoiceDiagnosticEvent & { timestamp: string };
type VoiceInterface = {
  session: ReturnType<typeof useVoiceSession>;
  feedback: Feedback | null;
  diagnostics: readonly DiagnosticEntry[] | null;
  hasNeuralNarration: boolean;
  activate: () => void;
  end: () => void;
  hearOptions: () => void;
  retryFeedback: () => void;
  useBrowserForFeedback: () => void;
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
  const diagnosticsEnabled = diagnostics !== null;

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

  useEffect(() => {
    if (!diagnosticsEnabled) return;
    return subscribeNarrationDiagnostics(({ type, failure }) => {
      recordDiagnostic({ type, code: `audio-${failure.code}` });
    });
  }, [diagnosticsEnabled, recordDiagnostic]);

  function publish({ message, speak = true, clipIds = [] }: VoiceActionResult, temporaryBrowser = false) {
    const notice = temporaryBrowser ? temporaryBrowserNotice : undefined;
    const entry: Feedback = { message, clipIds, announce: false, notice };
    setFeedback(entry);
    if (!speak) return;

    const voiceId = temporaryBrowser ? "browser" : resolveNarrationVoice(narration, getNarrationPreference());
    function unavailable() {
      const canUseBrowser = (voiceId === null || !isBrowserNarrationVoice(voiceId)) && isSpeechAvailable();
      setFeedback((current) => current === entry ? {
        ...entry,
        announce: true,
        notice: "A narração desta mensagem está indisponível na voz selecionada.",
        canRetry: true,
        canUseBrowser,
      } : current);
    }
    if (!voiceId) unavailable();
    else {
      createNarrationPlayback({
        manifest: narration,
        voiceId,
        clipIds,
        text: notice ? `${notice} ${message}` : message,
        rate: 1,
        onComplete: () => {},
        onError: unavailable,
      }).start();
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

  function navigate(href: string, feedback: VoiceActionResult): VoiceActionResult {
    const current = window.location.pathname + window.location.hash;
    if (current !== href) {
      pending.current = { href, until: Date.now() + navigationTimeout };
      router.push(href);
    }
    if (href === `${window.location.pathname}#exercicios`) {
      document.getElementById("exercicios")?.focus();
    }
    return feedback;
  }

  function handleTranscript(transcript: string) {
    const command = parseVoiceCommand(transcript, lessons);
    if (!command) {
      publish({
        ...narratedMessage(fixedNarration("comando-desconhecido"), fixedNarration("ajuda-comando")),
        message: "Comando não reconhecido. Diga Ajuda para ouvir as opções.",
      });
      return;
    }
    if (command.kind === "end-session") {
      endInteraction();
      return;
    }

    const context = getVoiceContext(pathname, window.location.hash);
    if (command.kind === "help" || command.kind === "options") {
      publish(describeVoiceOptions(context));
      return;
    }
    if (command.kind === "use-browser-voice") {
      const result = dispatch(command);
      if (result) publish(result);
      else if (feedback?.canUseBrowser) publish(feedback, true);
      else publish(narratedMessage(fixedNarration("sem-fallback")));
      return;
    }
    if (pending.current) {
      if (pending.current.href !== pathname + window.location.hash && pending.current.until > Date.now()) {
        publish(narratedMessage(fixedNarration("aguarde-pagina")));
        return;
      }
      pending.current = null;
    }

    publish(runCommand(command, context) ?? narratedMessage(fixedNarration("comando-indisponivel")));
  }

  function runCommand(command: VoiceCommand, context: ReturnType<typeof getVoiceContext>): VoiceActionResult | undefined {
    const { lesson, stepIndex, steps, quiz, reviews } = context;
    switch (command.kind) {
      case "home":
        return navigate("/", narratedMessage(fixedNarration("pagina-inicial")));
      case "reviews":
        return navigate("/minhas-revisoes/", narratedMessage(fixedNarration("minhas-revisoes")));
      case "list-lessons":
        return narratedMessage(lessonListNarration(lessons));
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
        const destination = [lessonTitleNarration(target), stepLabelNarration(target, step, targetSteps.indexOf(step))];
        return navigate(guidedLessonHref(target.id, step.id), narratedMessage(
          ...(savedLesson ? [fixedNarration("retomar"), ...destination] : destination),
        ));
      }
      case "open-lesson": {
        const target = getLesson(command.lessonId);
        if (!target) return;
        const step = getLessonSteps(target)[0];
        return navigate(guidedLessonHref(target.id, step.id), narratedMessage(
          lessonTitleNarration(target), stepLabelNarration(target, step, 0),
        ));
      }
      case "start-quiz":
        return lesson && navigate(`/aulas/${lesson.id}/#exercicios`, narratedMessage(exerciseTitleNarration(lesson)));
      case "next-step":
      case "previous-step": {
        const forward = command.kind === "next-step";
        if (quiz || reviews) return dispatch({ kind: forward ? "next-question" : "previous-question" });
        if (!lesson || stepIndex < 0) return;
        const index = stepIndex + (forward ? 1 : -1);
        const target = steps[index];
        if (!target) {
          return narratedMessage(fixedNarration(forward ? "ultima-etapa" : "primeira-etapa"));
        }
        return navigate(guidedLessonHref(lesson.id, target.id), narratedMessage(
          fixedNarration(forward ? "proxima-etapa" : "etapa-anterior"), stepLabelNarration(lesson, target, index),
        ));
      }
      default:
        return dispatch(command);
    }
  }

  const session = useVoiceSession(handleTranscript, endActions, diagnostics === null ? undefined : recordDiagnostic);

  function endInteraction() {
    session.end();
    stopNarrationPlayback();
  }

  const controls: VoiceInterface = {
    session,
    feedback,
    diagnostics,
    hasNeuralNarration: Boolean(narration?.voices.length),
    activate() {
      setFeedback(null);
      stopNarrationPlayback();
      session.start();
    },
    end: endInteraction,
    hearOptions() {
      const result = session.support === "unavailable"
        ? narratedMessage(fixedNarration("reconhecimento-indisponivel"))
        : describeVoiceOptions(getVoiceContext(pathname, window.location.hash));
      publish(result);
    },
    retryFeedback() {
      if (feedback?.canRetry) publish(feedback);
    },
    useBrowserForFeedback() {
      if (feedback?.canUseBrowser) publish(feedback, true);
    },
    stopNarration() {
      stopNarrationPlayback();
      setFeedback({ message: "Narração interrompida.", announce: !session.active });
    },
  };

  return (
    <ActionsContext.Provider value={register}>
      <ControlsContext.Provider value={controls}>{children}</ControlsContext.Provider>
    </ActionsContext.Provider>
  );
}
