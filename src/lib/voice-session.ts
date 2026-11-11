import { getAudioActive, subscribeAudioActivity } from "./audio-activity";
import type { VoiceRecognitionTurn, VoiceRecognizer, VoiceTranscript } from "./voice-recognition";

export type VoiceSessionState = "inactive" | "requesting" | "listening" | "processing" | "narrating" | "recovering" | "suspended" | "error" | "unavailable";
export type VoiceStatusCue = "ready" | "ended" | "permission-denied" | "interrupted";

export type VoiceDiagnosticEvent = {
  type: "session-started" | "session-ended" | "recognition-started" | "recognition-result" | "recognition-ended"
    | "narration-started" | "narration-ended" | "narration-error" | "narration-retry"
    | "retry-scheduled" | "recognition-error" | "permission-denied" | "suspended";
  code?: string;
  attempt?: number;
  delayMs?: number;
};

const permissionWaitMs = 60_000;
const startupWaitMs = 8_000;
const releaseWaitMs = 5_000;
const resumeDelayMs = 250;
const terminalCueWaitMs = 650;
const stableListeningMs = 2_000;
const retryDelaysMs = [500, 1000, 2000, 4000];
const releaseMessage = "O navegador não confirmou a liberação do microfone. Aguarde e tente ativar novamente. Se o bloqueio persistir, recarregue a página.";
const deniedMessage = "O navegador não autorizou o microfone. Confira a permissão e ative a interação por voz novamente.";

const permissionErrors = new Set(["not-allowed", "service-not-allowed", "NotAllowedError", "SecurityError", "permission-denied"]);
const transientErrors = new Set(["network", "NetworkError", "audio-capture", "NotReadableError", "InvalidStateError", "unexpected-end", "startup-timeout"]);
const knownCodes = new Set([
  ...permissionErrors, ...transientErrors,
  "no-speech", "no-match", "idle-end", "aborted", "bad-grammar", "phrases-not-supported",
  "language-not-supported", "NotSupportedError", "NotFoundError",
  "RecognitionBusyError", "release-timeout", "command-error",
  "audio-missing-clips", "audio-missing-file", "audio-network", "audio-media-error", "audio-blocked", "audio-unavailable",
]);

export function sanitizeVoiceDiagnosticCode(code: string) {
  return knownCodes.has(code) ? code : "unknown";
}

type Timer = ReturnType<typeof setTimeout>;
type Turn = {
  controls?: VoiceRecognitionTurn;
  timer?: Timer;
  startedAt?: number;
  stopping: boolean;
  command?: { transcript: VoiceTranscript; href: string };
  readyProbe?: boolean;
  onReleased?: () => void;
};
type Retry = { code: string; attempt: number; delayMs: number; message: string };

function errorMessage(code: string) {
  switch (code) {
    case "RecognitionBusyError":
    case "release-timeout":
      return releaseMessage;
    case "language-not-supported":
      return "O reconhecimento em português brasileiro está indisponível neste navegador.";
    case "NotSupportedError":
      return "O reconhecimento neste navegador não oferece os controles necessários. Use os controles da página para continuar.";
    case "NotFoundError":
      return "O navegador não encontrou um microfone disponível. Confira o dispositivo e tente novamente.";
    case "network":
    case "NetworkError":
      return "A conexão com o reconhecimento de voz não foi restabelecida. Confira a rede e ative novamente.";
    case "audio-capture":
    case "NotReadableError":
      return "Não foi possível acessar o microfone. Confira o dispositivo e ative novamente.";
    case "aborted":
      return "O navegador interrompeu a escuta. Ative novamente quando quiser continuar.";
    case "startup-timeout":
      return "O navegador não iniciou a escuta. Confira a permissão do microfone e ative novamente.";
    default:
      return "Não foi possível retomar a escuta. Ative a interação por voz novamente para tentar outra vez.";
  }
}

