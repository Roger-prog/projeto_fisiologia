"use client";

import { Pause, Play, RotateCcw, SkipBack, Square, Volume2 } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useVoiceActions } from "@/components/voice/voice-provider";
import { fixedNarration, narratedMessage } from "@/lib/narration-messages";
import {
  getNarrationPreference,
  setNarrationPreference,
  subscribeNarrationPreference,
  useNarrationManifest,
} from "@/lib/narration-manifest";
import {
  createNarrationPlayback,
  isBrowserNarrationVoice,
  type NarrationFailure,
  resolveNarrationVoice,
  temporaryBrowserNotice,
} from "@/lib/narration-playback";
import {
  type AudioPlayback,
  getBrowserNarrationVoices,
  getSpeechChunks,
  isSpeechAvailable,
  subscribeSpeechVoices,
} from "@/lib/speech-playback";

type PlaybackState = "idle" | "playing" | "paused" | "waiting" | "stopped" | "finished" | "error";
type PlaybackRequest = { block: number | null; voiceId: string };
type FailedRequest = { request: PlaybackRequest; failure: NarrationFailure };

const messages: Record<PlaybackState, string> = {
  idle: "",
  playing: "Leitura em andamento.",
  paused: "Leitura pausada.",
  waiting: "Trecho lido. Diga “continuar leitura” ou “parar leitura”.",
  stopped: "Leitura interrompida.",
  finished: "Leitura concluída.",
  error: "Não foi possível reproduzir a leitura em voz alta. O texto completo está nesta página.",
};

const automaticBrowserVoice = { id: "browser", label: "Voz do navegador (automática)" };
const emptyVoices: SpeechSynthesisVoice[] = [];

function getServerVoices() { return emptyVoices; }
function getServerSupport() { return null; }
function getServerPreference() { return null; }

function describeFailure({ code }: NarrationFailure) {
  switch (code) {
    case "missing-clips":
    case "missing-file": return "A voz selecionada não tem todas as gravações para esta leitura.";
    case "network": return "A gravação não pôde ser acessada pela rede.";
    case "blocked": return "O navegador bloqueou a reprodução. Acione Tentar voz neural novamente.";
    case "media-error": return "O navegador não conseguiu reproduzir a gravação.";
    case "unavailable": return "A voz selecionada não está disponível neste dispositivo.";
  }
}

