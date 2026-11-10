"use client";

import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { useState } from "react";
import { breathingPhases } from "@/data/simulations";
import styles from "./simulations.module.css";

export function BreathingSimulation() {
  const [index, setIndex] = useState(0);
  const phase = breathingPhases[index];
  const lastPhase = index === breathingPhases.length - 1;

  return (
    <section className="study-panel" aria-labelledby="ciclo-respiratorio">
      <h2 id="ciclo-respiratorio">Percorra o ciclo respiratório</h2>
      <p>Use os botões para avançar no seu ritmo. O texto descreve, em cada fase, o que o esquema representa.</p>

      <div className={`control-row ${styles.phaseControls}`}>
        <button type="button" className="button button-secondary" aria-disabled={index === 0} onClick={() => setIndex((current) => Math.max(0, current - 1))}>
          <ArrowLeft size={18} aria-hidden="true" /> Fase anterior
        </button>
        <button type="button" className="button button-primary" onClick={() => setIndex((current) => (current + 1) % breathingPhases.length)}>
          {lastPhase ? "Reiniciar ciclo" : "Próxima fase"}
          {lastPhase ? <RotateCcw size={18} aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}
        </button>
      </div>

      <div className={styles.phaseDisplay}>
        <div className={styles.phaseCopy}>
          <p className="eyebrow" role="status">
            Fase {index + 1} de {breathingPhases.length}
            <span className="sr-only">. {phase.title}. {phase.airflow}</span>
          </p>
          <h3>{phase.title}</h3>
          <dl className={styles.phaseFacts}>
            <div><dt>Diafragma</dt><dd>{phase.diaphragm}</dd></div>
            <div><dt>Volume torácico</dt><dd>{phase.volume}</dd></div>
            <div><dt>Pressão alveolar</dt><dd>{phase.pressure}</dd></div>
            <div><dt>Fluxo de ar</dt><dd>{phase.airflow}</dd></div>
          </dl>
          <p>{phase.explanation}</p>
        </div>

        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 340 250"
          className={styles.breathingDiagram}
          data-phase={phase.id}
        >
          <path className={styles.thorax} d="M53 183V111C53 62 99 53 133 62L152 68H188L207 62C241 53 287 62 287 111V183Q287 222 248 222H92Q53 222 53 183Z" />
          <g className={styles.lungs}>
            <path d="M152 93C121 70 89 112 81 148C73 179 94 194 115 187C144 178 157 165 157 133V101Q156 97 152 93Z" />
            <path d="M188 93C219 70 251 112 259 148C267 179 246 194 225 187C196 178 183 165 183 133V101Q184 97 188 93Z" />
          </g>
          <path className={styles.airway} d="M170 66V111L129 139M170 111L211 139" />
          <path className={styles.diaphragm} d="M71 202Q170 162 269 202" />
          {phase.direction === "in" && <path className={styles.flowArrow} d="M170 15V49M157 37L170 50L183 37" />}
          {phase.direction === "out" && <path className={styles.flowArrow} d="M170 50V16M157 28L170 15L183 28" />}
          {phase.direction === "none" && <path className={styles.flowArrow} d="M157 34H183" />}
        </svg>
      </div>
    </section>
  );
}
