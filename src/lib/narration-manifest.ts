"use client";

import { useSyncExternalStore } from "react";

type NarrationVoice = { id: string; label: string; language: string; kind: "neural" };
export type NarrationManifest = {
  version: 1;
  voices: NarrationVoice[];
  clips: Record<string, Record<string, { src: string }>>;
};

const manifestUrl = "/audio/manifest.json";
const voicePreferenceKey = "fisioacessivel:narration-voice";
const emptyManifest: NarrationManifest = { version: 1, voices: [], clips: {} };
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

async function loadManifest(retried = false): Promise<NarrationManifest> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(manifestUrl, { credentials: "same-origin", signal: controller.signal });
    if (response.status === 408 || response.status === 429 || response.status >= 500) throw new Error();
    if (!response.ok) return emptyManifest;
    const data = await response.json() as Partial<NarrationManifest> | null;
    if (data?.version !== 1 || !Array.isArray(data.voices) || !data.clips || typeof data.clips !== "object") return emptyManifest;
    const voices = data.voices.filter((voice) =>
      voice?.kind === "neural" && typeof voice.id === "string" && typeof voice.label === "string" &&
      voice.language === "pt-BR",
    );
    return { version: 1, voices, clips: data.clips };
  } catch {
    if (retried) return emptyManifest;
  } finally {
    clearTimeout(timeout);
  }
  await new Promise((resolve) => setTimeout(resolve, 350));
  return loadManifest(true);
}

function subscribeManifest(listener: () => void) {
  manifestListeners.add(listener);
  if (!requested) {
    requested = true;
    void loadManifest().then((catalog) => {
      manifest = catalog;
      if (catalog.voices[0] && getNarrationPreference() === null) setNarrationPreference(catalog.voices[0].id);
      manifestListeners.forEach((notify) => notify());
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
  if (preferredVoice === null && typeof window !== "undefined") {
    try {
      preferredVoice = window.sessionStorage.getItem(voicePreferenceKey);
    } catch {
      // The choice can still be kept in memory for this page.
    }
  }
  return preferredVoice;
}

export function setNarrationPreference(id: string) {
  if (id === preferredVoice) return;
  preferredVoice = id;
  try {
    window.sessionStorage.setItem(voicePreferenceKey, id);
  } catch {
    // Storage may be blocked by the browser.
  }
  preferenceListeners.forEach((notify) => notify());
}

export function subscribeNarrationPreference(listener: () => void) {
  preferenceListeners.add(listener);
  return () => { preferenceListeners.delete(listener); };
}