export function createVoiceSession(recognizer: VoiceRecognizer, callbacks: {
  onState: (state: VoiceSessionState, message: string) => void;
  onTranscript: (transcript: VoiceTranscript) => void;
  onEnd: () => void;
  onDiagnostic?: (event: VoiceDiagnosticEvent) => void;
  hasReadyAudio?: () => boolean;
  onReadyAudio?: () => boolean;
  onListeningReady?: (usedAudio: boolean) => void;
  onTerminalCue?: (cue: Exclude<VoiceStatusCue, "ready">, message: string, canPlay: boolean) => void;
}) {
  let current: Turn | null = null;
  let ended = false;
  let attempted = false;
  let hasListened = false;
  let pageHidden = false;
  let suspended = false;
  let audioActive = false;
  let failures = 0;
  let quietTurns = 0;
  let retry: Retry | undefined;
  let restartTimer: Timer | undefined;
  let unsubscribeAudio: (() => void) | undefined;
  let microphonePermission: PermissionStatus | undefined;
  let observedGrant = false;
  let readyNoticePending = true;
  let readyAudioAttempted = false;
  let readyAudioPlayed = false;
  let readyCueActive = false;

  function report(event: VoiceDiagnosticEvent) {
    callbacks.onDiagnostic?.(event);
  }

  function emit(state: VoiceSessionState, message: string) {
    callbacks.onState(state, message);
  }

  function clearRestart() {
    clearTimeout(restartTimer);
    restartTimer = undefined;
  }

  function abort(turn: Turn) {
    try {
      turn.controls?.abort();
    } catch {
      // A browser may reject abort while its native recognition service is already closing.
    }
  }

  function dispose() {
    if (ended) return;
    ended = true;
    clearRestart();
    unsubscribeAudio?.();
    microphonePermission?.removeEventListener("change", onPermissionChange);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("pageshow", onPageShow);
    document.removeEventListener("visibilitychange", reconcile);

    if (current) {
      const turn = current;
      current = null;
      turn.command = undefined;
      clearTimeout(turn.timer);
      if (!turn.stopping) abort(turn);
    }
  }

  function end(
    state: "inactive" | "error",
    message: string,
    cue: Exclude<VoiceStatusCue, "ready"> = state === "inactive" ? "ended" : "interrupted",
    waitForNativeEnd = true,
  ) {
    if (ended) return;
    const turn = current;
    let delivered = false;
    let timer: Timer | undefined;
    function deliverCue(released: boolean) {
      if (delivered) return;
      delivered = true;
      clearTimeout(timer);
      if (turn) turn.onReleased = undefined;
      callbacks.onTerminalCue?.(cue, message, released && !hidden() && !getAudioActive());
    }
    if (turn && waitForNativeEnd && callbacks.onTerminalCue) {
      turn.onReleased = () => queueMicrotask(() => deliverCue(true));
      timer = setTimeout(() => deliverCue(false), terminalCueWaitMs);
    }
    dispose();
    report({ type: "session-ended" });
    emit(state, message);
    callbacks.onEnd();
    if (!turn || !waitForNativeEnd) deliverCue(!turn);
  }

  function denied(code: string) {
    report({ type: "permission-denied", code });
    end("error", deniedMessage, "permission-denied");
  }

  function permissionLost() {
    const state = microphonePermission?.state;
    return state === "denied" || (observedGrant && state === "prompt");
  }

  function onPermissionChange() {
    if (permissionLost()) denied("permission-denied");
    else if (microphonePermission?.state === "granted") observedGrant = true;
  }

  async function watchPermission() {
    try {
      const status = await navigator.permissions?.query({ name: "microphone" as PermissionName });
      if (!status || ended) return;
      microphonePermission = status;
      status.addEventListener("change", onPermissionChange);
      onPermissionChange();
    } catch {
      // Some browsers expose speech recognition without a microphone permission query.
    }
  }

  function hidden() {
    return pageHidden || document.hidden;
  }

  function onPageHide() {
    pageHidden = true;
    reconcile();
  }

  function onPageShow() {
    pageHidden = false;
    reconcile();
  }

  function requestReadyNotice() {
    readyNoticePending = true;
    readyAudioAttempted = false;
    readyAudioPlayed = false;
  }

  function shouldPlayReadyAudio() {
    return readyNoticePending && !readyAudioAttempted && callbacks.hasReadyAudio?.();
  }

  function playReadyAudio() {
    readyAudioAttempted = true;
    readyCueActive = true;
    readyAudioPlayed = callbacks.onReadyAudio?.() ?? false;
    if (!getAudioActive()) readyCueActive = false;
    return readyCueActive;
  }

  function scheduleTurn() {
    if (ended || current || restartTimer !== undefined || hidden() || getAudioActive()) return;
    if (retry) {
      const { code, attempt, delayMs, message } = retry;
      report({ type: "retry-scheduled", code, attempt, delayMs });
      emit("recovering", message);
    } else {
      emit("processing", "Preparando a próxima escuta.");
    }
    restartTimer = setTimeout(() => {
      restartTimer = undefined;
      if (ended || hidden() || getAudioActive()) return;
      if (permissionLost()) {
        denied("permission-denied");
        return;
      }
      if (!retry && hasListened && shouldPlayReadyAudio() && playReadyAudio()) return;
      beginTurn();
    }, retry?.delayMs ?? resumeDelayMs);
  }

  function clearTurnTimer(turn: Turn) {
    clearTimeout(turn.timer);
    turn.timer = undefined;
  }

  function waitForRelease(turn: Turn) {
    if (turn.timer !== undefined || hidden()) return;
    // A timer cannot prove native release. Wait for end and retain the adapter's lease otherwise.
    turn.timer = setTimeout(() => {
      report({ type: "recognition-error", code: "release-timeout" });
      end("error", releaseMessage, "interrupted", false);
    }, releaseWaitMs);
  }

  function stopTurn(turn: Turn) {
    if (current !== turn || turn.stopping) return;
    turn.stopping = true;
    clearTurnTimer(turn);
    waitForRelease(turn);
    abort(turn);
  }

  function reconcile() {
    if (ended) return;
    const wasAudioActive = audioActive;
    audioActive = getAudioActive();
    if (wasAudioActive !== audioActive) {
      if (!readyCueActive) {
        report({ type: audioActive ? "narration-started" : "narration-ended" });
        if (audioActive) requestReadyNotice();
      }
      if (!audioActive) readyCueActive = false;
    }

    const isHidden = hidden();
    if (isHidden && !suspended) {
      report({ type: "suspended" });
      requestReadyNotice();
    }
    suspended = isHidden;
    if (isHidden || audioActive) {
      clearRestart();
      if (current) {
        current.command = undefined;
        stopTurn(current);
      }
      if (isHidden && current?.stopping) clearTurnTimer(current);
      if (isHidden) emit("suspended", "O microfone está suspenso. A escuta pode voltar quando você retornar à página.");
      else emit("narrating", readyCueActive ? "Aviso de escuta em reprodução." : "A escuta está pausada durante o áudio.");
    }
    if (!isHidden && current?.stopping) waitForRelease(current);
    if (!isHidden && !audioActive) scheduleTurn();
  }

  function planQuietRetry(code: "no-speech" | "no-match" | "idle-end", message: string) {
    failures = 0;
    quietTurns += 1;
    retry = {
      code,
      attempt: quietTurns,
      delayMs: retryDelaysMs[Math.min(quietTurns, retryDelaysMs.length) - 1],
      message,
    };
  }

  function planRecovery(code: string) {
    failures += 1;
    quietTurns = 0;
    if (failures > retryDelaysMs.length) {
      end("error", errorMessage(code));
      return;
    }
    requestReadyNotice();
    retry = {
      code,
      attempt: failures,
      delayMs: retryDelaysMs[failures - 1],
      message: "O reconhecimento foi interrompido. Tentando recuperar a escuta.",
    };
  }

  function handleRecognitionError(turn: Turn, rawCode: string) {
    if (current !== turn) return;
    const code = sanitizeVoiceDiagnosticCode(rawCode);
    if (permissionErrors.has(code)) {
      report({ type: "recognition-error", code });
      denied(code);
      return;
    }
    if (turn.stopping) return;
    report({ type: "recognition-error", code });
    if (code === "no-speech") {
      planQuietRetry(code, "Nenhuma fala foi detectada. A escuta será retomada.");
    } else if (transientErrors.has(code)) {
      planRecovery(code);
    } else {
      end("error", errorMessage(code));
      return;
    }
    if (retry && !ended) emit("recovering", retry.message);
    stopTurn(turn);
  }

  function onTurnEnd(turn: Turn) {
    if (current !== turn) {
      turn.onReleased?.();
      return;
    }
    clearTimeout(turn.timer);
    current = null;
    report({ type: "recognition-ended" });

    if (turn.readyProbe && !hidden() && !getAudioActive() && !permissionLost() && shouldPlayReadyAudio() && playReadyAudio()) return;

    const command = turn.command;
    turn.command = undefined;
    if (command && command.href === window.location.href && !hidden() && !getAudioActive()) {
      if (permissionLost()) {
        denied("permission-denied");
        return;
      }
      try {
        callbacks.onTranscript(command.transcript);
      } catch {
        report({ type: "recognition-error", code: "command-error" });
        end("error", "Não foi possível executar o comando. Ative novamente para tentar outra vez.");
      }
    } else if (!turn.stopping) {
      if (turn.startedAt !== undefined && Date.now() - turn.startedAt >= stableListeningMs) {
        planQuietRetry("idle-end", "O navegador encerrou este turno. A escuta será retomada.");
      } else {
        report({ type: "recognition-error", code: "unexpected-end" });
        if (!hasListened && !observedGrant) {
          end("error", "O navegador não concluiu a ativação do microfone. Confira a permissão e ative novamente.");
          return;
        }
        planRecovery("unexpected-end");
      }
    }
    scheduleTurn();
  }

  function beginTurn() {
    if (ended || current || hidden() || getAudioActive()) return;
    if (permissionLost()) {
      denied("permission-denied");
      return;
    }

    const initial = !attempted;
    attempted = true;
    const turn: Turn = { stopping: false };
    const recovery = retry;
    retry = undefined;
    current = turn;
    const acceptsInput = () => current === turn && !turn.stopping;

    try {
      turn.controls = recognizer.createTurn({
        onStart: () => {
          if (!acceptsInput()) return;
          hasListened = true;
          turn.startedAt = Date.now();
          clearTurnTimer(turn);
          report({ type: "recognition-started" });
          if (shouldPlayReadyAudio()) {
            turn.readyProbe = true;
            emit("processing", "Preparando o aviso de escuta.");
            stopTurn(turn);
            return;
          }
          emit("listening", "Diga um comando curto em português brasileiro.");
          if (readyNoticePending) {
            readyNoticePending = false;
            callbacks.onListeningReady?.(readyAudioPlayed);
          }
        },
        onFinal: (transcript) => {
          if (!acceptsInput() || turn.startedAt === undefined) return;
          if (permissionLost()) {
            denied("permission-denied");
            return;
          }
          if (hidden() || getAudioActive()) {
            reconcile();
            return;
          }
          failures = 0;
          quietTurns = 0;
          requestReadyNotice();
          turn.command = { transcript, href: window.location.href };
          report({ type: "recognition-result" });
          emit("processing", "Comando recebido.");
          stopTurn(turn);
        },
        onNoMatch: () => {
          if (!acceptsInput()) return;
          const message = "Não foi possível entender a fala. A escuta será retomada.";
          planQuietRetry("no-match", message);
          emit("recovering", message);
          stopTurn(turn);
        },
        onError: (code) => handleRecognitionError(turn, code),
        onEnd: () => onTurnEnd(turn),
      });
      if (initial) emit("requesting", "Aguarde a autorização do microfone no navegador.");
      else if (recovery) emit("recovering", recovery.message);
      turn.timer = setTimeout(() => {
        if (initial) {
          report({ type: "recognition-error", code: "startup-timeout" });
          end("error", errorMessage("startup-timeout"));
        } else {
          handleRecognitionError(turn, "startup-timeout");
        }
      }, initial ? permissionWaitMs : startupWaitMs);
      turn.controls.start();
    } catch (error) {
      if (current !== turn) return;
      clearTimeout(turn.timer);
      current = null;
      const rawCode = error instanceof Error || error instanceof DOMException ? error.name : "";
      const code = sanitizeVoiceDiagnosticCode(rawCode);
      report({ type: "recognition-error", code });
      if (permissionErrors.has(code)) denied(code);
      else if (transientErrors.has(code)) {
        planRecovery(code);
        scheduleTurn();
      } else {
        end("error", errorMessage(code));
      }
    }
  }

  return {
    start() {
      if (ended || unsubscribeAudio) return;
      report({ type: "session-started" });
      unsubscribeAudio = subscribeAudioActivity(reconcile);
      window.addEventListener("pagehide", onPageHide);
      window.addEventListener("pageshow", onPageShow);
      document.addEventListener("visibilitychange", reconcile);
      if (hidden() || getAudioActive()) reconcile();
      else beginTurn();
      if (!ended) void watchPermission();
    },
    end: () => end("inactive", "Sessão de voz encerrada."),
    dispose,
  };
}
