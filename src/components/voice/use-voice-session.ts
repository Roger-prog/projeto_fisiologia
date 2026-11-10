"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getBrowserVoiceRecognizer, isVoiceRecognitionAvailable } from "@/lib/voice-recognition";
import { createVoiceSession, type VoiceSessionState } from "@/lib/voice-session";

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

export function useVoiceSession(onTranscript: (text: string) => void, onEnd?: () => void) {
  const support = useSyncExternalStore(subscribeSupport, getClientSupport, getServerSupport);
  const [snapshot, setSnapshot] = useState<Snapshot>({ state: "inactive", message: "" });
  const session = useRef<ReturnType<typeof createVoiceSession> | null>(null);
  const callbacks = useRef({ onTranscript, onEnd });

  useEffect(() => {
    callbacks.current = { onTranscript, onEnd };
  }, [onTranscript, onEnd]);

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
  const active = state === "requesting" || state === "listening" || state === "processing" || state === "narrating";

  return { support, state, message, active, start, end: () => session.current?.end() };
}
