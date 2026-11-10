"use client";

import { Mic, MicOff, Square, Volume2 } from "lucide-react";
import { useId, useRef, useSyncExternalStore } from "react";
import { getAudioActive, subscribeAudioActivity } from "@/lib/audio-activity";
import type { VoiceSessionState } from "@/lib/voice-session";
import { useVoiceControls } from "./voice-provider";
import styles from "./voice-controls.module.css";

const labels: Record<VoiceSessionState, string> = {
  inactive: "Inativa",
  requesting: "Solicitando permissão",
  listening: "Escutando",
  processing: "Processando comando",
  narrating: "Narrando resposta",
  error: "Erro",
  unavailable: "Indisponível",
};

function getServerAudioActive() {
  return false;
}

export function VoiceControls() {
  const controls = useVoiceControls();
  const titleId = useId();
  const privacyId = useId();
  const toggle = useRef<HTMLButtonElement>(null);
  const options = useRef<HTMLButtonElement>(null);
  const audioActive = useSyncExternalStore(subscribeAudioActivity, getAudioActive, getServerAudioActive);
  if (!controls) return null;

  const { session, feedback } = controls;
  const { active, state, support, message } = session;
  const liveMessage = state === "error" || state === "requesting"
    ? message
    : feedback ? (feedback.announce ? feedback.message : "") : state === "inactive" ? message : "";
  const Icon = active ? MicOff : Mic;
  const canStopAudio = audioActive && (active || feedback?.announce === false);

  return (
    <section className={styles.band} aria-labelledby={titleId} data-voice-state={state}>
      <div className={`site-shell ${styles.inner}`}>
        <div className={styles.copy}>
          <p className={styles.title}>
            <span id={titleId}>Interação por voz</span>
            <span className={styles.status} data-voice-status>{labels[state]}</span>
          </p>
          <p id={privacyId} className={styles.detail}>
            A ativação usa o microfone. O navegador pode enviar a fala ao serviço de reconhecimento que utiliza.
            O FisioAcessível não armazena o áudio nem o texto reconhecido.
          </p>
        </div>
        <div className="control-row">
          <button
            ref={toggle}
            className={`button ${active ? "button-primary" : "button-secondary"}`}
            type="button"
            aria-describedby={!active ? privacyId : undefined}
            disabled={support !== "available" && !active}
            onClick={active ? controls.end : controls.activate}
          >
            <Icon size={18} aria-hidden="true" />
            {active ? "Encerrar interação por voz" : "Ativar interação por voz"}
          </button>
          <button ref={options} className="button button-secondary" type="button" onClick={controls.hearOptions}>
            <Volume2 size={18} aria-hidden="true" /> Ouvir minhas opções
          </button>
          {canStopAudio && (
            <button
              className="button button-secondary"
              type="button"
              onClick={() => {
                if (active) toggle.current?.focus();
                else options.current?.focus();
                controls.stopNarration();
              }}
            >
              <Square size={16} aria-hidden="true" /> Parar áudio
            </button>
          )}
        </div>
        {(message || feedback) && (
          <div className={styles.feedback}>
            {message && message !== feedback?.message && (
              <p>{message}{state === "listening" && " Diga Ajuda para ouvir as opções."}</p>
            )}
            <p data-voice-feedback>{feedback?.message}</p>
          </div>
        )}
        <p role="status" className="sr-only">{liveMessage}</p>
      </div>
    </section>
  );
}
