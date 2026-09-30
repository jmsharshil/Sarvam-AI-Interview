import { cn } from "@/lib/utils";
import type { RoomStatus } from "@/lib/interviews/types";

export function AudioOrb({ level, status }: { level: number; status: RoomStatus }) {
  const pulse = 1 + Math.min(0.22, level * 0.28);
  return (
    <div
      className={cn(
        "relative mx-auto grid size-[min(72vw,22rem)] place-items-center",
        status === "listening" && "orb-listening",
      )}
      aria-hidden
    >
      <div className="orb-ring pointer-events-none absolute inset-[6%] rounded-full border border-border" />
      <div className="orb-ring orb-ring-delay pointer-events-none absolute inset-[16%] rounded-full border border-border/80" />
      <div
        className="relative size-[42%] rounded-full shadow-[var(--shadow-border)] transition-transform duration-150"
        style={{
          transform: `scale(${pulse})`,
          background:
            status === "listening"
              ? "var(--color-live)"
              : status === "speaking"
                ? "var(--color-primary)"
                : "var(--color-raised)",
        }}
      />
      <span className="pointer-events-none absolute bottom-[14%] text-[11px] tracking-[0.18em] text-subtle uppercase">
        {status === "speaking" ? "Agent" : status}
      </span>
    </div>
  );
}
