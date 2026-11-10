"use client";

import { Pause, Play, RotateCcw, Square, Volume2 } from "lucide-react";
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

export function AudioPlayer({
  text,
  scope = "lesson",
  headingLevel = 2,
}: {
  text: string;
  scope?: "lesson" | "section";
  headingLevel?: 2 | 3;
}) {
  const support = useSyncExternalStore(subscribeToSupport, getSpeechSupport, getServerSpeechSupport);
  const [state, setState] = useState<PlaybackState>("idle");
  const [rate, setRate] = useState("1");
  const playback = useRef<AudioPlayback | null>(null);
  const primaryButton = useRef<HTMLButtonElement>(null);
  const stopButton = useRef<HTMLButtonElement>(null);
  const repeatButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const speedId = useId();
  const speedHintId = useId();
  const active = state === "playing" || state === "paused";
  const section = scope === "section";
  const replay = section && (state === "finished" || state === "stopped");
  const Heading = headingLevel === 2 ? "h2" : "h3";

  useEffect(() => {
    function stop() {
      playback.current?.stop();
      playback.current = null;
    }

    function onPageHide() {
      if (!playback.current) return;
      stop();
      setState("stopped");
    }

    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      stop();
    };
  }, []);

  function finish(nextState: PlaybackState) {
    if (document.activeElement === stopButton.current || document.activeElement === repeatButton.current) {
      primaryButton.current?.focus();
    }
    playback.current = null;
    setState(nextState);
  }

  function beginPlayback() {
    if (!isSpeechAvailable()) return;
    playback.current?.stop();
    playback.current = createSpeechPlayback({
      text,
      rate: Number(rate),
      onComplete: () => finish("finished"),
      onError: () => finish("error"),
    });
    setState("playing");
    playback.current.start();
  }

  function togglePlayback(restart = false) {
    try {
      if (restart) {
        beginPlayback();
      } else if (state === "playing") {
        if (playback.current?.pause) {
          setState("paused");
          playback.current.pause();
        }
      } else if (state === "paused") {
        setState("playing");
        playback.current?.resume?.();
      } else {
        beginPlayback();
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
        <Heading id={titleId}>{section ? "Leitura da etapa em voz alta" : "Leitura em voz alta"}</Heading>
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
              onClick={() => togglePlayback()}
            >
              {state === "playing" && support === "can-pause"
                ? <><Pause size={18} aria-hidden="true" />Pausar</>
                : <>
                  {replay ? <RotateCcw size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
                  {state === "paused" ? "Continuar" : replay ? "Repetir explicação" : section ? "Ouvir a etapa" : "Ouvir a aula"}
                </>}
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
            {section && active && (
              <button
                type="button"
                className="button button-secondary"
                ref={repeatButton}
                onClick={() => togglePlayback(true)}
              >
                <RotateCcw size={18} aria-hidden="true" />
                Repetir explicação
              </button>
            )}
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
          {/* Reserve the live region for failures to avoid narrating over playback. */}
          <p className="audio-status">{state !== "error" ? messages[state] : ""}</p>
          <p role="status" className="audio-status">{state === "error" ? messages.error : ""}</p>
        </>
      )}
    </section>
  );
}
