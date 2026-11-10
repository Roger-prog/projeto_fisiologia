"use client";

import { Pause, Play, RotateCcw, SkipBack, Square, Volume2 } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useVoiceActions } from "@/components/voice/voice-provider";
import { createFilePlayback } from "@/lib/file-playback";
import {
  getNarrationPreference,
  getNarrationSources,
  setNarrationPreference,
  subscribeNarrationPreference,
  useNarrationManifest,
} from "@/lib/narration-manifest";
import { prepareNarrationText } from "@/lib/narration-pronunciation";
import {
  type AudioPlayback,
  createSpeechPlayback,
  getBrowserNarrationVoices,
  getSpeechChunks,
  isSpeechAvailable,
  subscribeSpeechVoices,
} from "@/lib/speech-playback";

type PlaybackState = "idle" | "playing" | "paused" | "waiting" | "stopped" | "finished" | "error";
type NarrationVoice = { id: string; label: string } & (
  { kind: "neural"; sources: readonly string[] } | { kind: "browser"; voiceURI?: string }
);
type PlaybackRequest = { block: number | null; voice: NarrationVoice };

const messages: Record<PlaybackState, string> = {
  idle: "",
  playing: "Leitura em andamento.",
  paused: "Leitura pausada.",
  waiting: "Trecho lido. Diga “continuar leitura” ou “parar leitura”.",
  stopped: "Leitura interrompida.",
  finished: "Leitura concluída.",
  error: "Não foi possível reproduzir a leitura em voz alta. O texto completo está nesta página.",
};

const automaticBrowserVoice: NarrationVoice = { id: "browser", label: "Voz do navegador (automática)", kind: "browser" };
const emptyVoices: SpeechSynthesisVoice[] = [];

