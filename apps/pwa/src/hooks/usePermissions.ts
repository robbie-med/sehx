import { useCallback, useState } from "react";

export type MicPermissionState = "unknown" | "granted" | "denied" | "prompt";

export type PermissionStatus = {
  mic: MicPermissionState;
  error?: string;
};

export function usePermissions() {
  const [status, setStatus] = useState<PermissionStatus>({ mic: "unknown" });

  const requestMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setStatus({ mic: "granted" });
      return "granted" as const;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Microphone permission denied.";
      setStatus({ mic: "denied", error: message });
      return "denied" as const;
    }
  }, []);

  return { status, requestMic };
}
