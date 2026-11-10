"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { canPauseSpeech, createSpeechPlayback, isSpeechAvailable, type AudioPlayback } from "@/lib/speech-playback";

type PlaybackState = "idle" | "playing" | "paused" | "stopped" | "finished" | "error";
type SpeechSupport = "pending" | "unavailable" | "can-play" | "can-pause";

function subscribeToSupport() {
  return () => {};
}

function getSpeechSupport(): SpeechSupport {
  if (!isSpeechAvailable()) return "unavailable";
  return canPauseSpeech() ? "can-pause" : "can-play";
}

function getServerSpeechSupport(): SpeechSupport {
  return "pending";
}

export function useSpeechNarration(text: string, rate = 1, restoreFocus?: (status: PlaybackState) => void) {
  const support = useSyncExternalStore(subscribeToSupport, getSpeechSupport, getServerSpeechSupport);
  const [playbackState, setPlaybackState] = useState<{ text: string; status: PlaybackState }>({ text, status: "idle" });
  const playback = useRef<{ text: string; controls: AudioPlayback } | null>(null);
  const state = playbackState.text === text ? playbackState.status : "idle";
  const active = state === "playing" || state === "paused";

  useEffect(() => () => {
    if (playback.current?.text !== text) return;
    playback.current.controls.stop();
    playback.current = null;
  }, [text]);

  function finish(status: PlaybackState, moveFocus = true) {
    playback.current = null;
    setPlaybackState({ text, status });
    if (moveFocus) restoreFocus?.(status);
  }

  function play() {
    if (!isSpeechAvailable()) return;
    playback.current?.controls.stop();
    try {
      const controls = createSpeechPlayback({
        text,
        rate,
        onComplete: () => finish("finished"),
        onError: () => finish("error"),
        onInterrupt: () => finish("stopped", false),
      });
      playback.current = { text, controls };
      setPlaybackState({ text, status: "playing" });
      controls.start();
    } catch {
      playback.current?.controls.stop();
      finish("error");
    }
  }

  function stop() {
    playback.current?.controls.stop();
    finish("stopped");
  }

  function togglePause() {
    const controls = playback.current?.controls;
    if (!controls?.pause || !controls.resume) return;
    try {
      if (state === "playing") {
        setPlaybackState({ text, status: "paused" });
        controls.pause();
      } else if (state === "paused") {
        setPlaybackState({ text, status: "playing" });
        controls.resume();
      }
    } catch {
      controls.stop();
      finish("error");
    }
  }

  return { support, state, active, play, stop, togglePause };
}
