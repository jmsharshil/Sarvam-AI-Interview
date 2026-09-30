import { useMemo } from "react";
import { useInterviewStore } from "@/lib/interviews/store";
import {
  effectiveSarvamCredentials,
  isSarvamConfigured,
} from "@/lib/sarvam/env";

/** True when Connect dialog OR .env has a full agent config. */
export function useSarvamReady() {
  const sarvam = useInterviewStore((s) => s.sarvam);
  return useMemo(() => {
    const effective = effectiveSarvamCredentials(sarvam);
    return isSarvamConfigured(effective);
  }, [sarvam]);
}

export function useEffectiveSarvam() {
  const sarvam = useInterviewStore((s) => s.sarvam);
  return useMemo(() => effectiveSarvamCredentials(sarvam), [sarvam]);
}
