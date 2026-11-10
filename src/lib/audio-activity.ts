let currentAudio: { interrupt: () => void } | null = null;
const listeners = new Set<() => void>();

export function getAudioActive() {
  return currentAudio !== null;
}

export function subscribeAudioActivity(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function beginAudioActivity(interrupt: () => void) {
  const previous = currentAudio;
  const activity = { interrupt };
  currentAudio = activity;
  previous?.interrupt();
  if (!previous) notify();

  return () => {
    if (currentAudio !== activity) return;
    currentAudio = null;
    notify();
  };
}

export function stopActiveAudio() {
  currentAudio?.interrupt();
}
