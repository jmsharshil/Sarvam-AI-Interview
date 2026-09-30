import { ScrollArea } from "@/components/ui/scroll-area";
import type { Turn } from "@/lib/interviews/types";
import { cn } from "@/lib/utils";

export function TranscriptRail({ turns }: { turns: Turn[] }) {
  return (
    <ScrollArea className="h-full min-h-0">
      <ol className="flex flex-col gap-4 p-1 pr-3">
        {turns.length === 0 ? (
          <li className="text-sm text-subtle">The transcript will write itself as you speak.</li>
        ) : (
          turns.map((turn) => (
            <li key={turn.id} className="flex flex-col gap-1">
              <span className="text-[11px] tracking-[0.16em] text-subtle uppercase">
                {turn.role === "interviewer" ? "Interviewer" : "You"}
              </span>
              <p
                className={cn(
                  "text-sm leading-relaxed",
                  turn.role === "interviewer" ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {turn.content}
              </p>
            </li>
          ))
        )}
      </ol>
    </ScrollArea>
  );
}
