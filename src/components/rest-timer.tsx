import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatRest } from "@/lib/format";
import { notifyRestOver, requestRestAlerts, unlockAudio } from "@/lib/ping";
import { useGym } from "@/lib/store";

export function RestTimer() {
  const rest = useGym((s) => s.rest);
  const tick = useGym((s) => s.tickRest);
  const skip = useGym((s) => s.skipRest);
  const add = useGym((s) => s.addRest);
  const lastPing = useRef<string | null>(null);

  useEffect(() => {
    if (!rest) return;
    unlockAudio();
    requestRestAlerts();
  }, [rest?.instanceId]);

  useEffect(() => {
    if (!rest) return;
    const id = window.setInterval(() => {
      const current = useGym.getState().rest;
      if (!current) return;
      if (current.remaining <= 1) {
        const key = `${current.instanceId}-${current.total}`;
        if (lastPing.current !== key) {
          lastPing.current = key;
          notifyRestOver();
          toast("Rest over", { description: "Hit the next set." });
        }
      }
      tick();
    }, 1000);
    return () => window.clearInterval(id);
  }, [rest?.instanceId, rest?.total, tick]);

  if (!rest) return null;

  const progress = rest.total <= 0 ? 0 : rest.remaining / rest.total;
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = c * progress;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-4 mb-2 flex w-full max-w-md items-center gap-4 rounded-3xl bg-raised px-4 py-3 shadow-border">
        <svg viewBox="0 0 120 120" className="size-16 shrink-0">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#2a2a30" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            transform="rotate(-90 60 60)"
            className="transition-[stroke-dasharray] duration-1000 linear"
          />
          <text
            x="60"
            y="66"
            textAnchor="middle"
            className="tabular"
            fill="var(--color-fg)"
            fontSize="22"
            fontWeight="600"
            fontFamily="var(--font-display)"
          >
            {formatRest(rest.remaining)}
          </text>
        </svg>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Rest</p>
          <p className="text-xs text-muted">Next set when the ring closes.</p>
          <div className="mt-2 flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => add(-15)}>
              −15s
            </Button>
            <Button variant="secondary" size="sm" onClick={() => add(15)}>
              +15s
            </Button>
            <Button variant="outline" size="sm" onClick={skip}>
              Skip
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
