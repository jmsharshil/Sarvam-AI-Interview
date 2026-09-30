import { useEffect } from "react";
import { useInterviewStore } from "@/lib/interviews/store";
import {
  envSarvamCredentials,
  isSarvamConfigured,
  mergeCredentials,
} from "@/lib/sarvam/env";

/**
 * On boot: fill store from VITE_ env, then from /api/sarvam-config if still empty.
 * Does not overwrite credentials the user already saved in the Connect dialog
 * unless those fields are blank.
 */
export function useSarvamEnvBootstrap() {
  useEffect(() => {
    const fromEnv = envSarvamCredentials();
    const current = useInterviewStore.getState().sarvam;
    const merged = mergeCredentials(current, fromEnv);
    if (
      merged.apiKey !== current.apiKey ||
      merged.orgId !== current.orgId ||
      merged.workspaceId !== current.workspaceId ||
      merged.appId !== current.appId
    ) {
      useInterviewStore.getState().setSarvam(merged);
    }

    if (isSarvamConfigured(merged)) return;

    void fetch("/api/sarvam-config")
      .then((r) => r.json())
      .then((data: { configured?: boolean; credentials?: typeof fromEnv | null }) => {
        if (!data?.configured || !data.credentials) return;
        const now = useInterviewStore.getState().sarvam;
        useInterviewStore
          .getState()
          .setSarvam(mergeCredentials(now, data.credentials));
      })
      .catch(() => {
        /* offline / no server config */
      });
  }, []);
}
