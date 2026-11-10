import { beginAudioActivity } from "./audio-activity";
import type { AudioPlayback } from "./speech-playback";

const bufferTimeoutMs = 15_000;

export function createFilePlayback({
  sources,
  rate,
  onComplete,
  onError,
  onInterrupt,
  onProgress,
}: {
  sources: readonly string[];
  rate: number;
  onComplete: () => void;
  onError: () => void;
  onInterrupt?: () => void;
  onProgress?: (fraction: number) => void;
}): AudioPlayback {
  const audio = new Audio();
  audio.defaultPlaybackRate = rate;
  let index = 0;
  let playAttempt = 0;
  let paused = false;
  let closed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let releaseActivity: (() => void) | undefined;

  function clearBufferTimeout() {
    clearTimeout(timer);
    timer = undefined;
  }

  function stop() {
    if (closed) return;
    closed = true;
    clearBufferTimeout();
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    window.removeEventListener("pagehide", interrupt);
    document.removeEventListener("visibilitychange", stopWhenHidden);
    releaseActivity?.();
  }

  function fail() {
    if (closed) return;
    stop();
    onError();
  }

  function interrupt() {
    stop();
    onInterrupt?.();
  }

  function stopWhenHidden() {
    if (document.hidden) interrupt();
  }

  function waitForAudio() {
    if (!closed && !paused && timer === undefined) timer = setTimeout(fail, bufferTimeoutMs);
  }

  function play() {
    const attempt = ++playAttempt;
    waitForAudio();
    try {
      void audio.play()?.catch(() => {
        if (attempt === playAttempt && !paused) fail();
      });
    } catch {
      fail();
    }
  }

  function playTrack() {
    audio.src = sources[index];
    audio.playbackRate = rate;
    if (!paused) play();
  }

  audio.onplaying = clearBufferTimeout;
  audio.onwaiting = waitForAudio;
  audio.onerror = fail;
  audio.ontimeupdate = () => {
    if (closed || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    onProgress?.((index + Math.min(1, audio.currentTime / audio.duration)) / sources.length);
  };
  audio.onended = () => {
    if (closed) return;
    clearBufferTimeout();
    index += 1;
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
        fail();
        return;
      }
      releaseActivity = beginAudioActivity(interrupt);
      window.addEventListener("pagehide", interrupt);
      document.addEventListener("visibilitychange", stopWhenHidden);
      playTrack();
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
      play();
    },
  };
}
