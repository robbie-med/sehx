export type ModelOption = {
  id: string;
  label: string;
  url: string;
  tier: "light" | "power";
};

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "ggml-tiny.en-q5_1.bin",
    label: "Whisper tiny.en q5_1 (fast, smaller)",
    url: "/models/ggml-tiny.en-q5_1.bin",
    tier: "light"
  },
  {
    id: "ggml-base.en-q5_1.bin",
    label: "Whisper base.en q5_1 (slower, better)",
    url: "/models/ggml-base.en-q5_1.bin",
    tier: "power"
  }
];
