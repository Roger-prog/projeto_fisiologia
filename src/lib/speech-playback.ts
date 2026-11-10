import { beginAudioActivity, stopActiveAudio } from "./audio-activity";

const speechLanguage = "pt-BR";
const maxChunkLength = 220;
const utteranceTimeoutMs = 45_000;

export type AudioPlayback = {
  start: () => void;
  stop: () => void;
  pause?: () => void;
  resume?: () => void;
};

export function isSpeechAvailable() {
  return typeof window.SpeechSynthesisUtterance === "function"
    && typeof window.speechSynthesis?.speak === "function"
    && typeof window.speechSynthesis?.cancel === "function";
}

export function canPauseSpeech() {
  return typeof window.speechSynthesis?.pause === "function"
    && typeof window.speechSynthesis?.resume === "function";
}

export function getSpeechChunks(text: string, limit = maxChunkLength) {
  const chunks: string[] = [];

  for (const paragraph of text.split("\n")) {
    let chunk = "";
    for (const word of paragraph.trim().split(/\s+/u)) {
      if (chunk && chunk.length + word.length + 1 > limit) {
        chunks.push(chunk);
        chunk = word;
      } else {
        chunk = chunk ? `${chunk} ${word}` : word;
      }
    }
    if (chunk) chunks.push(chunk);
  }

  return chunks;
}

export function createSpeechPlayback({
  text,
  rate,
  onComplete,
  onError,
  onInterrupt,
}: {
  text: string;
  rate: number;
  onComplete: () => void;
  onError: () => void;
  onInterrupt?: () => void;
}): AudioPlayback {
  const synthesis = window.speechSynthesis;
  const chunks = getSpeechChunks(text);
  const voices = synthesis.getVoices?.() ?? [];
  const voice = voices.find((item) => item.localService && item.lang.toLowerCase() === "pt-br");
  let current: SpeechSynthesisUtterance | null = null;
  let releaseActivity: (() => void) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function release() {
    clearTimeout(timer);
    window.removeEventListener("pagehide", interrupt);
    document.removeEventListener("visibilitychange", stopWhenHidden);
    releaseActivity?.();
    releaseActivity = undefined;
  }

  function cancelCurrent() {
    if (!current) return;
    current = null;
    try {
      synthesis.cancel();
      // Some browsers keep their synthesis queue paused after cancellation.
      if (synthesis.paused) synthesis.resume?.();
    } catch {
      // The cancelled utterance cannot schedule any further chunks.
    }
  }

  function stop() {
    cancelCurrent();
    release();
  }

  function interrupt() {
    stop();
    onInterrupt?.();
  }

  function stopWhenHidden() {
    if (document.hidden) interrupt();
  }

  function fail() {
    stop();
    onError();
  }

  function speakChunk(index: number) {
    if (index >= chunks.length) {
      current = null;
      release();
      onComplete();
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.lang = speechLanguage;
      utterance.rate = rate;
      if (voice) utterance.voice = voice;
      utterance.onend = () => {
        if (current !== utterance) return;
        clearTimeout(timer);
        speakChunk(index + 1);
      };
      utterance.onerror = () => {
        if (current !== utterance) return;
        fail();
      };
      current = utterance;
      timer = setTimeout(fail, utteranceTimeoutMs);
      synthesis.speak(utterance);
    } catch {
      fail();
    }
  }

  return {
    start: () => {
      releaseActivity = beginAudioActivity(interrupt);
      window.addEventListener("pagehide", interrupt);
      document.addEventListener("visibilitychange", stopWhenHidden);
      speakChunk(0);
    },
    pause: canPauseSpeech() ? () => {
      synthesis.pause();
      clearTimeout(timer);
    } : undefined,
    resume: canPauseSpeech() ? () => {
      timer = setTimeout(fail, utteranceTimeoutMs);
      synthesis.resume();
    } : undefined,
    stop,
  };
}

export function stopActiveSpeech() {
  stopActiveAudio();
}

export function speakVoiceFeedback(text: string) {
  if (!isSpeechAvailable() || !text.trim()) return false;

  try {
    createSpeechPlayback({ text, rate: 1, onComplete: () => {}, onError: () => {} }).start();
    return true;
  } catch {
    return false;
  }
}
