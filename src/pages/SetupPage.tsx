import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { ConnectSarvam } from "@/components/sarvam/connect-dialog";
import { useInterviewStore } from "@/lib/interviews/store";
import { useSarvamReady } from "@/hooks/use-sarvam-ready";
import { TRACKS, type JobTitle } from "@/lib/interviews/types";
import { cn } from "@/lib/utils";

export function SetupPage() {
  const navigate = useNavigate();
  const draft = useInterviewStore((s) => s.draft);
  const setDraft = useInterviewStore((s) => s.setDraft);
  const createSession = useInterviewStore((s) => s.createSession);
  const ready = useSarvamReady();
  const [busy, setBusy] = useState(false);

  const enter = () => {
    if (!ready) {
      toast.error("Connect your Sarvam agent first.");
      return;
    }
    if (!(draft.candidateName ?? "").trim()) {
      toast.error("Enter the candidate name.");
      return;
    }
    setBusy(true);
    const session = createSession();
    navigate(`/room/${session.id}`);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <AppHeader solid />
      <main className="mx-auto flex max-w-lg flex-col px-4 py-10 md:px-8">
        <p className="text-[11px] tracking-[0.22em] text-primary uppercase">
          Knowcraft Analytics
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          New interview
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Choose the seat and candidate. Everything else is fixed for your Sarvam agent.
        </p>

        <form
          className="mt-8 flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            enter();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="candidate">Candidate name</Label>
            <Input
              id="candidate"
              value={draft.candidateName ?? ""}
              placeholder="Zeelsh"
              onChange={(e) => setDraft({ candidateName: e.target.value })}
              autoFocus
            />
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">Role</p>
            <div className="grid grid-cols-2 gap-2">
              {TRACKS.map((track) => {
                const on = draft.jobTitle === track.id;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => setDraft({ jobTitle: track.id as JobTitle })}
                    className={cn(
                      "rounded-lg px-3 py-4 text-left text-sm font-medium transition-[background-color,box-shadow] duration-150",
                      on
                        ? "bg-primary text-primary-foreground shadow-[var(--shadow-border)]"
                        : "bg-card text-foreground shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
                    )}
                  >
                    {track.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Card className="space-y-1.5 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Sent to agent automatically</p>
            <p>Company · Knowcraft Analytics</p>
            <p>Type · HR Interview</p>
            <p>Interviewer · Manan</p>
            <p>Support · talent@knowcraft.in</p>
          </Card>

          <div className="flex flex-col gap-3 pt-1">
            <Button type="button" size="lg" disabled={busy || !ready} onClick={enter}>
              Start interview
            </Button>
            {!ready ? (
              <ConnectSarvam>
                <Button type="button" variant="outline" size="lg" className="w-full">
                  Connect Sarvam agent
                </Button>
              </ConnectSarvam>
            ) : null}
          </div>
        </form>
      </main>
    </div>
  );
}
