"use client";

import { RotateCcw, Square, Volume2 } from "lucide-react";
import { useRef } from "react";
import { useSpeechNarration } from "./use-speech-narration";

type NarrationState = ReturnType<typeof useSpeechNarration>;

const messages = {
  idle: "",
  playing: "Leitura em andamento.",
  paused: "Leitura pausada.",
  stopped: "Leitura interrompida.",
  finished: "Leitura concluída.",
  error: "Não foi possível reproduzir a leitura em voz alta. O texto completo está nesta página.",
} as const;

export function NarrationStatus({ support, state, unavailableMessage = "A leitura em voz alta não está disponível neste navegador. O texto completo está nesta página." }:
  Pick<NarrationState, "support" | "state"> & { unavailableMessage?: string }
) {
  if (support === "unavailable") {
    return <p>{unavailableMessage}</p>;
  }
  if (support === "pending") return null;

  return (
    <>
      {state !== "idle" && state !== "error" && <p className="audio-status">{messages[state]}</p>}
      {/* Reserve live announcements for failures so they do not compete with narration. */}
      <p className="audio-status empty:sr-only" role="status">{state === "error" ? messages.error : ""}</p>
    </>
  );
}

export function NarrationControls({ text, startLabel, repeatLabel, unavailableMessage }: {
  text: string;
  startLabel: string;
  repeatLabel?: string;
  unavailableMessage?: string;
}) {
  const startButton = useRef<HTMLButtonElement>(null);
  const stopButton = useRef<HTMLButtonElement>(null);
  const repeatButton = useRef<HTMLButtonElement>(null);
  const { support, state, active, play, stop } = useSpeechNarration(text, 1, (status) => {
    const focused = document.activeElement;
    if (focused === stopButton.current || (status === "error" && focused === repeatButton.current)) {
      startButton.current?.focus();
    }
  });
  const available = support === "can-play" || support === "can-pause";
  const canRepeat = state !== "idle" && state !== "error";

  return (
    <>
      {available && (
        <div className="control-row">
          <button
            type="button"
            className="button button-secondary"
            ref={startButton}
            aria-disabled={active}
            onClick={() => { if (!active) play(); }}
          >
            <Volume2 aria-hidden="true" size={18} /> {startLabel}
          </button>
          {repeatLabel && canRepeat && (
            <button type="button" className="button button-secondary" ref={repeatButton} onClick={play}>
              <RotateCcw aria-hidden="true" size={18} /> {repeatLabel}
            </button>
          )}
          {active && (
            <button type="button" className="button button-secondary" ref={stopButton} onClick={stop}>
              <Square aria-hidden="true" size={16} /> Parar leitura
            </button>
          )}
        </div>
      )}
      <NarrationStatus support={support} state={state} unavailableMessage={unavailableMessage} />
    </>
  );
}
