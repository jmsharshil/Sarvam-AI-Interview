import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { evaluateInterview } from "@/lib/interviews/api";
import { useHydrated } from "@/hooks/use-hydrated";
import { useInterviewStore } from "@/lib/interviews/store";
import type { RoomStatus } from "@/lib/interviews/types";
import { connectSarvamAgent, type SarvamHandle } from "@/lib/sarvam/session";

function latestSession(id: string) {
  return useInterviewStore.getState().sessions.find((item) => item.id === id);
}

export function useVoiceInterview(sessionId: string) {
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const session = useInterviewStore((s) =>
    s.sessions.find((item) => item.id === sessionId),
  );

  const [level, setLevel] = useState(0);
  const [muted, setMuted] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [hint, setHint] = useState("Connecting the room");

  const running = useRef(false);
  const mutedRef = useRef(false);
  const startedRef = useRef(false);
  const sarvamRef = useRef<SarvamHandle | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const remaining = session
    ? Math.max(
        0,
        session.config.durationMin * 60 -
          Math.floor((now - (session.startedAt ?? now)) / 1000),
      )
    : 0;

  const finish = async (reason: "time" | "manual" | "agent") => {
    if (!running.current) return;
    running.current = false;
    setHint(reason === "time" ? "Time. Writing the debrief." : "Writing the debrief.");
    useInterviewStore.getState().setStatus(sessionId, "ending");
    try {
      await sarvamRef.current?.stop();
    } catch {
      /* closed */
    }
    sarvamRef.current = null;

    const latest = latestSession(sessionId);
    if (!latest) return;
    const result = await evaluateInterview({
      config: latest.config,
      turns: latest.turns,
    });
    if (result.ok) useInterviewStore.getState().setReport(sessionId, result.report);
    else useInterviewStore.getState().setStatus(sessionId, "ended", result.error);
    navigate(`/report/${sessionId}`);
  };

  const finishRef = useRef(finish);
  finishRef.current = finish;

  useEffect(() => {
    if (!hydrated || startedRef.current) return;
    const sess = latestSession(sessionId);
    if (!sess) return;
    if (sess.status === "ended" || sess.report) {
      navigate(`/report/${sessionId}`);
      return;
    }

    const creds = useInterviewStore.getState().sarvam;
    if (!creds.apiKey || !creds.orgId || !creds.workspaceId || !creds.appId) {
      useInterviewStore
        .getState()
        .setStatus(sessionId, "error", "Connect your Sarvam agent first.");
      setHint("Connect your Sarvam agent first.");
      return;
    }

    startedRef.current = true;
    running.current = true;
    useInterviewStore
      .getState()
      .patchSession(sessionId, { startedAt: Date.now(), status: "connecting" });

    let cancelled = false;

    const boot = async () => {
      try {
        setHint("Connecting your Sarvam agent");
        const handle = await connectSarvamAgent(creds, sess.config, {
          onTranscript: (turn) => useInterviewStore.getState().addTurn(sessionId, turn),
          onState: (state) => {
            const map: Record<string, RoomStatus> = {
              idle: "connecting",
              connecting: "connecting",
              connected: "listening",
              listening: "listening",
              speaking: "speaking",
              error: "error",
            };
            const next = map[state] ?? "listening";
            if (next === "speaking") setHint("Interviewer speaking");
            if (next === "listening") setHint("Your turn — speak");
            if (running.current && next !== "error") {
              useInterviewStore.getState().setStatus(sessionId, next);
            }
          },
          onLevel: setLevel,
          onError: (message) => {
            useInterviewStore.getState().setStatus(sessionId, "error", message);
            setHint(message);
          },
          onEnd: () => {
            if (running.current) void finishRef.current("agent");
          },
          onExtracted: (vars) => {
            if (vars.call_summary) {
              useInterviewStore
                .getState()
                .patchSession(sessionId, { callSummary: vars.call_summary });
            }
          },
        });
        if (cancelled) {
          await handle.stop();
          return;
        }
        sarvamRef.current = handle;
        useInterviewStore.getState().setStatus(sessionId, "listening");
        setHint("Live with your Sarvam agent");
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Could not start the room";
        useInterviewStore.getState().setStatus(sessionId, "error", message);
        setHint(message);
        running.current = false;
      }
    };
    void boot();

    return () => {
      cancelled = true;
      running.current = false;
      void sarvamRef.current?.stop();
    };
  }, [hydrated, navigate, sessionId]);

  useEffect(() => {
    if (!session || !running.current) return;
    if (remaining <= 0 && session.status !== "ending" && session.status !== "ended") {
      void finishRef.current("time");
    }
  }, [remaining, session]);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) sarvamRef.current?.mute();
    else sarvamRef.current?.unmute();
  }, []);

  const endNow = useCallback(() => {
    void finishRef.current("manual");
  }, []);

  return { session, level, muted, remaining, hint, toggleMute, endNow };
}
