import type { ASRAdapter, TranscriptResult } from "../types";

export class WhisperAdapter implements ASRAdapter {
  private modelReady = false;
  private worker?: Worker;
  private pending?: (result: TranscriptResult) => void;
  private pendingError?: (error: Error) => void;

  async init(modelRef: string) {
    if (this.worker) return;
    // Worker module is bundled by the app; keep path relative for Vite.
    this.worker = new Worker(new URL("./whisper.worker.ts", import.meta.url), {
      type: "module"
    });
    await new Promise<void>((resolve, reject) => {
      if (!this.worker) return reject(new Error("Worker missing."));
      this.worker.onmessage = (event) => {
        if (event.data?.type === "ready") {
          this.modelReady = true;
          resolve();
        }
        if (event.data?.type === "error") {
          const error = new Error(
            event.data.payload?.message ?? "Whisper init failed."
          );
          this.pendingError?.(error);
          this.pending = undefined;
          this.pendingError = undefined;
          reject(error);
        }
        if (event.data?.type === "result") {
          this.pending?.(event.data.payload);
          this.pending = undefined;
          this.pendingError = undefined;
        }
      };
      this.worker.onerror = () => reject(new Error("Whisper worker crashed."));
      this.worker.postMessage({ type: "init", payload: { modelUrl: modelRef } });
    });
  }

  async transcribe(_audio: Float32Array, _sampleRate: number): Promise<TranscriptResult> {
    if (!this.modelReady) {
      throw new Error("Whisper model not initialized.");
    }
    if (!this.worker) {
      throw new Error("Whisper worker missing.");
    }
    return new Promise<TranscriptResult>((resolve, reject) => {
      this.pending = resolve;
      this.pendingError = reject;
      this.worker?.postMessage({
        type: "transcribe",
        payload: { audio: _audio, sampleRate: _sampleRate }
      });
    });
  }

  async dispose() {
    this.modelReady = false;
    this.worker?.terminate();
    this.worker = undefined;
  }
}
