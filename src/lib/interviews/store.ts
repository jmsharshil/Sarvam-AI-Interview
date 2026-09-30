import { create } from "zustand";
import { persist } from "zustand/middleware";
import { envSarvamCredentials, isSarvamConfigured, mergeCredentials } from "@/lib/sarvam/env";
import {
  DEFAULT_CONFIG,
  normalizeConfig,
  normalizeCredentials,
  type Evaluation,
  type InterviewConfig,
  type InterviewSession,
  type RoomStatus,
  type SarvamCredentials,
  type Turn,
} from "./types";

function uid() {
  return crypto.randomUUID();
}

function normalizeSession(raw: unknown): InterviewSession | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!r.id) return null;
  return {
    id: String(r.id),
    createdAt: Number(r.createdAt) || Date.now(),
    startedAt: r.startedAt == null ? null : Number(r.startedAt),
    endedAt: r.endedAt == null ? null : Number(r.endedAt),
    config: normalizeConfig(r.config),
    turns: Array.isArray(r.turns) ? (r.turns as Turn[]) : [],
    status: (r.status as RoomStatus) || "ended",
    error: r.error == null ? null : String(r.error),
    report: (r.report as Evaluation) || null,
    callSummary: r.callSummary == null ? null : String(r.callSummary),
  };
}

type Store = {
  sarvam: SarvamCredentials;
  draft: InterviewConfig;
  sessions: InterviewSession[];
  setDraft: (patch: Partial<InterviewConfig>) => void;
  setSarvam: (creds: SarvamCredentials) => void;
  clearSarvam: () => void;
  createSession: () => InterviewSession;
  getSession: (id: string) => InterviewSession | undefined;
  patchSession: (id: string, patch: Partial<InterviewSession>) => void;
  addTurn: (id: string, turn: Omit<Turn, "id" | "at"> & { at?: number }) => void;
  setStatus: (id: string, status: RoomStatus, error?: string | null) => void;
  setReport: (id: string, report: Evaluation) => void;
};

const EMPTY: SarvamCredentials = {
  apiKey: "",
  orgId: "",
  workspaceId: "",
  appId: "",
};

export const useInterviewStore = create<Store>()(
  persist(
    (set, get) => ({
      sarvam: envSarvamCredentials(),
      draft: { ...DEFAULT_CONFIG },
      sessions: [],
      setDraft: (patch) =>
        set((s) => ({ draft: normalizeConfig({ ...s.draft, ...patch }) })),
      setSarvam: (creds) => set({ sarvam: normalizeCredentials(creds) }),
      clearSarvam: () => set({ sarvam: EMPTY }),
      createSession: () => {
        const session: InterviewSession = {
          id: uid(),
          createdAt: Date.now(),
          startedAt: Date.now(),
          endedAt: null,
          config: normalizeConfig(get().draft),
          turns: [],
          status: "connecting",
          error: null,
          report: null,
          callSummary: null,
        };
        set((s) => ({ sessions: [session, ...s.sessions].slice(0, 40) }));
        return session;
      },
      getSession: (id) => get().sessions.find((s) => s.id === id),
      patchSession: (id, patch) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === id ? { ...sess, ...patch } : sess,
          ),
        })),
      addTurn: (id, turn) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === id
              ? {
                  ...sess,
                  turns: [
                    ...sess.turns,
                    {
                      id: uid(),
                      at: turn.at ?? Date.now(),
                      role: turn.role,
                      content: turn.content,
                    },
                  ],
                }
              : sess,
          ),
        })),
      setStatus: (id, status, error = null) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === id
              ? {
                  ...sess,
                  status,
                  error,
                  endedAt:
                    status === "ended" || status === "error"
                      ? Date.now()
                      : sess.endedAt,
                }
              : sess,
          ),
        })),
      setReport: (id, report) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === id ? { ...sess, report, status: "ended" } : sess,
          ),
        })),
    }),
    {
      name: "viva-interview",
      version: 2,
      migrate: (persisted) => {
        const p = (persisted || {}) as Record<string, unknown>;
        const sessions = Array.isArray(p.sessions)
          ? (p.sessions as unknown[])
              .map(normalizeSession)
              .filter((s): s is InterviewSession => Boolean(s))
          : [];
        return {
          sarvam: normalizeCredentials(p.sarvam),
          draft: normalizeConfig(p.draft),
          sessions,
        };
      },
      merge: (persisted, current) => {
        const p = (persisted || {}) as Partial<Store>;
        return {
          ...current,
          ...p,
          sarvam: mergeCredentials(
            normalizeCredentials(p.sarvam ?? current.sarvam),
            envSarvamCredentials(),
          ),
          draft: normalizeConfig(p.draft ?? current.draft),
          sessions: Array.isArray(p.sessions)
            ? p.sessions
                .map(normalizeSession)
                .filter((s): s is InterviewSession => Boolean(s))
            : current.sessions,
        };
      },
      partialize: (s) => ({
        sarvam: s.sarvam,
        draft: s.draft,
        sessions: s.sessions,
      }),
    },
  ),
);