function getServerVoices() { return emptyVoices; }
function getServerSupport() { return null; }
function getServerPreference() { return null; }

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
  const [playingVoice, setPlayingVoice] = useState<{ id: string; canPause: boolean } | null>(null);
  const [failedRequest, setFailedRequest] = useState<PlaybackRequest | null>(null);
  const playback = useRef<AudioPlayback | null>(null);
  const lastRequest = useRef<PlaybackRequest | null>(null);
  const nextBlock = useRef<number | null>(null);
  const blocks = useMemo(() => voiceBlocks ?? getSpeechChunks(text.replace(/\s+/gu, " "), 400), [text, voiceBlocks]);
  const neuralVoices = useMemo(() => {
    const voices: NarrationVoice[] = [];
    if (!manifest || !clipIds?.length || clipIds.length !== blocks.length) return voices;
    for (const { id, label } of manifest.voices) {
      const sources = getNarrationSources(manifest, clipIds, id);
      if (sources) voices.push({ id, label: `${label} (neural)`, kind: "neural", sources });
    }
    return voices;
  }, [manifest, clipIds, blocks.length]);
  const choices = useMemo(() => {
    if (!support) return neuralVoices;
    const namedBrowserVoices: NarrationVoice[] = browserVoices.map(({ name, lang, voiceURI }) => ({
      id: `browser:${voiceURI}`,
      label: `${name} (${lang}, navegador)`,
      kind: "browser",
      voiceURI,
    }));
    return [...neuralVoices, automaticBrowserVoice, ...namedBrowserVoices];
  }, [browserVoices, neuralVoices, support]);
  const preferredBrowser = preference === "browser" || preference?.startsWith("browser:");
  const voice = choices.find(({ id }) => id === preference)
    ?? (support && preferredBrowser ? automaticBrowserVoice : choices[0]);
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
  const neuralFailure = state === "error" && failedRequest?.voice.kind === "neural";
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
    setPlayingVoice(null);
    setState(nextState);
  }

  function fail(request: PlaybackRequest) {
    setFailedRequest(request);
    finish("error");
  }

  function beginPlayback(block: number | null = null, narrator = voice) {
    if (!narrator || (block !== null && !blocks[block])) return false;
    const request = { block, voice: narrator };
    const next = block !== null && block + 1 < blocks.length ? block + 1 : null;
    const prompt = next === null ? "" : "\nDiga continuar leitura para ouvir mais ou parar leitura para encerrar.";
    let failed = false;
    const onProgress = (fraction: number) => {
      if (!Number.isFinite(fraction)) return;
      const ratio = Math.min(1, Math.max(0, fraction));
      setProgress(Math.round((block === null ? ratio : (block + ratio) / blocks.length) * 100));
    };
    const callbacks = {
      rate: Number(rate),
      onComplete: () => {
        onProgress(1);
        finish(next === null ? "finished" : "waiting");
      },
      onError: () => {
        failed = true;
        fail(request);
      },
      onInterrupt: () => finish("stopped"),
      onProgress,
    };

    playback.current?.stop();
    lastRequest.current = request;
    nextBlock.current = next;
    setFailedRequest(null);
    onProgress(0);
    try {
      const player = narrator.kind === "neural"
        ? createFilePlayback({ ...callbacks, sources: block === null ? narrator.sources : [narrator.sources[block]] })
        : createSpeechPlayback({
          ...callbacks,
          text: prepareNarrationText(block === null ? text : blocks[block]) + prompt,
          voiceURI: narrator.voiceURI,
        });
      playback.current = player;
      setPlayingVoice({ id: narrator.id, canPause: Boolean(player.pause && player.resume) });
      setState("playing");
      player.start();
      return !failed;
    } catch {
      playback.current?.stop();
      fail(request);
      return false;
    }
  }

  function stopReading(nextState: "idle" | "stopped" = "stopped") {
    playback.current?.stop();
    finish(nextState);
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
      const retry = neuralFailure && support ? failedRequest : null;
      const block = command.kind === "continue-reading"
        ? nextBlock.current ?? retry?.block ?? null
        : command.kind === "repeat-reading" ? lastRequest.current?.block ?? 0 : 0;
      if (block === null) return { message: "Diga ouvir para iniciar a leitura." };
      if (retry) setNarrationPreference(automaticBrowserVoice.id);
      if (!beginPlayback(block, retry ? automaticBrowserVoice : voice)) {
        return { message: "A leitura em voz alta está indisponível. Consulte o texto da página.", speak: false };
      }
      return { message: block ? "Lendo o trecho seguinte." : "Lendo o primeiro trecho.", speak: false };
    }
  });

  function togglePlayback() {
    try {
      if (state === "waiting" && nextBlock.current !== null) {
        beginPlayback(nextBlock.current);
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
      if (lastRequest.current) fail(lastRequest.current);
    }
  }

  function rewind() {
    primaryButton.current?.focus();
    stopReading("idle");
    lastRequest.current = null;
    setProgress(0);
  }

  function useBrowserVoice() {
    if (!failedRequest) return;
    primaryButton.current?.focus();
    setNarrationPreference(automaticBrowserVoice.id);
    beginPlayback(failedRequest.block, automaticBrowserVoice);
  }

  return (
    <section className="study-panel audio-player" aria-labelledby={titleId}>
      <div className="audio-heading">
        <Volume2 size={22} aria-hidden="true" />
        <Heading id={titleId}>{section ? "Leitura da etapa em voz alta" : "Leitura em voz alta"}</Heading>
      </div>
      {!voice ? (
        <p>{support === null
          ? "Os controles de leitura em voz alta dependem dos recursos do navegador."
          : "A leitura em voz alta não está disponível neste navegador. O texto completo está nesta página."}</p>
      ) : (
        <>
          {neuralVoices.length > 0 && <p id={disclosureId}>As gravações com voz neural são geradas por inteligência artificial.</p>}
          <p id={speedHintId}>Escolha a velocidade antes de iniciar a leitura.</p>
          <div className="control-row audio-controls">
            <button
              type="button"
              className="button button-primary"
              ref={primaryButton}
              aria-describedby={voice.kind === "neural" ? disclosureId : undefined}
              aria-disabled={state === "playing" && !playingVoice?.canPause}
              onClick={togglePlayback}
            >
              {state === "playing" && playingVoice?.canPause
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
                onClick={() => beginPlayback(lastRequest.current?.block ?? null, active ? lastRequest.current?.voice : voice)}
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
            {neuralFailure && support && (
              <button type="button" className="button button-secondary" onClick={useBrowserVoice}>
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
                  aria-describedby={neuralVoices.length > 0 ? disclosureId : undefined}
                  value={playingVoice?.id ?? voice.id}
                  onChange={(event) => setNarrationPreference(event.currentTarget.value)}
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
          {/* A live region is reserved for failures to avoid competing with the narration. */}
          <p className="audio-status">{state !== "error" ? messages[state] : ""}</p>
          <p role="status" className="audio-status">
            {neuralFailure ? `O áudio neural está indisponível. ${support ? "Você pode usar a voz do navegador. " : ""}O texto completo está nesta página.`
              : state === "error" ? messages.error : ""}
          </p>
        </>
      )}
    </section>
  );
}
