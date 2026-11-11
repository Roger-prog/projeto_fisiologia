export type VoiceTranscript = { text: string; confidence?: number };

export type VoiceRecognitionEvents = {
  onStart: () => void;
  onFinal: (transcript: VoiceTranscript) => void;
  onNoMatch: () => void;
  onError: (code: string) => void;
  onEnd: () => void;
};

export type VoiceRecognitionTurn = {
  start: () => void;
  abort: () => void;
};

export interface VoiceRecognizer {
  createTurn(events: VoiceRecognitionEvents): VoiceRecognitionTurn;
}

type BrowserResult = {
  isFinal: boolean;
  0?: { transcript: string; confidence?: number };
};

type BrowserRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: { resultIndex?: number; results: ArrayLike<BrowserResult> }) => void) | null;
  onnomatch: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
};

type RecognitionConstructor = new () => BrowserRecognition;
let activeTurn: object | null = null;

function getBrowserConstructor() {
  if (typeof window === "undefined" || !window.isSecureContext) return null;
  const browser = window as Window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return [browser.SpeechRecognition, browser.webkitSpeechRecognition]
    .find((constructor) => typeof constructor === "function") ?? null;
}

export function isVoiceRecognitionAvailable() {
  return getBrowserConstructor() !== null;
}

export function getBrowserVoiceRecognizer(): VoiceRecognizer | null {
  const Recognition = getBrowserConstructor();
  if (!Recognition) return null;

  return {
    createTurn(events) {
      const recognition = new Recognition();
      if (typeof recognition.start !== "function" || typeof recognition.abort !== "function") {
        throw new DOMException("Reconhecimento sem controle de início ou interrupção.", "NotSupportedError");
      }
      recognition.lang = "pt-BR";
      // One final result per turn gives the command a safe boundary before it can start audio.
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      const turn = {};
      let finalDelivered = false;

      function detachInputEvents() {
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onnomatch = null;
      }

      function releaseTurn() {
        if (activeTurn === turn) activeTurn = null;
        detachInputEvents();
        recognition.onerror = null;
        recognition.onend = null;
      }

      recognition.onstart = events.onStart;
      recognition.onresult = ({ resultIndex = 0, results }) => {
        if (activeTurn !== turn || finalDelivered) return;
        for (let index = resultIndex; index < results.length; index++) {
          const result = results[index];
          const alternative = result?.isFinal ? result[0] : undefined;
          const text = alternative?.transcript.trim();
          if (text) {
            finalDelivered = true;
            const confidence = alternative?.confidence;
            events.onFinal(typeof confidence === "number" && confidence >= 0 && confidence <= 1
              ? { text, confidence }
              : { text });
            break;
          }
        }
      };
      recognition.onnomatch = events.onNoMatch;
      recognition.onerror = ({ error }) => events.onError(error);
      recognition.onend = () => {
        releaseTurn();
        events.onEnd();
      };

      return {
        start: () => {
          if (activeTurn) {
            if (activeTurn !== turn) releaseTurn();
            throw new DOMException("Reconhecimento anterior ainda em liberação.", "RecognitionBusyError");
          }
          activeTurn = turn;
          try {
            recognition.start();
          } catch (error) {
            releaseTurn();
            throw error;
          }
        },
        abort: () => {
          // Permission errors can still arrive during release. Keep onerror and onend attached.
          detachInputEvents();
          if (activeTurn === turn) recognition.abort();
        },
      };
    },
  };
}
