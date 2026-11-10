from pathlib import Path
import sys
import wave

from kokoro_onnx import Kokoro
import numpy as np


def main():
    model, voices, name, rate, source, output = sys.argv[1:]
    text = Path(source).read_text(encoding="utf-8")
    speech, sample_rate = Kokoro(model, voices).create(text, voice=name, lang="pt-br", speed=float(rate))
    pcm = np.rint(np.clip(speech, -1, 1) * 32767).astype("<i2")
    with wave.open(output, "wb") as recording:
        recording.setparams((1, 2, sample_rate, 0, "NONE", "not compressed"))
        recording.writeframes(pcm.tobytes())


if __name__ == "__main__":
    main()
