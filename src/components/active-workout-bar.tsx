import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { formatDuration, formatRest } from "@/lib/format";
import { sessionSets } from "@/lib/stats";
import { useGym } from "@/lib/store";

export function ActiveWorkoutBar() {
  const active = useGym((s) => s.active);
  const rest = useGym((s) => s.rest);
  const gym = useGym((s) => s.profile.gymMode);
  const updateProfile = useGym((s) => s.updateProfile);
  const navigate = useNavigate();
  const [clock, setClock] = useState(0);

  useEffect(() => {
    if (!active?.startedAt) return;
    const tick = () => setClock(Math.floor((Date.now() - active.startedAt!) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [active?.startedAt]);

  if (!active) return null;

  const done = sessionSets(active);
  const total = active.exercises.reduce((a, e) => a + e.sets.filter((s) => !s.warmup).length, 0);

  return (
    <div
      className="fixed inset-x-0 z-[35] flex items-center gap-2 border-t border-primary/30 bg-primary px-3 py-2 text-primary-fg"
      style={{ bottom: "calc(3.5rem + env(safe-area-inset-bottom))" }}
    >
      <button
        type="button"
        onClick={() => navigate({ to: "/" })}
        className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left"
      >
        <span className="size-2 shrink-0 rounded-full bg-primary-fg/90" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{active.title}</span>
          <span className="text-xs text-primary-fg/80">
            {formatDuration(clock)} · {done}/{total} sets
            {rest ? ` · rest ${formatRest(rest.remaining)}` : " · tap to resume"}
          </span>
        </span>
      </button>
      {gym && (
        <button
          type="button"
          onClick={() => updateProfile({ gymMode: false })}
          className="shrink-0 rounded-lg bg-primary-fg/15 px-2.5 py-2 text-xs font-semibold"
        >
          Exit gym
        </button>
      )}
    </div>
  );
}
