import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BiasControls } from "@/components/bias-controls";
import { ExerciseChart } from "@/components/exercise-chart";
import { getExercise } from "@/lib/exercises";
import { formatShortDate, formatWeight } from "@/lib/format";
import { estimated1RM } from "@/lib/generator";
import { exerciseHistoryPoints, personalRecords } from "@/lib/stats";
import { useGym } from "@/lib/store";
import { MUSCLE_LABEL } from "@/lib/types";

export function ExerciseStats({ id }: { id: string }) {
  const navigate = useNavigate();
  const history = useGym((s) => s.history);
  const profile = useGym((s) => s.profile);

  let ex;
  try {
    ex = getExercise(id);
  } catch {
    return (
      <main className="px-5 pt-16">
        <p>Exercise not found.</p>
        <button type="button" className="mt-4 text-primary" onClick={() => navigate({ to: "/stats" })}>
          Back to stats
        </button>
      </main>
    );
  }

  const points = exerciseHistoryPoints(history, id);
  const pr = personalRecords(history).find((p) => p.exerciseId === id);
  const e1 = estimated1RM(history, id);

  return (
    <main className="px-5 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
      <button
        type="button"
        onClick={() => navigate({ to: "/stats" })}
        className="inline-flex size-11 items-center justify-center rounded-xl text-muted hover:bg-raised hover:text-fg"
        aria-label="Back"
      >
        <ArrowLeft className="size-5" />
      </button>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{ex.name}</h1>
      <p className="mt-1 text-sm text-muted">{MUSCLE_LABEL[ex.primary]}</p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-surface p-4 shadow-border">
          <p className="text-[11px] uppercase tracking-wider text-faint">Est. 1RM</p>
          <p className="font-display mt-1 text-3xl font-semibold tabular">
            {e1 > 0 ? formatWeight(e1, profile.units, ex.incrementLb) : "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-surface p-4 shadow-border">
          <p className="text-[11px] uppercase tracking-wider text-faint">Best set</p>
          <p className="font-display mt-1 text-3xl font-semibold tabular">
            {pr
              ? `${formatWeight(pr.weight, profile.units, ex.incrementLb).replace(" " + profile.units, "")}×${pr.reps}`
              : "—"}
          </p>
        </div>
      </div>

      <section className="mt-5 rounded-3xl bg-surface p-4 shadow-border">
        <p className="text-sm font-medium text-muted">Load over time</p>
        <ExerciseChart points={points} units={profile.units} />
      </section>

      <section className="mt-5">
        <h2 className="text-sm font-medium text-muted">Logged sessions</h2>
        <ul className="mt-2 divide-y divide-border overflow-hidden rounded-2xl bg-surface shadow-border">
          {[...points].reverse().map((p) => (
            <li key={p.date} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm">{formatShortDate(p.date)}</span>
              <span className="text-sm tabular text-muted">
                {p.weight > 0
                  ? `${formatWeight(p.weight, profile.units, ex.incrementLb)} × ${p.reps}`
                  : `${p.reps} reps`}
              </span>
            </li>
          ))}
          {points.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted">No working sets yet.</li>
          )}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-muted">Suggestions</h2>
        <p className="mt-1 text-xs text-faint">
          The planner weights this against recovery and what you trained recently.
        </p>
        <div className="mt-3">
          <BiasControls exerciseId={id} />
        </div>
      </section>
    </main>
  );
}
