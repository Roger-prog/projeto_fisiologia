import { getAudioActive, subscribeAudioActivity } from "./audio-activity";
import type { VoiceRecognitionTurn, VoiceRecognizer } from "./voice-recognition";

export type VoiceSessionState = "inactive" | "requesting" | "listening" | "processing" | "narrating" | "error" | "unavailable";

const permissionLimitMs = 25_000;
const startupLimitMs = 8_000;
const listeningLimitMs = 12_000;
const sessionLimitMs = 10 * 60_000;
const abortSettleMs = 350;
const resumeDelayMs = 250;

type Timer = ReturnType<typeof setTimeout>;
type Turn = {
  controls?: VoiceRecognitionTurn;
  timer?: Timer;
  stopping: boolean;
  listening: boolean;
};

function recognitionError(code: string) {
  switch (code) {
    case "not-allowed":
    case "NotAllowedError":
    case "SecurityError":
      return "O navegador não autorizou o microfone. Confira a permissão e ative a interação por voz novamente.";
    case "audio-capture":
    case "NotFoundError":
      return "O navegador não encontrou um microfone disponível. Confira o dispositivo e tente novamente.";
    case "network":
      return "A conexão com o reconhecimento do navegador falhou. Confira a rede e tente novamente.";
    case "language-not-supported":
      return "O reconhecimento em português brasileiro está indisponível neste navegador.";
    case "NotSupportedError":
      return "O reconhecimento neste navegador não oferece os controles necessários. Use os controles da página para continuar.";
    case "service-not-allowed":
      return "O navegador bloqueou o serviço de reconhecimento. Confira as permissões para ativar novamente.";
    case "aborted":
      return "O navegador interrompeu a escuta. Ative novamente quando quiser continuar.";
    default:
      return "Não foi possível iniciar a escuta. Ative a interação por voz novamente para tentar outra vez.";
  }
}

export function createVoiceSession(recognizer: VoiceRecognizer, callbacks: {
  onState: (state: VoiceSessionState, message: string) => void;
  onTranscript: (transcript: string) => void;
  onEnd: () => void;
}) {
  let current: Turn | null = null;
  let ended = false;
  let hasListened = false;
  let misses = 0;
  let nextHint = "";
  let restartTimer: Timer | undefined;
  let sessionTimer: Timer | undefined;
  let unsubscribeAudio: (() => void) | undefined;

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
      // Browser implementations may reject abort after the native turn has already ended.
    }
  }

  function dispose() {
    if (ended) return;
    ended = true;
    clearRestart();
    clearTimeout(sessionTimer);
    unsubscribeAudio?.();
    window.removeEventListener("pagehide", onPageHide);
    document.removeEventListener("visibilitychange", onVisibilityChange);

    if (current) {
      const turn = current;
      current = null;
      clearTimeout(turn.timer);
      if (!turn.stopping) abort(turn);
    }
  }

  function end(state: "inactive" | "error", message: string) {
    if (ended) return;
    dispose();
    emit(state, message);
    callbacks.onEnd();
  }

  function onPageHide() {
    end("inactive", "A sessão terminou ao ocultar a página. Ative novamente para continuar.");
  }

  function onVisibilityChange() {
    if (document.hidden) onPageHide();
  }

  function scheduleTurn() {
    if (ended || current || restartTimer !== undefined || getAudioActive()) return;
    restartTimer = setTimeout(() => {
      restartTimer = undefined;
      beginTurn();
    }, resumeDelayMs);
  }

  function closeTurn(turn: Turn) {
    if (current !== turn) return;
    clearTimeout(turn.timer);
    current = null;
    scheduleTurn();
  }

  function stopTurn(turn: Turn) {
    if (current !== turn || turn.stopping) return;
    turn.stopping = true;
    clearTimeout(turn.timer);
    // Wait for the browser's end event, with a bounded fallback for incomplete implementations.
    turn.timer = setTimeout(() => closeTurn(turn), abortSettleMs);
    abort(turn);
  }

  function onAudioChange() {
    if (ended) return;
    if (getAudioActive()) {
      clearRestart();
      if (current) stopTurn(current);
      emit("narrating", "A escuta está pausada durante o áudio.");
    } else {
      emit("processing", "Preparando a próxima escuta.");
      scheduleTurn();
    }
  }

  function missTurn(hint: string) {
    misses += 1;
    if (misses >= 2) {
      end("inactive", `${hint} A sessão foi encerrada. Ative novamente para continuar.`);
      return;
    }
    nextHint = `${hint} Diga um comando para tentar novamente.`;
    emit("processing", nextHint);
    if (current) stopTurn(current);
    else scheduleTurn();
  }

  function beginTurn() {
    if (ended || current || getAudioActive()) return;
    if (document.hidden) {
      onPageHide();
      return;
    }

    const turn: Turn = { stopping: false, listening: false };
    current = turn;
    const isCurrent = () => current === turn && !turn.stopping;

    try {
      turn.controls = recognizer.createTurn({
        onStart: () => {
          if (!isCurrent()) return;
          hasListened = true;
          turn.listening = true;
          emit("listening", nextHint || "Diga um comando curto em português brasileiro.");
          clearTimeout(turn.timer);
          turn.timer = setTimeout(() => missTurn("Nenhum comando foi recebido."), listeningLimitMs);
        },
        onFinal: (transcript) => {
          if (!isCurrent() || !turn.listening) return;
          if (getAudioActive()) {
            onAudioChange();
            return;
          }
          misses = 0;
          nextHint = "";
          emit("processing", "Comando recebido.");
          stopTurn(turn);
          try {
            callbacks.onTranscript(transcript);
          } catch {
            end("error", "Não foi possível executar o comando. Ative novamente para tentar outra vez.");
          }
        },
        onNoMatch: () => {
          if (isCurrent()) missTurn("Não foi possível entender a fala.");
        },
        onError: (code) => {
          if (!isCurrent()) return;
          if (code === "no-speech") missTurn("Nenhuma fala foi detectada.");
          else end("error", recognitionError(code));
        },
        onEnd: () => {
          if (current !== turn) return;
          closeTurn(turn);
          if (turn.stopping) return;
          if (turn.listening) missTurn("A escuta terminou sem receber um comando.");
          else end("error", "O navegador encerrou a solicitação do microfone. Ative novamente para continuar.");
        },
      });
      emit(hasListened ? "processing" : "requesting", hasListened
        ? nextHint || "Preparando a próxima escuta."
        : "Aguarde a autorização do microfone no navegador.");
      turn.timer = setTimeout(() => end("error", "O navegador não iniciou a escuta. Confira a permissão do microfone e ative novamente."),
        hasListened ? startupLimitMs : permissionLimitMs);
      turn.controls.start();
    } catch (error) {
      end("error", recognitionError(error instanceof Error ? error.name : ""));
    }
  }

  return {
    start() {
      if (ended || unsubscribeAudio) return;
      if (document.hidden) {
        onPageHide();
        return;
      }
      unsubscribeAudio = subscribeAudioActivity(onAudioChange);
      window.addEventListener("pagehide", onPageHide);
      document.addEventListener("visibilitychange", onVisibilityChange);
      sessionTimer = setTimeout(() => end("inactive", "A sessão de voz atingiu o limite de tempo. Ative novamente para continuar."), sessionLimitMs);
      if (getAudioActive()) onAudioChange();
      else beginTurn();
    },
    end: () => end("inactive", "Sessão de voz encerrada."),
    dispose,
  };
}
