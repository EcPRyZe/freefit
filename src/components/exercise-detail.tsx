import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, Plus } from "lucide-react";
import { BiasControls } from "@/components/bias-controls";
import { FormVideo } from "@/components/form-video";
import { Button } from "@/components/ui/button";
import { getExercise } from "@/lib/exercises";
import { formatWeight } from "@/lib/format";
import { estimated1RM } from "@/lib/generator";
import { personalRecords } from "@/lib/stats";
import { useGym } from "@/lib/store";
import { EQUIPMENT_LABEL, MUSCLE_LABEL } from "@/lib/types";

export function ExerciseDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const history = useGym((s) => s.history);
  const profile = useGym((s) => s.profile);
  const add = useGym((s) => s.addExercise);
  const active = useGym((s) => s.active);
  const deleteCustom = useGym((s) => s.deleteCustomExercise);

  let ex;
  try {
    ex = getExercise(id);
  } catch {
    return (
      <main className="px-5 pt-16">
        <p>Exercise not found.</p>
        <Link to="/exercises" className="mt-4 inline-block text-primary">
          Back to library
        </Link>
      </main>
    );
  }

  const prs = personalRecords(history).filter((p) => p.exerciseId === id);
  const pr = prs[0];
  const e1 = estimated1RM(history, id);

  return (
    <main className="px-5 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
      <button
        type="button"
        onClick={() => navigate({ to: "/exercises" })}
        className="inline-flex size-11 items-center justify-center rounded-xl text-muted hover:bg-raised hover:text-fg"
        aria-label="Back"
      >
        <ArrowLeft className="size-5" />
      </button>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{ex.name}</h1>
      <p className="mt-1 text-sm text-muted">
        {MUSCLE_LABEL[ex.primary]}
        {ex.secondary.length ? ` · ${ex.secondary.map((m) => MUSCLE_LABEL[m]).join(", ")}` : ""}
      </p>
      <p className="mt-1 text-sm text-faint">
        {ex.equipment.map((e) => EQUIPMENT_LABEL[e]).join(" · ")} · {ex.mechanic}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-surface p-4 shadow-border">
          <p className="text-[11px] uppercase tracking-wider text-faint">Est. 1RM</p>
          <p className="mt-1 font-display text-3xl font-semibold tabular">
            {e1 > 0 ? formatWeight(e1, profile.units, ex.incrementLb) : "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-surface p-4 shadow-border">
          <p className="text-[11px] uppercase tracking-wider text-faint">Best set</p>
          <p className="mt-1 font-display text-3xl font-semibold tabular">
            {pr
              ? `${formatWeight(pr.weight, profile.units, ex.incrementLb).replace(" " + profile.units, "")}×${pr.reps}`
              : "—"}
          </p>
        </div>
      </div>

      <Link
        to="/stats/$id"
        params={{ id: ex.id }}
        className="mt-3 flex items-center justify-between rounded-2xl bg-surface px-4 py-4 shadow-border"
      >
        <div>
          <p className="text-sm font-medium">Progress</p>
          <p className="text-xs text-muted">Line graph and session history in Stats</p>
        </div>
        <ChevronRight className="size-4 text-faint" />
      </Link>

      <FormVideo exerciseId={ex.id} />

      <section className="mt-6">
        <h2 className="text-sm font-medium text-muted">Suggestions</h2>
        <p className="mt-1 text-xs text-faint">
          The planner weights this against recovery and recent sessions.
        </p>
        <div className="mt-3">
          <BiasControls exerciseId={ex.id} />
        </div>
      </section>

      {ex.instructions.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-medium text-muted">Cues</h2>
          <ol className="mt-2 space-y-2">
            {ex.instructions.map((c, i) => (
              <li key={i} className="flex gap-3 rounded-2xl bg-surface px-4 py-3 text-sm shadow-border">
                <span className="font-display text-lg text-primary">{i + 1}</span>
                {c}
              </li>
            ))}
          </ol>
        </section>
      )}

      <Button
        size="xl"
        className="mt-8 w-full"
        onClick={() => {
          add(ex.id);
          navigate({ to: "/" });
        }}
      >
        <Plus className="size-4" />
        {active ? "Add to current workout" : "Add to today's workout"}
      </Button>

      {ex.isCustom && (
        <button
          type="button"
          className="mt-4 w-full py-3 text-sm text-danger"
          onClick={() => {
            if (confirm("Delete this custom exercise?")) {
              deleteCustom(ex.id);
              navigate({ to: "/exercises" });
            }
          }}
        >
          Delete custom exercise
        </button>
      )}
    </main>
  );
}
