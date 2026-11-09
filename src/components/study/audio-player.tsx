"use client";

import { Pause, Play, Square, Volume2 } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import {
  type AudioPlayback,
  canPauseSpeech,
  createSpeechPlayback,
  isSpeechAvailable,
} from "@/lib/speech-playback";

type PlaybackState = "idle" | "playing" | "paused" | "stopped" | "finished" | "error";

const messages: Record<PlaybackState, string> = {
  idle: "",
  playing: "Leitura em andamento.",
  paused: "Leitura pausada.",
  stopped: "Leitura interrompida.",
  finished: "Leitura concluída.",
  error: "Não foi possível reproduzir a leitura em voz alta. O texto completo está nesta página.",
};

function subscribeToSupport() {
  return () => {};
}

function getSpeechSupport() {
  if (!isSpeechAvailable()) return "unavailable";
  return canPauseSpeech() ? "can-pause" : "can-play";
}

function getServerSpeechSupport() {
  return "pending";
}

export function AudioPlayer({ text }: { text: string }) {
  const support = useSyncExternalStore(subscribeToSupport, getSpeechSupport, getServerSpeechSupport);
  const [state, setState] = useState<PlaybackState>("idle");
  const [rate, setRate] = useState("1");
  const playback = useRef<AudioPlayback | null>(null);
  const primaryButton = useRef<HTMLButtonElement>(null);
  const stopButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const speedId = useId();
  const speedHintId = useId();
  const active = state === "playing" || state === "paused";

  useEffect(() => () => {
    playback.current?.stop();
    playback.current = null;
  }, []);

  function finish(nextState: PlaybackState) {
    if (document.activeElement === stopButton.current) primaryButton.current?.focus();
    playback.current = null;
    setState(nextState);
  }

  function togglePlayback() {
    try {
      if (state === "playing") {
        if (playback.current?.pause) {
          setState("paused");
          playback.current.pause();
        }
      } else if (state === "paused") {
        setState("playing");
        playback.current?.resume?.();
      } else if (isSpeechAvailable()) {
        playback.current = createSpeechPlayback({
          text,
          rate: Number(rate),
          onComplete: () => finish("finished"),
          onError: () => finish("error"),
        });
        setState("playing");
        playback.current.start();
      }
    } catch {
      playback.current?.stop();
      finish("error");
    }
  }

  return (
    <section className="study-panel audio-player" aria-labelledby={titleId}>
      <div className="audio-heading">
        <Volume2 size={22} aria-hidden="true" />
        <h2 id={titleId}>Leitura em voz alta</h2>
      </div>
      {support === "unavailable" ? (
        <p>A leitura em voz alta não está disponível neste navegador. O texto completo está nesta página.</p>
      ) : support === "pending" ? (
        <p>Os controles de leitura em voz alta dependem dos recursos do navegador.</p>
      ) : (
        <>
          <p id={speedHintId}>Escolha a velocidade antes de iniciar a leitura.</p>
          <div className="control-row audio-controls">
            <button
              type="button"
              className="button button-primary"
              ref={primaryButton}
              aria-disabled={state === "playing" && support !== "can-pause"}
              onClick={togglePlayback}
            >
              {state === "playing" && support === "can-pause"
                ? <><Pause size={18} aria-hidden="true" />Pausar</>
                : <><Play size={18} aria-hidden="true" />{state === "paused" ? "Continuar" : "Ouvir a aula"}</>}
            </button>
            <button
              type="button"
              className="button button-secondary"
              ref={stopButton}
              disabled={!active}
              onClick={() => {
                playback.current?.stop();
                finish("stopped");
              }}
            >
              <Square size={16} aria-hidden="true" />
              Interromper
            </button>
            <div className="audio-speed">
              <label className="field-label" htmlFor={speedId}>Velocidade da leitura</label>
              <select
                id={speedId}
                className="study-select"
                aria-describedby={speedHintId}
                value={rate}
                onChange={(event) => setRate(event.target.value)}
                disabled={active}
              >
                <option value="0.75">0,75×</option>
                <option value="1">1×</option>
                <option value="1.25">1,25×</option>
                <option value="1.5">1,5×</option>
              </select>
            </div>
          </div>
          <p role="status" className="audio-status">{messages[state]}</p>
        </>
      )}
    </section>
  );
}
