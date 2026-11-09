const speechLanguage = "pt-BR";
const maxChunkLength = 220;

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

function getSpeechChunks(text: string) {
  const chunks: string[] = [];

  for (const paragraph of text.split("\n")) {
    let chunk = "";
    for (const word of paragraph.trim().split(/\s+/u)) {
      if (chunk && chunk.length + word.length + 1 > maxChunkLength) {
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
}: {
  text: string;
  rate: number;
  onComplete: () => void;
  onError: () => void;
}): AudioPlayback {
  const synthesis = window.speechSynthesis;
  const chunks = getSpeechChunks(text);
  const voices = synthesis.getVoices?.() ?? [];
  const voice = voices.find((item) => item.localService && item.lang.toLowerCase() === "pt-br");
  let current: SpeechSynthesisUtterance | null = null;

  function speakChunk(index: number) {
    if (index >= chunks.length) {
      current = null;
      onComplete();
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.lang = speechLanguage;
      utterance.rate = rate;
      if (voice) utterance.voice = voice;
      utterance.onend = () => {
        if (current === utterance) speakChunk(index + 1);
      };
      utterance.onerror = () => {
        if (current !== utterance) return;
        current = null;
        onError();
      };
      current = utterance;
      synthesis.speak(utterance);
    } catch {
      current = null;
      onError();
    }
  }

  return {
    start: () => speakChunk(0),
    pause: canPauseSpeech() ? () => synthesis.pause() : undefined,
    resume: canPauseSpeech() ? () => synthesis.resume() : undefined,
    stop: () => {
      if (!current) return;
      current = null;
      synthesis.cancel();
      // cancel() leaves the browser's shared synthesis queue paused.
      if (synthesis.paused) synthesis.resume?.();
    },
  };
}
