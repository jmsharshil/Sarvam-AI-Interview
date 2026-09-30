import { Link, useParams } from "react-router-dom";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, Progress } from "@/components/ui/card";
import { TranscriptRail } from "@/components/room/transcript-rail";
import { useHydrated } from "@/hooks/use-hydrated";
import { useInterviewStore } from "@/lib/interviews/store";
import { SCORE_LABELS, roleLabel, type ScoreKey } from "@/lib/interviews/types";

export function ReportPage() {
  const { id = "" } = useParams();
  const hydrated = useHydrated();
  const session = useInterviewStore((s) => s.sessions.find((item) => item.id === id));

  if (!hydrated) {
    return (
      <div className="min-h-dvh bg-background text-foreground">
        <AppHeader solid />
        <p className="px-6 py-24 text-center text-sm text-muted-foreground">Loading debrief…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center text-foreground">
        <p className="text-3xl">Debrief missing</p>
        <Button asChild variant="outline">
          <Link to="/">Back home</Link>
        </Button>
      </div>
    );
  }

  const report = session.report;
  const scoreKeys = Object.keys(SCORE_LABELS) as ScoreKey[];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <AppHeader solid />
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:px-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-[11px] tracking-[0.22em] text-subtle uppercase">Debrief</p>
          <h1 className="mt-2 text-4xl tracking-tight md:text-5xl">
            {session.config.candidateName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {roleLabel(session.config)} · {session.config.interviewType} ·{" "}
            {session.config.companyName} · {session.config.language} ·{" "}
            {session.config.durationMin} min
          </p>

          {session.callSummary ? (
            <Card className="mt-6 p-4">
              <p className="text-[11px] tracking-[0.16em] text-subtle uppercase">call_summary</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {session.callSummary}
              </p>
            </Card>
          ) : null}

          {session.error && !report ? (
            <p className="mt-6 text-sm text-destructive">{session.error}</p>
          ) : null}

          {report ? (
            <div className="mt-8 flex flex-col gap-8">
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                {report.summary}
              </p>
              <div className="grid gap-4">
                {scoreKeys.map((key) => (
                  <div key={key} className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-3">
                    <span className="text-sm text-muted-foreground">{SCORE_LABELS[key]}</span>
                    <Progress value={report.scores[key] * 10} />
                    <span className="text-right font-mono text-sm tabular-nums">
                      {report.scores[key]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Column title="What landed" items={report.highlights} />
                <Column title="What was thin" items={report.misses} />
              </div>
              {report.betterAnswers.length > 0 ? (
                <section>
                  <h2 className="text-2xl tracking-tight">Stronger answers</h2>
                  <ul className="mt-4 flex flex-col gap-4">
                    {report.betterAnswers.map((item, i) => (
                      <li
                        key={i}
                        className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)]"
                      >
                        <p className="text-sm font-medium">{item.question}</p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {item.note}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          ) : (
            <p className="mt-8 text-sm text-muted-foreground">No written debrief for this room yet.</p>
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/setup">Sit another</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Home</Link>
            </Button>
          </div>
        </div>
        <Card className="flex min-h-[24rem] flex-col p-5">
          <p className="mb-3 text-[11px] tracking-[0.18em] text-subtle uppercase">Transcript</p>
          <div className="min-h-0 flex-1">
            <TranscriptRail turns={session.turns} />
          </div>
        </Card>
      </main>
    </div>
  );
}

function Column({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
      <p className="text-sm font-medium">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-subtle">Nothing noted.</p>
      ) : (
        <ul className="mt-3 list-disc space-y-2 pl-4 text-sm leading-relaxed text-muted-foreground">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
