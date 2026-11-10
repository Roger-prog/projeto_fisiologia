import { stopActiveAudio } from "./audio-activity";
import { createFilePlayback } from "./file-playback";
import { getNarrationSources, type NarrationManifest } from "./narration-manifest";
import { prepareNarrationText } from "./narration-pronunciation";
import { createSpeechPlayback, getBrowserNarrationVoices, isSpeechAvailable, type AudioPlayback } from "./speech-playback";

export type NarrationFailure = {
  code: "missing-clips" | "missing-file" | "network" | "media-error" | "blocked" | "unavailable";
};

type NarrationDiagnostic = { type: "narration-error" | "narration-retry"; failure: NarrationFailure };
const listeners = new Set<(event: NarrationDiagnostic) => void>();

export const temporaryBrowserNotice = "Voz do navegador usada temporariamente. Sua preferência foi mantida.";

export function subscribeNarrationDiagnostics(listener: (event: NarrationDiagnostic) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function isBrowserNarrationVoice(voiceId: string) {
  return voiceId === "browser" || voiceId.startsWith("browser:");
}

export function resolveNarrationVoice(manifest: NarrationManifest | null, preference: string | null) {
  return preference ?? (manifest ? manifest.voices[0]?.id ?? "browser" : null);
}

export function stopNarrationPlayback() {
  stopActiveAudio();
}

export function createNarrationPlayback({
  manifest, voiceId, clipIds, text, rate, onError, onRetry, onComplete, onInterrupt, onProgress,
}: {
  manifest: NarrationManifest | null;
  voiceId: string;
  clipIds: readonly string[];
  text: string;
  rate: number;
  onError: (failure: NarrationFailure) => void;
  onRetry?: (failure: NarrationFailure) => void;
  onComplete: () => void;
  onInterrupt?: () => void;
  onProgress?: (fraction: number) => void;
}): AudioPlayback {
  function fail(failure: NarrationFailure) {
    listeners.forEach((notify) => notify({ type: "narration-error", failure }));
    onError(failure);
  }

  function retry(failure: NarrationFailure) {
    listeners.forEach((notify) => notify({ type: "narration-retry", failure }));
    onRetry?.(failure);
  }

  function unavailable(code: NarrationFailure["code"]): AudioPlayback {
    return { start: () => { stopActiveAudio(); fail({ code }); }, stop() {} };
  }

  const callbacks = { rate, onComplete, onInterrupt, onProgress };
  if (isBrowserNarrationVoice(voiceId)) {
    const voiceURI = voiceId === "browser" ? undefined : voiceId.slice("browser:".length);
    if (!isSpeechAvailable() || !text.trim() || (voiceURI !== undefined &&
      !getBrowserNarrationVoices().some((voice) => voice.voiceURI === voiceURI))) return unavailable("unavailable");
    return createSpeechPlayback({
      ...callbacks,
      text: prepareNarrationText(text),
      voiceURI,
      onError: () => fail({ code: "media-error" }),
    });
  }

  if (!manifest?.voices.some(({ id }) => id === voiceId)) return unavailable("unavailable");
  const sources = getNarrationSources(manifest, clipIds, voiceId);
  if (!sources) return unavailable("missing-clips");
  if (typeof Audio !== "function") return unavailable("unavailable");
  return createFilePlayback({ ...callbacks, sources, onError: fail, onRetry: retry });
}
