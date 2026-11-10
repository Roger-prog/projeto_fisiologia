import { type HeartRate, secondsPerBeat } from "@/data/simulations";

export function createHeartbeatAudio(rate: HeartRate) {
  const context = new AudioContext();
  let source: AudioBufferSourceNode | undefined;
  let stopped = false;

  return {
    async start() {
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          context.resume(),
          new Promise<never>((_, reject) => {
            timeout = setTimeout(() => reject(new Error("O navegador não liberou a reprodução.")), 3000);
          }),
        ]);
      } finally {
        clearTimeout(timeout);
      }
      if (stopped) return;
      if (context.state !== "running") throw new Error("O navegador não liberou a reprodução.");

      // One short synthetic pulse in each loop. The loop period represents one beat.
      const sampleCount = Math.round(context.sampleRate * secondsPerBeat(rate));
      const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
      const samples = buffer.getChannelData(0);
      const pulseSamples = Math.min(sampleCount, Math.round(context.sampleRate * 0.13));
      for (let index = 0; index < pulseSamples; index++) {
        const seconds = index / context.sampleRate;
        const envelope = Math.sin((Math.PI * index) / pulseSamples) ** 2;
        samples[index] = envelope * (0.19 * Math.sin(2 * Math.PI * 90 * seconds) + 0.08 * Math.sin(2 * Math.PI * 180 * seconds));
      }

      source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(context.destination);
      source.start();
    },
    stop() {
      if (stopped) return;
      stopped = true;
      source?.disconnect();
      void context.close().catch(() => undefined);
    },
  };
}
