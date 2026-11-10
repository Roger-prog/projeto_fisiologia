"use client";

import { Square, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { type HeartRate, heartRateQuestions, heartRates, secondsPerBeat } from "@/data/simulations";
import { createHeartbeatAudio } from "./heartbeat-audio";
import styles from "./simulations.module.css";

const rhythms = ["A", "B"] as const;
type Rhythm = (typeof rhythms)[number];
type SoundState =
  | { kind: "idle" | "stopped" | "unavailable" | "error" }
  | { kind: "preparing" | "playing"; rhythm: Rhythm; rate: HeartRate };

const secondsFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function intervalText(rate: HeartRate) {
  return `${secondsFormat.format(secondsPerBeat(rate))} segundo${rate === 60 ? "" : "s"}`;
}

function soundMessage(sound: SoundState) {
  switch (sound.kind) {
    case "idle": return "Som desligado.";
    case "preparing": return `Preparando o som do ritmo ${sound.rhythm}.`;
    case "playing": return `Som do ritmo ${sound.rhythm} em reprodução, a ${sound.rate} bpm.`;
    case "stopped": return "Som interrompido.";
    case "unavailable": return "O som sintético está indisponível neste navegador. A comparação numérica continua disponível.";
    case "error": return "O navegador não conseguiu reproduzir o som. A comparação numérica continua disponível.";
  }
}

export function HeartRateSimulation() {
  const [rates, setRates] = useState<Record<Rhythm, HeartRate>>({ A: 60, B: 120 });
  const [sound, setSound] = useState<SoundState>({ kind: "idle" });
  const audio = useRef<ReturnType<typeof createHeartbeatAudio> | null>(null);
  const activeRhythm = sound.kind === "preparing" || sound.kind === "playing" ? sound.rhythm : null;

  const releaseAudio = useCallback(() => {
    const playing = audio.current;
    audio.current = null;
    playing?.stop();
    return Boolean(playing);
  }, []);

  useEffect(() => {
    function mute() {
      if (releaseAudio()) setSound({ kind: "stopped" });
    }
    function muteWhenHidden() {
      if (document.hidden) mute();
    }
    window.addEventListener("pagehide", mute);
    document.addEventListener("visibilitychange", muteWhenHidden);
    return () => {
      window.removeEventListener("pagehide", mute);
      document.removeEventListener("visibilitychange", muteWhenHidden);
      releaseAudio();
    };
  }, [releaseAudio]);

  async function play(rhythm: Rhythm) {
    if (activeRhythm === rhythm) return;
    releaseAudio();
    if (typeof window.AudioContext !== "function") {
      setSound({ kind: "unavailable" });
      return;
    }

    const rate = rates[rhythm];
    let playback: ReturnType<typeof createHeartbeatAudio> | undefined;
    try {
      playback = createHeartbeatAudio(rate);
      audio.current = playback;
      setSound({ kind: "preparing", rhythm, rate });
      await playback.start();
      if (audio.current === playback) setSound({ kind: "playing", rhythm, rate });
    } catch {
      if (playback && audio.current !== playback) return;
      releaseAudio();
      setSound({ kind: "error" });
    }
  }

  const rateDifference = Math.abs(rates.A - rates.B);
  const fasterRhythm = rates.A > rates.B ? "A" : "B";

  return (
    <>
      <section className="study-panel" aria-labelledby="comparar-ritmos">
        <h2 id="comparar-ritmos">Compare dois ritmos</h2>
        <p>A frequência cardíaca é o número de batimentos do coração em um minuto. Em um ritmo regular, o intervalo entre batimentos é igual a 60 segundos divididos pela frequência em batimentos por minuto (bpm).</p>

        <div className={`${styles.rateGrid} ${styles.rateFields}`}>
          {rhythms.map((rhythm) => (
            <div className={styles.rateField} key={rhythm}>
              <label htmlFor={`frequencia-${rhythm}`} className="field-label">Frequência do ritmo {rhythm}</label>
              <select
                className="study-select"
                id={`frequencia-${rhythm}`}
                value={rates[rhythm]}
                onChange={(event) => {
                  const rate = Number(event.target.value) as HeartRate;
                  if (releaseAudio()) setSound({ kind: "stopped" });
                  setRates({ ...rates, [rhythm]: rate });
                }}
              >
                {heartRates.map((rate) => <option key={rate} value={rate}>{rate} bpm</option>)}
              </select>
            </div>
          ))}
        </div>

        <div className={styles.comparison} role="status">
          <dl className={styles.rateGrid}>
            {rhythms.map((rhythm) => (
              <div key={rhythm}>
                <dt>Ritmo {rhythm}</dt>
                <dd><strong>{rates[rhythm]} bpm</strong> · {intervalText(rates[rhythm])} entre batimentos</dd>
              </div>
            ))}
          </dl>
          <p>{rateDifference === 0
            ? "Os dois ritmos têm a mesma frequência e o mesmo intervalo entre batimentos."
            : `O ritmo ${fasterRhythm} tem ${rateDifference} batimentos a mais por minuto e um intervalo menor entre batimentos.`}</p>
        </div>

        <div className={styles.soundControls}>
          <h3>Som opcional</h3>
          <p>Cada pulso sonoro representa um batimento simulado. Ouça um ritmo por vez.</p>
          <div className="control-row">
            {rhythms.map((rhythm) => (
              <button type="button" className="button button-secondary" key={rhythm} aria-disabled={activeRhythm === rhythm} onClick={() => void play(rhythm)}>
                <Volume2 size={18} aria-hidden="true" /> Ouvir ritmo {rhythm}
              </button>
            ))}
            <button type="button" className="button button-secondary" aria-disabled={!activeRhythm} onClick={() => {
              if (releaseAudio()) setSound({ kind: "stopped" });
            }}>
              <Square size={16} aria-hidden="true" /> Parar som
            </button>
          </div>
          <p role="status">{soundMessage(sound)}</p>
        </div>
      </section>

      <section className="study-panel" aria-labelledby="interpretar-ritmos">
        <h2 id="interpretar-ritmos">Interprete os resultados</h2>
        <p>Tente responder antes de abrir a explicação.</p>
        <ul className="review-list">
          {heartRateQuestions.map((question) => (
            <li key={question.id}>
              <details className="review-card">
                <summary>{question.prompt}</summary>
                <p>{question.answer}</p>
              </details>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
