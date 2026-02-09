import { WhisperWasmService } from "@timur00kh/whisper.wasm";

type WorkerInit = {
  modelUrl: string;
};

type WorkerMessage =
  | { type: "init"; payload: WorkerInit }
  | { type: "transcribe"; payload: { audio: Float32Array; sampleRate: number } };

type WorkerResponse =
  | { type: "ready" }
  | { type: "result"; payload: { text: string; confidence?: number } }
  | { type: "error"; payload: { message: string } };

let initialized = false;
let whisper: WhisperWasmService | null = null;

async function loadModelBytes(url: string) {
  if ("caches" in self) {
    const cache = await caches.open("sm-models-v1");
    const match = await cache.match(url);
    if (match) {
      const buffer = await match.arrayBuffer();
      return new Uint8Array(buffer);
    }
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load model at ${url}`);
  }
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

function resampleTo16k(input: Float32Array, sampleRate: number) {
  if (sampleRate === 16000) return input;
  const ratio = sampleRate / 16000;
  const newLength = Math.floor(input.length / ratio);
  const output = new Float32Array(newLength);
  for (let i = 0; i < newLength; i += 1) {
    const idx = i * ratio;
    const left = Math.floor(idx);
    const right = Math.min(left + 1, input.length - 1);
    const frac = idx - left;
    output[i] = input[left] * (1 - frac) + input[right] * frac;
  }
  return output;
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  try {
    if (event.data.type === "init") {
      if (!whisper) {
        whisper = new WhisperWasmService();
        const supported = await whisper.checkWasmSupport();
        if (!supported) {
          throw new Error("WebAssembly not supported.");
        }
      }
      const modelBytes = await loadModelBytes(event.data.payload.modelUrl);
      await whisper.initModel(modelBytes);
      initialized = true;
      const response: WorkerResponse = { type: "ready" };
      self.postMessage(response);
      return;
    }
    if (event.data.type === "transcribe") {
      if (!initialized || !whisper) {
        throw new Error("Whisper worker not initialized.");
      }
      const audio16k = resampleTo16k(
        event.data.payload.audio,
        event.data.payload.sampleRate
      );
      const threads = self.crossOriginIsolated ? 2 : 1;
      const result = await whisper.transcribe(audio16k, undefined, {
        language: "en",
        translate: false,
        threads
      });
      const text = (result.segments ?? [])
        .map((segment) => segment.text)
        .join("")
        .trim();
      const response: WorkerResponse = {
        type: "result",
        payload: { text, confidence: 0 }
      };
      self.postMessage(response);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Whisper worker error.";
    const response: WorkerResponse = { type: "error", payload: { message } };
    self.postMessage(response);
  }
};
