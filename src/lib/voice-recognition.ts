export type VoiceRecognitionEvents = {
  onStart: () => void;
  onFinal: (transcript: string) => void;
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
  0?: { transcript: string };
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
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      function detachRecognitionEvents() {
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onnomatch = null;
        recognition.onerror = null;
      }

      recognition.onstart = events.onStart;
      recognition.onresult = ({ resultIndex = 0, results }) => {
        for (let index = resultIndex; index < results.length; index++) {
          const result = results[index];
          const transcript = result?.isFinal ? result[0]?.transcript.trim() : undefined;
          if (transcript) {
            events.onFinal(transcript);
            break;
          }
        }
      };
      recognition.onnomatch = events.onNoMatch;
      recognition.onerror = ({ error }) => events.onError(error);
      recognition.onend = () => {
        detachRecognitionEvents();
        recognition.onend = null;
        events.onEnd();
      };

      return {
        start: () => recognition.start(),
        abort: () => {
          // Keep the end callback so the session can wait for the browser to release the turn.
          detachRecognitionEvents();
          recognition.abort();
        },
      };
    },
  };
}
