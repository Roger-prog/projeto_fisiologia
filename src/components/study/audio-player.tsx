"use client";

import { Pause, Play, RotateCcw, Square, Volume2 } from "lucide-react";
import { useId, useRef, useState } from "react";
import { NarrationStatus } from "./narration-controls";
import { useSpeechNarration } from "./use-speech-narration";

export function AudioPlayer({
  text,
  scope = "lesson",
  headingLevel = 2,
  compact = false,
}: {
  text: string;
  scope?: "lesson" | "section";
  headingLevel?: 2 | 3;
  compact?: boolean;
}) {
  const [rate, setRate] = useState("1");
  const playButton = useRef<HTMLButtonElement>(null);
  const pauseButton = useRef<HTMLButtonElement>(null);
  const stopButton = useRef<HTMLButtonElement>(null);
  const repeatButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const speedId = useId();
  const speedHintId = useId();
  const { support, state, active, play, stop, togglePause } = useSpeechNarration(text, Number(rate), (status) => {
    const focused = document.activeElement;
    if (focused === stopButton.current || focused === pauseButton.current || (status === "error" && focused === repeatButton.current)) {
      playButton.current?.focus();
    }
  });
  const section = scope === "section";
  const canRepeat = section && state !== "idle" && state !== "error";
  const available = support === "can-play" || support === "can-pause";
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <section className="study-panel audio-player" aria-labelledby={titleId}>
      <div className="audio-heading">
        <Volume2 size={22} aria-hidden="true" />
        <Heading id={titleId}>{section ? "Leitura da etapa em voz alta" : "Leitura em voz alta"}</Heading>
      </div>
      {available && (
        <>
          {!compact && <p id={speedHintId}>Escolha a velocidade antes de iniciar a leitura.</p>}
          <div className="control-row audio-controls">
            <button
              type="button"
              className="button button-primary"
              ref={playButton}
              aria-disabled={active}
              onClick={() => { if (!active) play(); }}
            >
              <Play size={18} aria-hidden="true" />
              {section ? "Ouvir a etapa" : "Ouvir a aula"}
            </button>
            {canRepeat && (
              <button type="button" className="button button-secondary" ref={repeatButton} onClick={play}>
                <RotateCcw size={18} aria-hidden="true" />
                Repetir explicação
              </button>
            )}
            {active && (
              <button type="button" className="button button-secondary" ref={stopButton} onClick={stop}>
                <Square size={16} aria-hidden="true" />
                Parar leitura
              </button>
            )}
            {!compact && active && support === "can-pause" && (
              <button type="button" className="button button-secondary" ref={pauseButton} onClick={togglePause}>
                {state === "paused" ? <><Play size={18} aria-hidden="true" />Continuar</> : <><Pause size={18} aria-hidden="true" />Pausar</>}
              </button>
            )}
            {!compact && (
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
            )}
          </div>
        </>
      )}
      <NarrationStatus support={support} state={state} />
    </section>
  );
}