export function AudioPlayer({
  text,
  scope = "lesson",
  headingLevel = 2,
  clipIds,
  voiceBlocks,
}: {
  text: string;
  scope?: "lesson" | "section";
  headingLevel?: 2 | 3;
  clipIds?: readonly string[];
  voiceBlocks?: readonly string[];
}) {
  const manifest = useNarrationManifest();
  const support = useSyncExternalStore(subscribeSpeechVoices, isSpeechAvailable, getServerSupport);
  const browserVoices = useSyncExternalStore(subscribeSpeechVoices, getBrowserNarrationVoices, getServerVoices);
  const preference = useSyncExternalStore(subscribeNarrationPreference, getNarrationPreference, getServerPreference);
  const [state, setState] = useState<PlaybackState>("idle");
  const [rate, setRate] = useState("1");
  const [progress, setProgress] = useState(0);
  const [canPause, setCanPause] = useState(false);
  const [temporary, setTemporary] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [failedRequest, setFailedRequest] = useState<FailedRequest | null>(null);
  const playback = useRef<AudioPlayback | null>(null);
  const lastRequest = useRef<PlaybackRequest | null>(null);
  const nextBlock = useRef<number | null>(null);
  const blocks = useMemo(() => voiceBlocks ?? getSpeechChunks(text.replace(/\s+/gu, " "), 400), [text, voiceBlocks]);
  const selectedVoice = resolveNarrationVoice(manifest, preference);
  const selectedNeural = selectedVoice !== null && !isBrowserNarrationVoice(selectedVoice);
  const choices = useMemo(() => {
    const voices = (manifest?.voices ?? []).map(({ id, label }) => ({ id, label: `${label} (neural)` }));
    if (support) voices.push(automaticBrowserVoice, ...browserVoices.map(({ name, lang, voiceURI }) => ({
      id: `browser:${voiceURI}`,
      label: `${name} (${lang}, navegador)`,
    })));
    if (selectedVoice && !voices.some(({ id }) => id === selectedVoice)) {
      voices.unshift({ id: selectedVoice, label: `Voz ${selectedNeural ? "neural " : ""}selecionada (indisponível)` });
    }
    return voices;
  }, [browserVoices, manifest, selectedNeural, selectedVoice, support]);
  const hasControls = selectedVoice !== null && (selectedNeural || support || choices.length > 1);
  const hasNeuralVoices = selectedNeural || Boolean(manifest?.voices.length);
  const primaryButton = useRef<HTMLButtonElement>(null);
  const stopButton = useRef<HTMLButtonElement>(null);
  const repeatButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const speedId = useId();
  const speedHintId = useId();
  const voiceId = useId();
  const disclosureId = useId();
  const active = state === "playing" || state === "paused";
  const section = scope === "section";
  const replay = section && (state === "finished" || state === "stopped");
  const neuralFailure = state === "error" && failedRequest !== null && !isBrowserNarrationVoice(failedRequest.request.voiceId);
  const failureMessage = neuralFailure ? [
    "O áudio neural está indisponível.",
    describeFailure(failedRequest.failure),
    support ? "Acione Usar voz do navegador ou diga esse comando para ouvir esta leitura." : "",
    "O texto completo está nesta página.",
  ].filter(Boolean).join(" ") : messages.error;
  const Heading = headingLevel === 2 ? "h2" : "h3";

  useEffect(() => () => {
    playback.current?.stop();
    playback.current = null;
  }, []);

  function finish(nextState: PlaybackState) {
    if (document.activeElement === stopButton.current || document.activeElement === repeatButton.current) {
      primaryButton.current?.focus();
    }
    playback.current = null;
    if (nextState !== "waiting") nextBlock.current = null;
    if (nextState !== "waiting") setTemporary(false);
    setCanPause(false);
    setRecovering(false);
    setState(nextState);
  }

  function fail(request: PlaybackRequest, failure: NarrationFailure) {
    setFailedRequest({ request, failure });
    finish("error");
  }

  function beginPlayback({ block = null, voiceId = selectedVoice, temporary = false, announceTemporary = false }: {
    block?: number | null;
    voiceId?: string | null;
    temporary?: boolean;
    announceTemporary?: boolean;
  } = {}) {
    if (!voiceId || (block !== null && !blocks[block])) return false;
    const request = { block, voiceId };
    const next = block !== null && block + 1 < blocks.length ? block + 1 : null;
    const prompt = next === null ? "" : "\nDiga continuar leitura para ouvir mais ou parar leitura para encerrar.";
    const introduction = announceTemporary ? `${temporaryBrowserNotice}\n` : "";
    const narrationText = introduction + (block === null ? text : blocks[block]) + prompt;
    const requestedClips = clipIds?.length === blocks.length ? (block === null ? clipIds : [clipIds[block]]) : [];
    let failed = false;
    const onProgress = (fraction: number) => {
      if (!Number.isFinite(fraction)) return;
      const ratio = Math.min(1, Math.max(0, fraction));
      setProgress(Math.round((block === null ? ratio : (block + ratio) / blocks.length) * 100));
      if (ratio > 0) setRecovering(false);
    };

    playback.current?.stop();
    lastRequest.current = request;
    nextBlock.current = next;
    setFailedRequest(null);
    setRecovering(false);
    setTemporary(temporary);
    onProgress(0);
    try {
      const player = createNarrationPlayback({
        manifest,
        voiceId,
        clipIds: requestedClips,
        text: narrationText,
        rate: Number(rate),
        onComplete: () => {
          onProgress(1);
          finish(next === null ? "finished" : "waiting");
        },
        onError: (failure) => {
          failed = true;
          fail(request, failure);
        },
        onInterrupt: () => finish("stopped"),
        onProgress,
        onRetry: () => setRecovering(true),
      });
      playback.current = player;
      setCanPause(Boolean(player.pause && player.resume));
      setState("playing");
      player.start();
      return !failed;
    } catch {
      playback.current?.stop();
      fail(request, { code: "media-error" });
      return false;
    }
  }

  function stopReading(nextState: "idle" | "stopped" = "stopped") {
    playback.current?.stop();
    setFailedRequest(null);
    finish(nextState);
  }

  function continuePlayback(block: number) {
    return beginPlayback(temporary ? { block, voiceId: automaticBrowserVoice.id, temporary: true } : { block });
  }

  function useBrowserVoice() {
    if (!neuralFailure || !support) return false;
    return beginPlayback({
      block: failedRequest.request.block,
      voiceId: automaticBrowserVoice.id,
      temporary: true,
      announceTemporary: true,
    });
  }

  useVoiceActions((command) => {
    if (command.kind === "session-ended") {
      if (nextBlock.current !== null || playback.current) stopReading();
      return;
    }
    if (command.kind === "stop-reading") {
      if (nextBlock.current === null && !playback.current) return;
      stopReading();
      return narratedMessage(fixedNarration("leitura-interrompida"));
    }
    if (scope === "lesson" && window.location.hash === "#exercicios") return;
    if (command.kind === "use-browser-voice" && neuralFailure && support) {
      return {
        message: useBrowserVoice() ? temporaryBrowserNotice : messages.error,
        speak: false,
      };
    }
    if (command.kind === "start-reading" || command.kind === "repeat-reading" || command.kind === "continue-reading") {
      const block = command.kind === "continue-reading"
        ? nextBlock.current ?? failedRequest?.request.block ?? null
        : command.kind === "repeat-reading" ? lastRequest.current?.block ?? 0 : 0;
      if (block === null) return narratedMessage(fixedNarration("iniciar-leitura"));
      const started = command.kind === "start-reading" ? beginPlayback({ block }) : continuePlayback(block);
      if (!started) {
        return { message: "A leitura em voz alta está indisponível. Consulte o texto da página.", speak: false };
      }
      return { message: block ? "Lendo o trecho seguinte." : "Lendo o primeiro trecho.", speak: false };
    }
  });

  function togglePlayback() {
    try {
      if (state === "waiting" && nextBlock.current !== null) {
        continuePlayback(nextBlock.current);
      } else if (state === "playing") {
        if (!playback.current?.pause) return;
        setState("paused");
        playback.current.pause();
      } else if (state === "paused") {
        setState("playing");
        playback.current?.resume?.();
      } else {
        beginPlayback();
      }
    } catch {
      playback.current?.stop();
      if (lastRequest.current) fail(lastRequest.current, { code: "media-error" });
    }
  }

  function rewind() {
    primaryButton.current?.focus();
    stopReading("idle");
    lastRequest.current = null;
    setProgress(0);
  }

  return (
    <section className="study-panel audio-player" aria-labelledby={titleId}>
      <div className="audio-heading">
        <Volume2 size={22} aria-hidden="true" />
        <Heading id={titleId}>{section ? "Leitura da etapa em voz alta" : "Leitura em voz alta"}</Heading>
      </div>
      {!hasControls ? (
        <p>{selectedVoice === null || support === null
          ? "Os controles de leitura em voz alta dependem dos recursos do navegador."
          : "A leitura em voz alta não está disponível neste navegador. O texto completo está nesta página."}</p>
      ) : (
        <>
          {hasNeuralVoices && <p id={disclosureId}>As gravações com voz neural são geradas por inteligência artificial.</p>}
          <p id={speedHintId}>Escolha a velocidade antes de iniciar a leitura.</p>
          <div className="control-row audio-controls">
            <button
              type="button"
              className="button button-primary"
              ref={primaryButton}
              aria-describedby={selectedNeural ? disclosureId : undefined}
              aria-disabled={state === "playing" && !canPause}
              onClick={togglePlayback}
            >
              {state === "playing" && canPause
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
              onClick={() => stopReading()}
            >
              <Square size={16} aria-hidden="true" />
              Interromper
            </button>
            {section && (active || state === "waiting") && (
              <button
                type="button"
                className="button button-secondary"
                ref={repeatButton}
                onClick={() => beginPlayback({
                  block: lastRequest.current?.block ?? null,
                  voiceId: active ? lastRequest.current?.voiceId : temporary ? automaticBrowserVoice.id : selectedVoice,
                  temporary,
                })}
              >
                <RotateCcw size={18} aria-hidden="true" />
                Repetir explicação
              </button>
            )}
            {state !== "idle" && (
              <button type="button" className="button button-secondary" onClick={rewind}>
                <SkipBack size={18} aria-hidden="true" />
                Voltar ao começo
              </button>
            )}
            {neuralFailure && selectedNeural && (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  primaryButton.current?.focus();
                  beginPlayback({ block: failedRequest.request.block });
                }}
              >
                <RotateCcw size={18} aria-hidden="true" />
                Tentar voz neural novamente
              </button>
            )}
            {neuralFailure && support && (
              <button type="button" className="button button-secondary" onClick={() => {
                primaryButton.current?.focus();
                useBrowserVoice();
              }}>
                <Volume2 size={18} aria-hidden="true" />
                Usar voz do navegador
              </button>
            )}
            {choices.length > 1 && (
              <div className="audio-speed min-w-0 max-w-full">
                <label className="field-label" htmlFor={voiceId}>Voz da narração</label>
                <select
                  id={voiceId}
                  className="study-select min-w-0 max-w-full"
                  aria-describedby={hasNeuralVoices ? disclosureId : undefined}
                  value={selectedVoice ?? undefined}
                  onChange={(event) => {
                    setTemporary(false);
                    setNarrationPreference(event.currentTarget.value);
                  }}
                  disabled={active}
                >
                  {choices.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
                </select>
              </div>
            )}
            <div className="audio-speed">
              <label className="field-label" htmlFor={speedId}>Velocidade da leitura</label>
              <select
                id={speedId}
                className="study-select"
                aria-describedby={speedHintId}
                value={rate}
                onChange={(event) => setRate(event.currentTarget.value)}
                disabled={active}
              >
                <option value="0.75">0,75×</option>
                <option value="1">1×</option>
                <option value="1.25">1,25×</option>
                <option value="1.5">1,5×</option>
              </select>
            </div>
          </div>
          {state !== "idle" && (
            <div className="control-row">
              <progress
                className="max-w-full accent-[var(--accent)]"
                max={100}
                value={progress}
                aria-label="Andamento da leitura"
                aria-valuetext={`${progress}% concluído`}
              />
              <span aria-hidden="true">{progress}%</span>
            </div>
          )}
          {/* Keep routine progress out of the live region to avoid competing with the narration. */}
          <p className="audio-status">{state !== "error" && (state !== "playing" || !recovering) ? messages[state] : ""}</p>
          {temporary && <p className="audio-status">{temporaryBrowserNotice}</p>}
          <p role="status" className="audio-status">
            {state === "error" ? failureMessage : recovering ? "Tentando recuperar o áudio neural." : ""}
          </p>
        </>
      )}
    </section>
  );
}
