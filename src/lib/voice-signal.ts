import { beginAudioActivity } from "./audio-activity";
import type { VoiceStatusCue } from "./voice-session";

export function createVoiceSignal() {
  const Audio = window.AudioContext;
  if (typeof Audio !== "function") return null;

  const context = new Audio();
  let interrupt: (() => void) | undefined;

  return {
    prepare() {
      void context.resume().catch(() => {});
    },
    available() {
      return context.state === "running" && typeof context.createOscillator === "function" && typeof context.createGain === "function";
    },
    play(cue: VoiceStatusCue, onUnavailable: () => void, onComplete?: () => void) {
      if (!this.available()) return false;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime;
      const duration = 0.14;
      const [from, to] = cue === "ready" ? [680, 910] : cue === "permission-denied" ? [440, 260] : [530, 380];
      let release: (() => void) | undefined;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let finished = false;

      function finish(played: boolean) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        interrupt = undefined;
        oscillator.onended = null;
        if (!played) {
          try { oscillator.stop(); } catch { /* The signal may not have started. */ }
        }
        oscillator.disconnect();
        gain.disconnect();
        release?.();
        if (played) onComplete?.();
        else onUnavailable();
      }

      oscillator.frequency.setValueAtTime(from, start);
      oscillator.frequency.linearRampToValueAtTime(to, start + duration);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.07, start + 0.02);
      gain.gain.linearRampToValueAtTime(0, start + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.onended = () => finish(true);
      release = beginAudioActivity(() => finish(false));
      interrupt = () => finish(false);
      try {
        oscillator.start(start);
        oscillator.stop(start + duration);
        timer = setTimeout(() => finish(false), 800);
        return true;
      } catch {
        finish(false);
        return false;
      }
    },
    close() {
      interrupt?.();
      void context.close().catch(() => {});
    },
  };
}
