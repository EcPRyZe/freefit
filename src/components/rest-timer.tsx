import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatRest } from "@/lib/format";
import { notifyRestOver, requestRestAlerts } from "@/lib/ping";
import { useGym } from "@/lib/store";

export function RestTimer({ lift = false }: { lift?: boolean }) {
  const rest = useGym((s) => s.rest);
  const skip = useGym((s) => s.skipRest);
  const add = useGym((s) => s.addRest);
  const lastPing = useRef<string | null>(null);

  useEffect(() => {
    if (!rest) return;
    requestRestAlerts();
  }, [rest?.instanceId]);

  useEffect(() => {
    if (!rest) return;

    const fire = () => {
      const current = useGym.getState().rest;
      if (!current) return;
      const key = `${current.instanceId}-${current.endsAt}`;
      const status = useGym.getState().syncRest();
      if (status !== "ended") return;
      if (lastPing.current === key) return;
      lastPing.current = key;
      notifyRestOver();
      toast("Rest over", { description: "Hit the next set." });
    };

    fire();
    const id = window.setInterval(fire, 250);
    document.addEventListener("visibilitychange", fire);
    window.addEventListener("pageshow", fire);
    window.addEventListener("focus", fire);
    window.addEventListener("online", fire);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", fire);
      window.removeEventListener("pageshow", fire);
      window.removeEventListener("focus", fire);
      window.removeEventListener("online", fire);
    };
  }, [rest?.instanceId, rest?.endsAt]);

  if (!rest) return null;

  const progress = rest.total <= 0 ? 0 : rest.remaining / rest.total;
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = c * progress;
  const bottom = lift
    ? "calc(7.25rem + env(safe-area-inset-bottom))"
    : "calc(3.75rem + env(safe-area-inset-bottom))";

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center"
      style={{ bottom }}
    >
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
            className="transition-[stroke-dasharray] duration-200 linear"
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
