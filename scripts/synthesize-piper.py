import json
from pathlib import Path
import sys
import wave

from piper import PiperVoice, SynthesisConfig


def main():
    model, pace, sentence_pause = sys.argv[1:]
    voice = PiperVoice.load(Path(model))
    settings = SynthesisConfig(length_scale=float(pace))
    sample_rate = voice.config.sample_rate
    silence = bytes(int(sample_rate * float(sentence_pause)) * 2)
    sys.stdin.reconfigure(encoding="utf-8")

    for request in sys.stdin:
        source, output = json.loads(request)
        text = Path(source).read_text(encoding="utf-8")
        with wave.open(output, "wb") as recording:
            recording.setparams((1, 2, sample_rate, 0, "NONE", "not compressed"))
            for paragraph in text.splitlines():
                if not paragraph.strip():
                    continue
                for index, chunk in enumerate(voice.synthesize(paragraph.strip(), settings)):
                    if index > 0:
                        recording.writeframes(silence)
                    recording.writeframes(chunk.audio_int16_bytes)
        print("ok", flush=True)


if __name__ == "__main__":
    main()
