"use client";

import { Pause, Play, RotateCcw, Square, Volume2 } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useVoiceActions } from "@/components/voice/voice-provider";
import {
  type AudioPlayback,
  canPauseSpeech,
  createSpeechPlayback,
  getSpeechChunks,
  isSpeechAvailable,
} from "@/lib/speech-playback";

type PlaybackState = "idle" | "playing" | "paused" | "waiting" | "stopped" | "finished" | "error";

const messages: Record<PlaybackState, string> = {
  idle: "",
  playing: "Leitura em andamento.",
  paused: "Leitura pausada.",
  waiting: "Trecho lido. Diga “continuar leitura” ou “parar leitura”.",
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
  const nextBlock = useRef<number | null>(null);
  const voiceBlocks = useMemo(() => getSpeechChunks(text.replace(/\s+/gu, " "), 400), [text]);
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
    if (nextState !== "waiting") nextBlock.current = null;
    setState(nextState);
  }

  function beginPlayback(narration = text, next: number | null = null) {
    if (!isSpeechAvailable()) return false;
    playback.current?.stop();
    nextBlock.current = next;
    playback.current = createSpeechPlayback({
      text: narration,
      rate: Number(rate),
      onComplete: () => finish(next === null ? "finished" : "waiting"),
      onError: () => finish("error"),
      onInterrupt: () => finish("stopped"),
    });
    setState("playing");
    playback.current.start();
    return true;
  }

  function playBlock(index: number) {
    const block = voiceBlocks[index];
    if (!block) return false;
    const next = index + 1 < voiceBlocks.length ? index + 1 : null;
    const prompt = next === null ? "" : "\nDiga continuar leitura para ouvir mais ou parar leitura para encerrar.";
    try {
      return beginPlayback(block + prompt, next);
    } catch {
      playback.current?.stop();
      finish("error");
      return false;
    }
  }

  function stopReading() {
    playback.current?.stop();
    finish("stopped");
  }

  useVoiceActions((command) => {
    if (command.kind === "session-ended") {
      if (nextBlock.current !== null || playback.current) stopReading();
      return;
    }
    if (command.kind === "stop-reading") {
      if (nextBlock.current === null && !playback.current) return;
      stopReading();
      return { message: "Leitura interrompida." };
    }
    if (scope === "lesson" && window.location.hash === "#exercicios") return;
    if (command.kind === "start-reading" || command.kind === "repeat-reading" || command.kind === "continue-reading") {
      const index = command.kind === "continue-reading" ? nextBlock.current : 0;
      if (index === null) return { message: "Diga ouvir para iniciar a leitura." };
      if (!voiceBlocks.length || !playBlock(index)) {
        return { message: "A leitura em voz alta está indisponível. Consulte o texto da página.", speak: false };
      }
      return { message: index ? "Lendo o trecho seguinte." : "Lendo o primeiro trecho.", speak: false };
    }
  });

  function togglePlayback(restart = false) {
    try {
      if (restart) {
        beginPlayback();
      } else if (state === "waiting" && nextBlock.current !== null) {
        playBlock(nextBlock.current);
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
                  {state === "waiting" ? "Continuar leitura" : state === "paused" ? "Continuar" : replay ? "Repetir explicação" : section ? "Ouvir a etapa" : "Ouvir a aula"}
                </>}
            </button>
            <button
              type="button"
              className="button button-secondary"
              ref={stopButton}
              disabled={!active && state !== "waiting"}
              onClick={stopReading}
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
