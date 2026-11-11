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
import { getLesson, getModule, lessons, modules } from "@/data";
import { getLessonSteps, guidedLessonHref } from "@/lib/lesson-steps";
import { getNarrationPreference, useNarrationManifest } from "@/lib/narration-manifest";
import {
  exerciseTitleNarration, fixedNarration, lessonListNarration, lessonTitleNarration,
  moduleLessonListNarration, narratedMessage, stepLabelNarration,
} from "@/lib/narration-messages";
import {
  createNarrationPlayback, isBrowserNarrationVoice, resolveNarrationVoice, stopNarrationPlayback,
  subscribeNarrationDiagnostics, temporaryBrowserNotice,
} from "@/lib/narration-playback";
import { isSpeechAvailable } from "@/lib/speech-playback";
import { getClientStudyState } from "@/lib/study-storage";
import { interpretVoiceCommand, type VoiceCommand } from "@/lib/voice-commands";
import type { VoiceTranscript } from "@/lib/voice-recognition";
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
type InterpretationDiagnostic = {
  intent?: string;
  match: string;
  reason?: string;
  alternatives: readonly string[];
  confidence?: number;
};
type DiagnosticEntry = Omit<VoiceDiagnosticEvent, "type"> & {
  type: VoiceDiagnosticEvent["type"] | "command-interpreted";
  interpretation?: InterpretationDiagnostic;
  timestamp: string;
};
type VoiceInterface = {
  session: ReturnType<typeof useVoiceSession>;
  feedback: Feedback | null;
  diagnostics: readonly DiagnosticEntry[] | null;
  transcriptSample: VoiceTranscript | null;
  transcriptDiagnosticsEnabled: boolean;
  setTranscriptDiagnosticsEnabled: (enabled: boolean) => void;
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
const cueKeys = {
  ready: "microfone-pronto",
  ended: "microfone-encerrado",
  "permission-denied": "microfone-permissao",
  interrupted: "microfone-interrompido",
} as const;

function describeIntent(command: VoiceCommand) {
  if (command.kind === "open-lesson") return `${command.kind}/${command.lessonId}`;
  if (command.kind === "open-module") return `${command.kind}/${command.moduleId}`;
  return command.kind;
}

function focusDestination(href: string) {
  const [path, hash] = href.split("#");
  if (path !== window.location.pathname) return;
  const id = hash || (/^\/aulas\/[^/]+\/$/.test(path) ? "titulo-aula" : undefined);
  if (id) document.getElementById(id)?.focus({ preventScroll: true });
}

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
  const backClarification = useRef<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [diagnostics, setDiagnostics] = useState<readonly DiagnosticEntry[] | null>(null);
  const [transcriptSample, setTranscriptSample] = useState<VoiceTranscript | null>(null);
  const [transcriptDiagnosticsEnabled, setTranscriptDiagnosticsEnabled] = useState(false);
  const narration = useNarrationManifest();
  const diagnosticsEnabled = diagnostics !== null;

  const register = useCallback<RegisterAction>((handler) => {
    handlers.current.add(handler);
    return () => { handlers.current.delete(handler); };
  }, []);

  useEffect(() => {
    if (pending.current?.href === pathname + window.location.hash) focusDestination(pending.current.href);
  }, [pathname]);

  useEffect(() => {
    if (!transcriptSample) return;
    const timer = setTimeout(() => setTranscriptSample(null), 30_000);
    return () => clearTimeout(timer);
  }, [transcriptSample]);

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
    backClarification.current = null;
    setFeedback(null);
    setTranscriptSample(null);
    setTranscriptDiagnosticsEnabled(false);
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
    focusDestination(href);
    return feedback;
  }

  function handleTranscript({ text, confidence }: VoiceTranscript) {
    const location = window.location.pathname + window.location.hash;
    const context = getVoiceContext(
      window.location.pathname, window.location.hash, Boolean(document.activeElement?.closest("#exercicios")),
    );
    const interpreting = interpretVoiceCommand(text, lessons, {
      modules,
      context: context.commandContext,
      clarification: backClarification.current === location ? "back" : undefined,
      confidence,
    });
    const { command, match, reason, alternatives } = interpreting;
    if (diagnosticsEnabled) {
      setDiagnostics((current) => current === null ? current : [
        ...current.slice(-(diagnosticLimit - 1)),
        {
          type: "command-interpreted",
          timestamp: new Date().toISOString(),
          interpretation: { intent: command ? describeIntent(command) : undefined, match, reason,
            alternatives: alternatives.map(describeIntent), confidence: interpreting.confidence },
        },
      ]);
      if (transcriptDiagnosticsEnabled) setTranscriptSample({ text: text.slice(0, 180), confidence });
    }
    if (!command) {
      if (reason === "ambiguous") {
        publish(narratedMessage(fixedNarration("comando-ambiguo")));
        return;
      }
      publish({
        ...narratedMessage(fixedNarration("comando-desconhecido"), fixedNarration("ajuda-comando")),
        message: "Comando não reconhecido. Você pode repetir ou dizer Ajuda.",
      });
      return;
    }
    if (command.kind === "end-session") {
      endInteraction();
      return;
    }

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
      if (pending.current.href !== location && pending.current.until > Date.now()) {
        publish(narratedMessage(fixedNarration("aguarde-pagina")));
        return;
      }
      pending.current = null;
    }
    if (command.kind === "clarify-back") {
      backClarification.current = location;
      publish(narratedMessage(fixedNarration("esclarecer-voltar")));
      return;
    }
    backClarification.current = null;

    publish(runCommand(command, context) ?? narratedMessage(fixedNarration("comando-indisponivel")));
  }

  function runCommand(command: VoiceCommand, context: ReturnType<typeof getVoiceContext>): VoiceActionResult | undefined {
    const { lesson, module, stepIndex, steps, quiz, reviews, guided } = context;
    switch (command.kind) {
      case "home":
        return navigate("/", narratedMessage(fixedNarration("pagina-inicial")));
      case "reviews":
        return navigate("/minhas-revisoes/", narratedMessage(fixedNarration("minhas-revisoes")));
      case "list-modules":
        return navigate("/modulos/", narratedMessage(fixedNarration("ajuda-modulos")));
      case "open-module": {
        const target = getModule(command.moduleId);
        return target && navigate(`/modulos/#${target.id}`, narratedMessage(moduleLessonListNarration(target, lessons)));
      }
      case "list-lessons":
        return navigate(module ? `/modulos/#${module.id}` : "/modulos/", narratedMessage(
          module ? moduleLessonListNarration(module, lessons) : lessonListNarration(lessons),
        ));
      case "resume-study": {
        const progress = getClientStudyState().progress;
        const lastLesson = progress.lastLesson;
        const savedLesson = lastLesson && getLesson(lastLesson.id);
        const target = savedLesson || lessons[0];
        const targetSteps = getLessonSteps(target);
        const lastSectionId = savedLesson ? lastLesson?.section?.id : undefined;
        const step = targetSteps.find(({ id }) => id === lastSectionId);
        const destination = [lessonTitleNarration(target), step
          ? stepLabelNarration(target, step, targetSteps.indexOf(step)) : fixedNarration("escolher-modo")];
        const href = step && lastLesson?.section?.mode === "guided"
          ? guidedLessonHref(target.id, step.id) : `/aulas/${target.id}/${step ? `#${step.id}` : ""}`;
        return navigate(href, narratedMessage(
          ...(savedLesson ? [fixedNarration("retomar"), ...destination] : destination),
        ));
      }
      case "open-lesson": {
        const target = getLesson(command.lessonId);
        if (!target) return;
        return navigate(`/aulas/${target.id}/`, narratedMessage(
          lessonTitleNarration(target), fixedNarration("escolher-modo"),
        ));
      }
      case "mode-complete":
      case "mode-guided":
      case "mode-review": {
        if (!lesson) {
          return command.kind === "mode-review"
            ? navigate("/revisao/", narratedMessage(fixedNarration("modo-revisao"), fixedNarration("escolher-aula-primeiro")))
            : narratedMessage(fixedNarration("escolher-aula-primeiro"));
        }
        if (command.kind === "mode-review") {
          return navigate(`/revisao/#revisao-${lesson.id}`, narratedMessage(
            fixedNarration("modo-revisao"), lessonTitleNarration(lesson), fixedNarration("ajuda-revisao-aula"),
          ));
        }
        const saved = getClientStudyState().progress.lessons[lesson.id]?.lastGuidedStep;
        const step = steps[stepIndex] ?? (reviews || command.kind === "mode-guided"
          ? steps.find(({ id }) => id === saved) : undefined);
        if (command.kind === "mode-complete") {
          return navigate(`/aulas/${lesson.id}/${step ? `#${step.id}` : ""}`, narratedMessage(
            fixedNarration("modo-completo"), lessonTitleNarration(lesson),
          ));
        }
        const target = step ?? steps[0];
        return navigate(guidedLessonHref(lesson.id, target.id), narratedMessage(
          fixedNarration("modo-guiado"), stepLabelNarration(lesson, target, steps.indexOf(target)),
        ));
      }
      case "start-quiz":
        return lesson && navigate(`/aulas/${lesson.id}/#exercicios`, narratedMessage(exerciseTitleNarration(lesson)));
      case "next-step":
      case "previous-step": {
        const forward = command.kind === "next-step";
        if (quiz || reviews) return dispatch({ kind: forward ? "next-question" : "previous-question" });
        if (!lesson) return;
        const index = Math.max(0, stepIndex) + (forward ? 1 : -1);
        const target = steps[index];
        if (!target) {
          return narratedMessage(fixedNarration(forward ? "ultima-etapa" : "primeira-etapa"));
        }
        const href = guided ? guidedLessonHref(lesson.id, target.id) : `/aulas/${lesson.id}/#${target.id}`;
        return navigate(href, narratedMessage(
          fixedNarration(forward ? "proxima-etapa" : "etapa-anterior"), stepLabelNarration(lesson, target, index),
        ));
      }
      default:
        return dispatch(command);
    }
  }

  function playSpokenCue(cue: keyof typeof cueKeys, onUnavailable: () => void) {
    const voiceId = resolveNarrationVoice(narration, getNarrationPreference());
    if (!voiceId) return false;
    const { id, text } = fixedNarration(cueKeys[cue]);
    let starting = true;
    let claimed = true;
    createNarrationPlayback({
      manifest: narration, voiceId, clipIds: [id], text, rate: 1,
      onComplete() {},
      onInterrupt: onUnavailable,
      onError() {
        claimed = false;
        if (!starting) onUnavailable();
      },
    }).start();
    starting = false;
    return claimed;
  }

  const session = useVoiceSession(handleTranscript, endActions, diagnosticsEnabled ? recordDiagnostic : undefined, playSpokenCue);

  function endInteraction() {
    stopNarrationPlayback();
    session.end();
  }

  const controls: VoiceInterface = {
    session,
    feedback,
    diagnostics,
    transcriptSample,
    transcriptDiagnosticsEnabled,
    setTranscriptDiagnosticsEnabled(enabled) {
      setTranscriptDiagnosticsEnabled(enabled);
      if (!enabled) setTranscriptSample(null);
    },
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
