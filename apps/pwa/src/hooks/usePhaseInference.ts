import { useEffect, useRef } from "react";

type SessionStatus = "idle" | "active" | "paused" | "ended";

export function usePhaseInference(
  status: SessionStatus,
  rhythmActive: boolean,
  emitEvent: (type: "PHASE_START_FOREPLAY" | "PHASE_END_FOREPLAY" | "PHASE_START_INTERCOURSE" | "PHASE_START_COOLDOWN") => void
) {
  const phaseRef = useRef<"none" | "foreplay" | "intercourse" | "cooldown">("none");
  const lastStatus = useRef<SessionStatus>("idle");

  useEffect(() => {
    if (status === "active" && lastStatus.current !== "active") {
      if (phaseRef.current === "none") {
        phaseRef.current = "foreplay";
        emitEvent("PHASE_START_FOREPLAY");
      }
    }

    if (status === "ended" && lastStatus.current !== "ended") {
      if (phaseRef.current !== "cooldown") {
        phaseRef.current = "cooldown";
        emitEvent("PHASE_START_COOLDOWN");
      }
    }

    lastStatus.current = status;
  }, [status, emitEvent]);

  useEffect(() => {
    if (status !== "active") return;
    if (rhythmActive && phaseRef.current === "foreplay") {
      phaseRef.current = "intercourse";
      emitEvent("PHASE_END_FOREPLAY");
      emitEvent("PHASE_START_INTERCOURSE");
    }
    if (!rhythmActive && phaseRef.current === "intercourse") {
      phaseRef.current = "cooldown";
      emitEvent("PHASE_START_COOLDOWN");
    }
  }, [rhythmActive, status, emitEvent]);
}
