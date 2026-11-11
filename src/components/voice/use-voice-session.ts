"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getBrowserVoiceRecognizer, isVoiceRecognitionAvailable, type VoiceTranscript } from "@/lib/voice-recognition";
import { narrationMessages } from "@/lib/narration-messages";
import { getClientStudyState } from "@/lib/study-storage";
import { createVoiceSession, type VoiceDiagnosticEvent, type VoiceSessionState, type VoiceStatusCue } from "@/lib/voice-session";
import { createVoiceSignal } from "@/lib/voice-signal";

type Support = "pending" | "available" | "unavailable";
type Snapshot = { state: VoiceSessionState; message: string };

const unavailableMessage = narrationMessages["reconhecimento-indisponivel"];
const readyMessage = "Escutando. Pode falar.";

function subscribeSupport() {
  return () => {};
}

function getClientSupport(): Support {
  return isVoiceRecognitionAvailable() ? "available" : "unavailable";
}

function getServerSupport(): Support {
  return "pending";
}

export function useVoiceSession(
  onTranscript: (result: VoiceTranscript) => void,
  onEnd?: () => void,
  onDiagnostic?: (event: VoiceDiagnosticEvent) => void,
  onSpokenCue?: (cue: VoiceStatusCue, onUnavailable: () => void) => boolean,
) {
  const support = useSyncExternalStore(subscribeSupport, getClientSupport, getServerSupport);
  const [snapshot, setSnapshot] = useState<Snapshot>({ state: "inactive", message: "" });
  const session = useRef<ReturnType<typeof createVoiceSession> | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const callbacks = useRef({ onTranscript, onEnd, onDiagnostic, onSpokenCue });
  const signal = useRef<ReturnType<typeof createVoiceSignal>>(null);
  const activation = useRef(0);

  useEffect(() => {
    callbacks.current = { onTranscript, onEnd, onDiagnostic, onSpokenCue };
  }, [onTranscript, onEnd, onDiagnostic, onSpokenCue]);

  useEffect(() => () => {
    activation.current += 1;
    session.current?.dispose();
    session.current = null;
    signal.current?.close();
    signal.current = null;
  }, []);

  function prepareSignal() {
    if (getClientStudyState().preferences.voiceFeedback !== "earcon") return;
    try {
      signal.current ??= createVoiceSignal();
      signal.current?.prepare();
    } catch {
      // The status remains available to assistive technology if the sound cannot start.
    }
  }

  function start() {
    if (session.current) return;
    const recognizer = getBrowserVoiceRecognizer();
    if (!recognizer) {
      setSnapshot({ state: "unavailable", message: unavailableMessage });
      return;
    }

    prepareSignal();
    const activationId = ++activation.current;
    let readyCueFailed = false;

    function announce(text: string) {
      if (activation.current === activationId) setAnnouncement(text);
    }

    function hasReadyAudio() {
      const { voiceFeedback } = getClientStudyState().preferences;
      return voiceFeedback === "earcon" && Boolean(signal.current?.available())
        || voiceFeedback === "spoken" && Boolean(callbacks.current.onSpokenCue);
    }

    function playCue(cue: VoiceStatusCue, onUnavailable: () => void, onComplete?: () => void) {
      const { voiceFeedback } = getClientStudyState().preferences;
      try {
        if (voiceFeedback === "earcon") return signal.current?.play(cue, onUnavailable, onComplete) ?? false;
        if (voiceFeedback === "spoken") return callbacks.current.onSpokenCue?.(cue, onUnavailable) ?? false;
      } catch {
        onUnavailable();
      }
      return false;
    }

    const current = createVoiceSession(recognizer, {
      onState: (state, message) => {
        setSnapshot({ state, message });
        if (state !== "listening") setAnnouncement("");
      },
      onTranscript: (text) => callbacks.current.onTranscript(text),
      onDiagnostic: (event) => callbacks.current.onDiagnostic?.(event),
      hasReadyAudio,
      onReadyAudio: () => {
        readyCueFailed = false;
        return playCue("ready", () => { readyCueFailed = true; });
      },
      onListeningReady: (usedAudio) => {
        if (!usedAudio || readyCueFailed) announce(readyMessage);
      },
      onTerminalCue: (cue, message, canPlay) => {
        if (activation.current !== activationId) return;
        const explain = () => announce(message);
        if (!canPlay || !playCue(cue, explain, explain)) explain();
      },
      onEnd: () => {
        session.current = null;
        callbacks.current.onEnd?.();
      },
    });
    session.current = current;
    current.start();
  }

  const { state, message } = support === "unavailable"
    ? { state: "unavailable" as const, message: unavailableMessage }
    : snapshot;
  const active = state === "requesting" || state === "listening" || state === "processing"
    || state === "narrating" || state === "recovering" || state === "suspended";

  return { support, state, message, announcement, active, start, prepareSignal, end: () => session.current?.end() };
}
