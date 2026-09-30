import type { SarvamCredentials } from "@/lib/interviews/types";

/** Defaults from Vite env (VITE_SARVAM_*). Empty strings if unset. */
export function envSarvamCredentials(): SarvamCredentials {
  return {
    apiKey: (import.meta.env.VITE_SARVAM_API_KEY as string | undefined)?.trim() || "",
    orgId: (import.meta.env.VITE_SARVAM_ORG_ID as string | undefined)?.trim() || "",
    workspaceId:
      (import.meta.env.VITE_SARVAM_WORKSPACE_ID as string | undefined)?.trim() || "",
    appId: (import.meta.env.VITE_SARVAM_APP_ID as string | undefined)?.trim() || "",
  };
}

export function isSarvamConfigured(c: SarvamCredentials): boolean {
  return Boolean(
    c.apiKey?.trim() &&
      c.orgId?.trim() &&
      c.workspaceId?.trim() &&
      c.appId?.trim(),
  );
}

/** Prefer non-empty fields from `preferred`, fall back to `fallback`. */
export function mergeCredentials(
  preferred: SarvamCredentials,
  fallback: SarvamCredentials,
): SarvamCredentials {
  return {
    apiKey: preferred.apiKey?.trim() || fallback.apiKey || "",
    orgId: preferred.orgId?.trim() || fallback.orgId || "",
    workspaceId: preferred.workspaceId?.trim() || fallback.workspaceId || "",
    appId: preferred.appId?.trim() || fallback.appId || "",
  };
}

/** Effective credentials: browser store + env. */
export function effectiveSarvamCredentials(
  stored: SarvamCredentials,
): SarvamCredentials {
  return mergeCredentials(stored, envSarvamCredentials());
}
