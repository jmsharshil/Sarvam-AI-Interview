import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { ConnectSarvam } from "@/components/sarvam/connect-dialog";
import { useHydrated } from "@/hooks/use-hydrated";
import { useInterviewStore } from "@/lib/interviews/store";

export function AppHeader({ solid = false }: { solid?: boolean }) {
  const hydrated = useHydrated();
  const ready = useInterviewStore((s) =>
    Boolean(s.sarvam.apiKey && s.sarvam.orgId && s.sarvam.workspaceId && s.sarvam.appId),
  );
  const shownReady = hydrated && ready;

  return (
    <header
      className={
        solid
          ? "sticky top-0 z-30 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-sm md:px-8"
          : "absolute inset-x-0 top-0 z-30 px-4 py-4 md:px-8"
      }
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 text-foreground no-underline">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary/15 text-xs font-bold tracking-tight text-primary">
            KA
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight">Knowcraft</span>
            <span className="text-[10px] tracking-wide text-subtle uppercase">Interviews</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {shownReady ? (
            <Badge tone="live" className="hidden sm:inline-flex">
              Agent connected
            </Badge>
          ) : null}
          <ConnectSarvam>
            <Button variant="outline" size="sm">
              {shownReady ? "Agent" : "Connect"}
            </Button>
          </ConnectSarvam>
        </div>
      </div>
    </header>
  );
}
