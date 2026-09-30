import { Link, useParams } from "react-router-dom";
import { Mic, MicOff, Square } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { AudioOrb } from "@/components/room/audio-orb";
import { TranscriptRail } from "@/components/room/transcript-rail";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { useVoiceInterview } from "@/hooks/use-voice-interview";
import { roleLabel } from "@/lib/interviews/types";

function formatClock(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RoomPage() {
  const { id = "" } = useParams();
  const hydrated = useHydrated();
  const { session, level, muted, remaining, hint, toggleMute, endNow } =
    useVoiceInterview(id);

  if (!hydrated) {
    return (
      <div className="min-h-dvh bg-background text-foreground">
        <AppHeader solid />
        <p className="px-6 py-24 text-center text-sm text-muted-foreground">Opening the room…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center text-foreground">
        <p className="text-3xl">Room not found</p>
        <Button asChild variant="outline">
          <Link to="/setup">Open a new room</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <AppHeader solid />
      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 px-4 py-6 md:px-8 lg:grid-cols-[1fr_20rem]">
        <section className="flex min-h-0 flex-col items-center justify-center rounded-2xl bg-card px-4 py-8 shadow-[var(--shadow-border)]">
          <div className="mb-2 flex flex-wrap items-center justify-center gap-2 text-[11px] tracking-[0.16em] text-subtle uppercase">
            <span>{session.config.candidateName}</span>
            <span aria-hidden>·</span>
            <span>{roleLabel(session.config)}</span>
            <span aria-hidden>·</span>
            <span>{session.config.interviewType}</span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">{formatClock(remaining)}</span>
          </div>
          <AudioOrb level={level} status={session.status} />
          <p className="mt-2 min-h-6 text-center text-sm text-muted-foreground">
            {session.error ?? hint}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button type="button" variant={muted ? "default" : "outline"} size="lg" onClick={toggleMute}>
              {muted ? <MicOff /> : <Mic />}
              {muted ? "Unmute" : "Mute"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="lg"
              onClick={endNow}
              disabled={session.status === "ending"}
            >
              <Square className="size-3.5 fill-current" />
              End
            </Button>
          </div>
          <p className="mt-4 text-xs text-subtle">Sarvam is the interviewer.</p>
        </section>
        <aside className="flex min-h-[18rem] flex-col rounded-2xl bg-card p-5 shadow-[var(--shadow-border)] lg:min-h-0">
          <p className="mb-3 text-[11px] tracking-[0.18em] text-subtle uppercase">Transcript</p>
          <div className="min-h-0 flex-1">
            <TranscriptRail turns={session.turns} />
          </div>
        </aside>
      </main>
    </div>
  );
}
