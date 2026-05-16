export type OnboardingSlide = {
  eyebrow: string;
  title: string;
  body: string;
};

export const slides: OnboardingSlide[] = [
  {
    eyebrow: "What this is",
    title: "A precise instrument for your sex life",
    body:
      "Sehx records session duration, phases, rhythm, communication signals, and detected orgasms. It's a measurement tool — like a fitness tracker, but for intimacy."
  },
  {
    eyebrow: "Setup",
    title: "Plug in, keep the screen on",
    body:
      "Start a session when you begin. The app runs in the foreground and uses your microphone (and optionally the accelerometer) to detect events in real time. Keep the device plugged in for long sessions."
  },
  {
    eyebrow: "Private by design",
    title: "No audio stored. No servers. Ever.",
    body:
      "Audio is processed locally and discarded immediately. Only metadata — durations, counts, timestamps — is saved on this device. You can delete any session at any time, permanently."
  }
];
