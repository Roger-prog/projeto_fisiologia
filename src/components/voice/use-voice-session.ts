"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getBrowserVoiceRecognizer, isVoiceRecognitionAvailable } from "@/lib/voice-recognition";
import { createVoiceSession, type VoiceDiagnosticEvent, type VoiceSessionState } from "@/lib/voice-session";

type Support = "pending" | "available" | "unavailable";
type Snapshot = { state: VoiceSessionState; message: string };

const unavailableMessage = "O reconhecimento de voz está indisponível neste navegador. Use os controles da página para continuar.";

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
  onTranscript: (text: string) => void,
  onEnd?: () => void,
  onDiagnostic?: (event: VoiceDiagnosticEvent) => void,
) {
  const support = useSyncExternalStore(subscribeSupport, getClientSupport, getServerSupport);
  const [snapshot, setSnapshot] = useState<Snapshot>({ state: "inactive", message: "" });
  const session = useRef<ReturnType<typeof createVoiceSession> | null>(null);
  const callbacks = useRef({ onTranscript, onEnd, onDiagnostic });

  useEffect(() => {
    callbacks.current = { onTranscript, onEnd, onDiagnostic };
  }, [onTranscript, onEnd, onDiagnostic]);

  useEffect(() => () => {
    session.current?.dispose();
    session.current = null;
  }, []);

  function start() {
    if (session.current) return;
    const recognizer = getBrowserVoiceRecognizer();
    if (!recognizer) {
      setSnapshot({ state: "unavailable", message: unavailableMessage });
      return;
    }

    const current = createVoiceSession(recognizer, {
      onState: (state, message) => setSnapshot({ state, message }),
      onTranscript: (text) => callbacks.current.onTranscript(text),
      onDiagnostic: (event) => callbacks.current.onDiagnostic?.(event),
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

  return { support, state, message, active, start, end: () => session.current?.end() };
}
