export type OnboardingSlide = {
  eyebrow: string;
  title: string;
  body: string;
};

export const slides: OnboardingSlide[] = [
  {
    eyebrow: "Privacy-first",
    title: "On-device, offline, and ephemeral",
    body:
      "Your session data stays on this device. Audio and transcripts are never stored."
  },
  {
    eyebrow: "Foreground only",
    title: "Screen on, app open",
    body:
      "The session runs only while the app is in the foreground. If the OS suspends it, the session ends."
  },
  {
    eyebrow: "No interpretation",
    title: "Numbers and timestamps only",
    body:
      "This is an instrument: timelines, counts, and durations. No advice, no judgment."
  }
];
