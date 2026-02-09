export type TranscriptResult = {
  text: string;
  confidence?: number;
};

export type ASRAdapter = {
  init: (modelRef: string) => Promise<void>;
  transcribe: (audio: Float32Array, sampleRate: number) => Promise<TranscriptResult>;
  dispose: () => Promise<void>;
};
