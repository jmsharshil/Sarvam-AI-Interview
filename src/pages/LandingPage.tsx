import { Link } from "react-router-dom";
import { ArrowRight, Mic, Shield, Users } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { ConnectSarvam } from "@/components/sarvam/connect-dialog";
import { useHydrated } from "@/hooks/use-hydrated";
import { useInterviewStore } from "@/lib/interviews/store";
import { useSarvamReady } from "@/hooks/use-sarvam-ready";
import { roleLabel, type InterviewSession } from "@/lib/interviews/types";

export function LandingPage() {
  const hydrated = useHydrated();
  const sessions = useInterviewStore((s) => s.sessions);
  const ready = useSarvamReady();
  const shownSessions = hydrated ? sessions : [];
  const shownReady = hydrated ? ready : false;

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background text-foreground">
      <div className="hero-wash pointer-events-none absolute inset-x-0 top-0 h-[28rem]" />
      <AppHeader />
      <main className="relative mx-auto flex w-full max-w-5xl flex-col px-4 pt-24 pb-16 md:px-8 md:pt-28">
        <section className="mx-auto max-w-2xl text-center">
          <p className="rise-1 text-[11px] tracking-[0.22em] text-primary uppercase">
            Knowcraft Analytics · Talent
          </p>
          <h1 className="rise-2 mt-4 text-[clamp(2.25rem,6vw,3.5rem)] font-semibold leading-[1.1] tracking-tight">
            Voice interviews
          </h1>
          <p className="rise-3 mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            Run live HR interviews with your agent — Analyst and Advanced Analyst roles at
            Knowcraft.
          </p>
          <div className="rise-4 mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/setup">
                Start interview
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <ConnectSarvam>
              <Button variant="outline" size="lg">
                {shownReady ? "Agent settings" : "Connect agent"}
              </Button>
            </ConnectSarvam>
          </div>
          <p className="rise-5 mt-4 text-xs text-subtle">
            {shownReady
              ? "Agent connected · ready to interview"
              : "Connect your Voice Agent to begin"}
          </p>
        </section>

        <section className="mt-16 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: Mic,
              title: "Voice-first",
              copy: "Live spoken interview with your configured agent.",
            },
            {
              icon: Users,
              title: "Two seats",
              copy: "Analyst and Advanced Analyst — matched to JOB_TITLE.",
            },
            {
              icon: Shield,
              title: "Knowcraft defaults",
              copy: "Company, support, and interviewer fixed for every room.",
            },
          ].map(({ icon: Icon, title, copy }) => (
            <div
              key={title}
              className="rounded-xl bg-card px-5 py-5 shadow-[var(--shadow-border)]"
            >
              <Icon className="mb-3 size-4 text-primary" strokeWidth={1.75} />
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{copy}</p>
            </div>
          ))}
        </section>

        <section className="mt-16">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Recent interviews</h2>
            {shownSessions.length > 0 ? (
              <span className="text-xs text-subtle">{shownSessions.length} on this device</span>
            ) : null}
          </div>
          {shownSessions.length === 0 ? (
            <p className="rounded-xl px-5 py-8 text-center text-sm text-muted-foreground shadow-[var(--shadow-border)]">
              No interviews yet. Start one when your agent is connected.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {shownSessions.slice(0, 6).map((sess) => (
                <SessionCard key={sess.id} session={sess} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function SessionCard({ session }: { session: InterviewSession }) {
  const to =
    session.report || session.status === "ended" || session.status === "error"
      ? `/report/${session.id}`
      : `/room/${session.id}`;
  return (
    <li>
      <Link
        to={to}
        className="flex items-center justify-between gap-3 rounded-xl bg-card px-4 py-3.5 no-underline shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {session.config?.candidateName || "Candidate"} ·{" "}
            {roleLabel(session.config)}
          </p>
          <p className="mt-0.5 text-xs text-subtle">
            {session.config?.interviewType || "HR Interview"}
          </p>
        </div>
        <Badge tone={session.report ? "live" : "muted"}>
          {session.report ? "Done" : session.status === "error" ? "Failed" : "Open"}
        </Badge>
      </Link>
    </li>
  );
}
