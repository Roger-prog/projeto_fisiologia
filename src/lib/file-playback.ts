import { beginAudioActivity } from "./audio-activity";
import type { NarrationFailure } from "./narration-playback";
import type { AudioPlayback } from "./speech-playback";

const bufferTimeoutMs = 15_000;
const checkTimeoutMs = 6_000;
const retryDelayMs = 350;
const checkedSources = new Set<string>();

async function checkSource(source: string, signal: AbortSignal): Promise<NarrationFailure["code"] | undefined> {
  if (checkedSources.has(source)) return;
  try {
    const response = await fetch(source, { method: "HEAD", credentials: "same-origin", signal });
    if (response.status === 408 || response.status === 429 || response.status >= 500) return "network";
    const contentType = response.headers.get("content-type")?.split(";")[0].trim();
    if (!response.ok || (contentType && !contentType.startsWith("audio/") && contentType !== "application/octet-stream")) {
      return "missing-file";
    }
    checkedSources.add(source);
  } catch {
    return "network";
  }
}

export function createFilePlayback({
  sources,
  rate,
  onComplete,
  onError,
  onRetry,
  onInterrupt,
  onProgress,
}: {
  sources: readonly string[];
  rate: number;
  onComplete: () => void;
  onError: (failure: NarrationFailure) => void;
  onRetry?: (failure: NarrationFailure) => void;
  onInterrupt?: () => void;
  onProgress?: (fraction: number) => void;
}): AudioPlayback {
  const audio = new Audio();
  audio.defaultPlaybackRate = rate;
  let index = 0;
  let playAttempt = 0;
  let paused = false;
  let closed = false;
  let loaded = false;
  let retriedMedia = false;
  let lastTime = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let sourceCheck: AbortController | undefined;
  let releaseActivity: (() => void) | undefined;

  function clearBufferTimeout() {
    clearTimeout(timer);
    timer = undefined;
  }

  function stop() {
    if (closed) return;
    closed = true;
    clearBufferTimeout();
    clearTimeout(retryTimer);
    sourceCheck?.abort();
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    window.removeEventListener("pagehide", interrupt);
    document.removeEventListener("visibilitychange", stopWhenHidden);
    releaseActivity?.();
  }

  function fail(code: NarrationFailure["code"]) {
    if (closed) return;
    stop();
    onError({ code });
  }

  function interrupt() {
    stop();
    onInterrupt?.();
  }

  function stopWhenHidden() {
    if (document.hidden) interrupt();
  }

  function waitForAudio() {
    if (!closed && !paused && timer === undefined) timer = setTimeout(recoverMedia, bufferTimeoutMs);
  }

  function play() {
    const attempt = ++playAttempt;
    waitForAudio();
    try {
      void audio.play()?.catch((error: unknown) => {
        if (attempt !== playAttempt || paused || closed || retryTimer !== undefined) return;
        if (audio.error?.code === 2) recoverMedia();
        else fail(error instanceof DOMException && error.name === "NotAllowedError" ? "blocked" : "media-error");
      });
    } catch {
      fail("media-error");
    }
  }

  function playTrack(offset = 0) {
    loaded = true;
    audio.onloadedmetadata = offset > 0 ? () => {
      if (!closed && Number.isFinite(audio.duration) && offset < audio.duration) audio.currentTime = offset;
    } : null;
    audio.src = sources[index];
    audio.playbackRate = rate;
    if (!paused) play();
  }

  function recoverMedia() {
    if (closed || retryTimer !== undefined) return;
    checkedSources.delete(sources[index]);
    if (retriedMedia) {
      fail("network");
      return;
    }
    retriedMedia = true;
    loaded = false;
    playAttempt += 1;
    clearBufferTimeout();
    audio.pause();
    onRetry?.({ code: "network" });
    retryTimer = setTimeout(() => {
      retryTimer = undefined;
      playTrack(lastTime);
    }, retryDelayMs);
  }

  async function checkAndPlay(retried = false) {
    const controller = new AbortController();
    sourceCheck = controller;
    const timeout = setTimeout(() => controller.abort(), checkTimeoutMs);
    const results = await Promise.all([...new Set(sources)].map((source) => checkSource(source, controller.signal)));
    clearTimeout(timeout);
    sourceCheck = undefined;
    if (closed) return;
    if (results.includes("missing-file")) fail("missing-file");
    else if (results.includes("network")) {
      if (retried) fail("network");
      else {
        onRetry?.({ code: "network" });
        retryTimer = setTimeout(() => {
          retryTimer = undefined;
          void checkAndPlay(true);
        }, retryDelayMs);
      }
    } else playTrack();
  }

  audio.onplaying = clearBufferTimeout;
  audio.onwaiting = waitForAudio;
  audio.onerror = () => {
    if (closed || retryTimer !== undefined) return;
    if (audio.error?.code === 2) recoverMedia();
    else {
      checkedSources.delete(sources[index]);
      fail("media-error");
    }
  };
  audio.ontimeupdate = () => {
    if (closed || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    if (audio.currentTime > lastTime) lastTime = audio.currentTime;
    onProgress?.((index + Math.min(1, audio.currentTime / audio.duration)) / sources.length);
  };
  audio.onended = () => {
    if (closed) return;
    clearBufferTimeout();
    index += 1;
    lastTime = 0;
    retriedMedia = false;
    onProgress?.(index / sources.length);
    if (index < sources.length) playTrack();
    else {
      stop();
      onComplete();
    }
  };

  return {
    start() {
      if (closed || releaseActivity) return;
      if (!sources.length) {
        fail("missing-clips");
        return;
      }
      releaseActivity = beginAudioActivity(interrupt);
      window.addEventListener("pagehide", interrupt);
      document.addEventListener("visibilitychange", stopWhenHidden);
      if (sources.every((source) => checkedSources.has(source))) playTrack();
      else void checkAndPlay();
    },
    stop,
    pause() {
      paused = true;
      playAttempt += 1;
      audio.pause();
      clearBufferTimeout();
    },
    resume() {
      if (closed) return;
      paused = false;
      if (loaded) play();
    },
  };
}
