"use client";

import { useSyncExternalStore } from "react";

type NarrationVoice = { id: string; label: string; language: string; kind: "neural" };
type NarrationManifest = {
  version: 1;
  voices: NarrationVoice[];
  clips: Record<string, Record<string, { src: string }>>;
};

const manifestUrl = "/audio/manifest.json";
const manifestListeners = new Set<() => void>();
const preferenceListeners = new Set<() => void>();
let manifest: NarrationManifest | null = null;
let requested = false;
let preferredVoice: string | null = null;

function nullSnapshot() {
  return null;
}

function getManifest() {
  return manifest;
}

function subscribeManifest(listener: () => void) {
  manifestListeners.add(listener);
  if (!requested) {
    requested = true;
    void fetch(manifestUrl, { credentials: "same-origin" }).then(async (response) => {
      if (!response.ok) return;
      const data = await response.json() as Partial<NarrationManifest> | null;
      if (data?.version !== 1 || !Array.isArray(data.voices) || !data.clips || typeof data.clips !== "object") return;
      const voices = data.voices.filter((voice) =>
        voice?.kind === "neural" && typeof voice.id === "string" && typeof voice.label === "string" &&
        voice.language === "pt-BR",
      );
      manifest = { version: 1, voices, clips: data.clips };
      manifestListeners.forEach((notify) => notify());
    }).catch(() => {
      // Static exports without recordings still have access to the browser voices.
    });
  }
  return () => { manifestListeners.delete(listener); };
}

export function useNarrationManifest() {
  return useSyncExternalStore(subscribeManifest, getManifest, nullSnapshot);
}

export function getNarrationSources(catalog: NarrationManifest | null, clipIds: readonly string[], voiceId: string) {
  if (!catalog || !clipIds.length) return null;
  const sources: string[] = [];
  for (const id of clipIds) {
    const source = catalog.clips[id]?.[voiceId]?.src;
    if (typeof source !== "string" || !/^\/audio\/(?:[\w-]+\/)*[\w.-]+\.mp3$/u.test(source)) return null;
    sources.push(source);
  }
  return sources;
}

export function getNarrationPreference() {
  return preferredVoice;
}

export function setNarrationPreference(id: string) {
  if (id === preferredVoice) return;
  preferredVoice = id;
  preferenceListeners.forEach((notify) => notify());
}

export function subscribeNarrationPreference(listener: () => void) {
  preferenceListeners.add(listener);
  return () => { preferenceListeners.delete(listener); };
}
