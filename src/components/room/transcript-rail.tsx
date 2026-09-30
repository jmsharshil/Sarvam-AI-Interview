import { useEffect, useRef } from "react";
import type { Turn } from "@/lib/interviews/types";
import { cn } from "@/lib/utils";

export function TranscriptRail({ turns }: { turns: Turn[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns.length]);

  return (
    <div className="h-full overflow-y-auto pr-1">
      <ol className="flex flex-col gap-4 p-1">
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
        <div ref={bottomRef} />
      </ol>
    </div>
  );
}
