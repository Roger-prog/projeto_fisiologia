import { beginAudioActivity, stopActiveAudio } from "./audio-activity";

const speechLanguage = "pt-BR";
const maxChunkLength = 220;
const utteranceStartupTimeoutMs = 8_000;
const utteranceTimeoutMs = 45_000;
let browserVoices: SpeechSynthesisVoice[] = [];

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

function voiceRank(voice: SpeechSynthesisVoice) {
  const exactLocale = voice.lang.toLowerCase().replace("_", "-") === "pt-br";
  const natural = /natural|neural|premium|enhanced|aprimorad/i.test(voice.name);
  return (exactLocale ? 8 : 0) + (natural ? 4 : 0) + (voice.default ? 2 : 0) + (voice.localService ? 1 : 0);
}

export function getBrowserNarrationVoices() {
  const installed = window.speechSynthesis?.getVoices?.() ?? [];
  const available = installed.filter((voice) => /^pt(?:[-_]|$)/i.test(voice.lang) && voice.voiceURI)
    .sort((left, right) => voiceRank(right) - voiceRank(left) || left.name.localeCompare(right.name, speechLanguage));
  const voices = Array.from(new Map(available.map((voice) => [voice.voiceURI, voice])).values());
  if (voices.length !== browserVoices.length || voices.some((voice, index) =>
    voice.voiceURI !== browserVoices[index].voiceURI || voice.name !== browserVoices[index].name ||
    voice.lang !== browserVoices[index].lang || voice.localService !== browserVoices[index].localService ||
    voice.default !== browserVoices[index].default,
  )) browserVoices = voices;
  return browserVoices;
}

export function subscribeSpeechVoices(listener: () => void) {
  const synthesis = window.speechSynthesis;
  synthesis?.addEventListener?.("voiceschanged", listener);
  return () => synthesis?.removeEventListener?.("voiceschanged", listener);
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
  voiceURI,
  onComplete,
  onError,
  onInterrupt,
  onProgress,
}: {
  text: string;
  rate: number;
  voiceURI?: string;
  onComplete: () => void;
  onError: () => void;
  onInterrupt?: () => void;
  onProgress?: (fraction: number) => void;
}): AudioPlayback {
  const synthesis = window.speechSynthesis;
  const chunks = getSpeechChunks(text);
  const voices = getBrowserNarrationVoices();
  const voice = voiceURI ? voices.find((item) => item.voiceURI === voiceURI) : voices[0];
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

  function waitForUtteranceEnd() {
    clearTimeout(timer);
    timer = setTimeout(fail, utteranceTimeoutMs);
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
      utterance.lang = voice?.lang || speechLanguage;
      utterance.rate = rate;
      if (voice) utterance.voice = voice;
      utterance.onstart = () => {
        if (current === utterance && !synthesis.paused) waitForUtteranceEnd();
      };
      utterance.onend = () => {
        if (current !== utterance) return;
        clearTimeout(timer);
        onProgress?.((index + 1) / chunks.length);
        speakChunk(index + 1);
      };
      utterance.onboundary = ({ charIndex }) => {
        if (current === utterance) onProgress?.((index + charIndex / chunks[index].length) / chunks.length);
      };
      utterance.onerror = () => {
        if (current !== utterance) return;
        fail();
      };
      current = utterance;
      timer = setTimeout(() => {
        // Some engines do not report start; avoid cutting off audio that is already playing.
        if (synthesis.speaking && !synthesis.paused) waitForUtteranceEnd();
        else fail();
      }, utteranceStartupTimeoutMs);
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
      waitForUtteranceEnd();
      synthesis.resume();
    } : undefined,
    stop,
  };
}

export function stopActiveSpeech() {
  stopActiveAudio();
}

export function speakVoiceFeedback(text: string, onError?: () => void, voiceURI?: string) {
  if (!isSpeechAvailable() || !text.trim()) return false;

  try {
    let failed = false;
    createSpeechPlayback({
      text,
      rate: 1,
      voiceURI,
      onComplete: () => {},
      onError: () => {
        failed = true;
        onError?.();
      },
    }).start();
    return !failed;
  } catch {
    return false;
  }
}
