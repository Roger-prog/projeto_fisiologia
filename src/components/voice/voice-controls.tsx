"use client";

import { Mic, MicOff, Square, Volume2 } from "lucide-react";
import { useId, useRef, useSyncExternalStore } from "react";
import { useStudy } from "@/components/study/study-provider";
import { getAudioActive, subscribeAudioActivity } from "@/lib/audio-activity";
import { setStudyPreferences } from "@/lib/study-storage";
import type { VoiceSessionState } from "@/lib/voice-session";
import { useVoiceControls } from "./voice-provider";
import styles from "./voice-controls.module.css";

const labels: Record<VoiceSessionState, string> = {
  inactive: "Inativa",
  requesting: "Solicitando permissão",
  listening: "Escutando",
  processing: "Processando comando",
  narrating: "Narrando resposta",
  recovering: "Recuperando a escuta",
  suspended: "Escuta suspensa",
  error: "Nova ativação necessária",
  unavailable: "Indisponível",
};

function getServerAudioActive() {
  return false;
}

export function VoiceControls() {
  const controls = useVoiceControls();
  const { preferVoice } = useStudy().preferences;
  const titleId = useId();
  const statusId = useId();
  const privacyId = useId();
  const preferenceId = useId();
  const messageId = useId();
  const toggle = useRef<HTMLButtonElement>(null);
  const options = useRef<HTMLButtonElement>(null);
  const audioActive = useSyncExternalStore(subscribeAudioActivity, getAudioActive, getServerAudioActive);
  if (!controls) return null;

  const { session, feedback, diagnostics } = controls;
  const { active, state, support, message } = session;
  const liveMessage = state === "error" || state === "requesting"
    ? message
    : feedback ? (feedback.announce ? feedback.message : "") : state === "inactive" ? message : "";
  const Icon = active ? MicOff : Mic;
  const canStopAudio = audioActive && (active || feedback?.announce === false);
  const showMessage = Boolean(message && (state === "error" || message !== feedback?.message));
  const describesRecovery = state === "recovering" || state === "suspended";
  const activeDescription = describesRecovery && showMessage ? `${statusId} ${messageId}` : statusId;
  const activationDescription = state === "error" && showMessage ? `${privacyId} ${messageId}` : privacyId;

  return (
    <section id="interacao-por-voz" className={styles.band} aria-labelledby={titleId} tabIndex={-1} data-voice-state={state}>
      <div className={`site-shell ${styles.inner}`}>
        <div className={styles.copy}>
          <p className={styles.title}>
            <span id={titleId}>Interação por voz</span>
            <span id={statusId} className={styles.status} data-voice-status>{labels[state]}</span>
          </p>
          <p id={privacyId} className={styles.detail}>
            A ativação usa o microfone. O navegador pode enviar a fala ao serviço de reconhecimento que utiliza.
            O FisioAcessível não armazena o áudio nem o texto reconhecido.
          </p>
        </div>
        <div className={styles.controls}>
          <div className="control-row">
            <button
              ref={toggle}
              className={`button ${active || preferVoice ? "button-primary" : "button-secondary"}`}
              type="button"
              aria-describedby={active ? activeDescription : activationDescription}
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
          <label className={styles.preference}>
            <input
              type="checkbox"
              checked={preferVoice}
              aria-describedby={preferenceId}
              onChange={(event) => setStudyPreferences({ preferVoice: event.currentTarget.checked })}
            />
            Lembrar preferência por interação por voz
          </label>
          <p id={preferenceId} className="sr-only">
            A preferência destaca o botão. Acione Ativar interação por voz quando quiser iniciar o microfone.
          </p>
        </div>
        {(message || feedback) && (
          <div className={styles.feedback}>
            {showMessage && (
              <p id={messageId}>{message}{state === "listening" && " Diga Ajuda para ouvir as opções."}</p>
            )}
            <p data-voice-feedback>{feedback?.message}</p>
          </div>
        )}
        {diagnostics && (
          <details className={styles.diagnostics} data-voice-diagnostics>
            <summary>Diagnóstico de voz</summary>
            <p>Até 40 eventos técnicos mantidos em memória nesta aba até recarregar a página.</p>
            {diagnostics.length > 0 ? (
              <ol className="list-decimal ps-6">
                {diagnostics.map(({ timestamp, type, code, attempt, delayMs }, index) => (
                  <li key={`${timestamp}-${type}-${index}`} data-voice-event={type}>
                    <time dateTime={timestamp}>{timestamp}</time>{" "}<code>{type}</code>
                    {code && <> · <code>{code}</code></>}
                    {attempt !== undefined && <> · tentativa {attempt}</>}
                    {delayMs !== undefined && <> · {delayMs} ms</>}
                  </li>
                ))}
              </ol>
            ) : <p>Nenhum evento registrado.</p>}
          </details>
        )}
        <p role="status" className="sr-only">{liveMessage}</p>
      </div>
    </section>
  );
}
