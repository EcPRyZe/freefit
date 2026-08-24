import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Clock, Play, Plus, RefreshCw, X } from "lucide-react";
import { AddExerciseSheet } from "@/components/add-exercise-sheet";
import { BiasControls } from "@/components/bias-controls";
import { BodyMap } from "@/components/body-map";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { estimateKcal } from "@/lib/calories";
import { getExercise } from "@/lib/exercises";
import { formatLongDate, formatWeight, greeting, todayISO } from "@/lib/format";
import { BAND_LABEL, rateMuscle, ratingColor, ratingMap } from "@/lib/ratings";
import { averageRecovery, computeRecovery, recoveryColor, recoveryLabel } from "@/lib/recovery";
import { trainedToday } from "@/lib/stats";
import { groupTag } from "@/lib/generator";
import { unlockAudio } from "@/lib/ping";
import { useGym } from "@/lib/store";
import { FOCUS_MUSCLES, FOCUS_LABEL, FOCUSES, MUSCLE_LABEL, SET_STYLE_LABEL, type Focus, type Muscle } from "@/lib/types";
import { SetStylePicker } from "@/components/set-style-picker";

const PLAN_CHIPS: { id: "auto" | Focus; label: string }[] = [
  { id: "auto", label: "Auto" },
  ...FOCUSES.map((id) => ({
    id,
    label: id === "full" ? "Full" : FOCUS_LABEL[id],
  })),
];

export function TodayView() {
  const profile = useGym((s) => s.profile);
  const history = useGym((s) => s.history);
  const planned = useGym((s) => s.planned);
  const planMode = useGym((s) => s.planMode);
  const start = useGym((s) => s.startWorkout);
  const regenerate = useGym((s) => s.regenerate);
  const setPlanMode = useGym((s) => s.setPlanMode);
  const setExerciseStyle = useGym((s) => s.setExerciseStyle);
  const addExercise = useGym((s) => s.addExercise);
  const skipExercise = useGym((s) => s.skipExercise);
  const [selected, setSelected] = useState<Muscle | null>(null);
  const [mapMode, setMapMode] = useState<"recovery" | "strength">("recovery");
  const [adding, setAdding] = useState(false);
  const [addQuery, setAddQuery] = useState("");

  const recovery = useMemo(() => computeRecovery(history), [history]);
  const strength = useMemo(() => ratingMap(profile, history), [profile, history]);
  const doneToday = trainedToday(history);
  const first = profile.name.split(" ")[0] || "there";

  const focusMuscles = planned ? FOCUS_MUSCLES[planned.focus] : [];
  const readiness = planned ? averageRecovery(recovery, focusMuscles) : 100;
  const selectedRating = selected ? rateMuscle(profile, history, selected) : null;

  return (
    <main className="px-5 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))] lg:grid lg:grid-cols-2 lg:gap-10 lg:pb-32">
      <section className="stagger-in">
        <p className="text-sm text-muted">{formatLongDate(todayISO())}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {greeting()}, {first}
        </h1>
        <div className="mt-6 rounded-3xl bg-surface p-4 shadow-border lg:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-muted">
              {mapMode === "strength" ? "Muscle strength" : "Muscle recovery"}
            </h2>
            <div className="inline-flex rounded-full bg-raised p-1 shadow-border">
              {(["recovery", "strength"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMapMode(mode)}
                  className={cn(
                    "h-8 rounded-full px-3 text-xs font-medium capitalize transition-colors duration-150",
                    mapMode === mode ? "bg-fg text-bg" : "text-muted hover:text-fg",
                  )}
                >
                  {mode === "recovery" ? "Recovery" : "Strength"}
                </button>
              ))}
            </div>
          </div>
          {selected && mapMode === "recovery" && (
            <p className="mb-2 text-right text-sm font-medium" style={{ color: recoveryColor(recovery[selected]) }}>
              {MUSCLE_LABEL[selected]} {Math.round(recovery[selected])}%
            </p>
          )}
          {selected && mapMode === "strength" && selectedRating && (
            <p
              className="mb-2 text-right text-sm font-medium"
              style={{ color: ratingColor(selectedRating.score) }}
            >
              {MUSCLE_LABEL[selected]}{" "}
              {selectedRating.score == null
                ? "Unrated"
                : `${selectedRating.score} · ${BAND_LABEL[selectedRating.band]}`}
            </p>
          )}
          <BodyMap
            recovery={mapMode === "strength" ? strength : recovery}
            selected={selected}
            onSelect={setSelected}
            mode={mapMode}
          />
        </div>
      </section>

      <section className="mt-6 lg:mt-11">
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-wider text-faint">Plan type</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {PLAN_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setPlanMode(chip.id)}
                aria-pressed={planMode === chip.id}
                className={cn(
                  "h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors duration-150",
                  planMode === chip.id ? "bg-fg text-bg" : "bg-raised text-muted",
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-faint">
            {planMode === "auto"
              ? "Auto picks from recovery and recent sessions."
              : `Locked to ${FOCUS_LABEL[planMode]} until you switch.`}
          </p>
        </div>

        {doneToday ? (
          <div className="rounded-3xl bg-surface p-6 shadow-border">
            <p className="font-display text-2xl font-semibold tracking-wide text-fresh">Session logged</p>
            <p className="mt-2 text-sm text-muted">
              Recovery is updating. Tomorrow's work is already queued from today's lifts.
            </p>
            {planned && (
              <div className="mt-4 rounded-2xl bg-raised p-4 opacity-80">
                <p className="font-medium">{planned.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {planned.exercises.length} movements · {recoveryLabel(readiness)} to train
                </p>
              </div>
            )}
            <Button variant="secondary" className="mt-4 w-full" size="lg" onClick={() => regenerate()}>
              <RefreshCw className="size-4" />
              Rebuild next session
            </Button>
          </div>
        ) : planned ? (
          <div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-faint">Today's workout</p>
                <h2 className="font-display text-3xl font-semibold tracking-wide">{planned.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => regenerate()}
                className="inline-flex size-11 items-center justify-center rounded-xl text-muted hover:bg-raised hover:text-fg"
                aria-label="Regenerate workout"
              >
                <RefreshCw className="size-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-3 text-sm text-muted">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {profile.durationMin} min
              </span>
              <span>{planned.exercises.length} exercises</span>
              <span className="tabular">{estimateKcal({ ...planned, durationSec: profile.durationMin * 60 }, profile)} kcal</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: recoveryColor(readiness) }} />
                {recoveryLabel(readiness)}
              </span>
            </div>
            <Button
              size="xl"
              className="mt-5 w-full"
              disabled={planned.exercises.length === 0}
              onClick={() => {
                unlockAudio();
                start();
              }}
            >
              <Play className="size-4" />
              Start workout
            </Button>
            <ul className="mt-5 space-y-2">
              {planned.exercises.map((item) => {
                const ex = getExercise(item.exerciseId);
                const working = item.sets.filter((s) => !s.warmup);
                const top = working[0];
                const tag = groupTag(planned.exercises, item.instanceId);
                return (
                  <li key={item.instanceId} className="rounded-2xl bg-surface shadow-border">
                    <div className="flex items-start gap-1 px-2 pt-2">
                      <Link
                        to="/exercises/$id"
                        params={{ id: ex.id }}
                        className="flex min-w-0 flex-1 items-center gap-3 px-2 py-1"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 truncate font-medium">
                            {tag && (
                              <span className="shrink-0 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                {tag.kind === "circuit" ? "Ckt" : "SS"} {tag.tag}
                              </span>
                            )}
                            {ex.name}
                          </p>
                          <p className="text-sm text-muted">
                            {working.length} × {top?.reps ?? 0}
                            {top && top.weight > 0
                              ? ` · ${formatWeight(top.weight, profile.units, ex.incrementLb)}`
                              : ""}
                            {" · "}
                            {MUSCLE_LABEL[ex.primary]}
                            {(item.setStyle ?? "normal") !== "normal"
                              ? ` · ${SET_STYLE_LABEL[item.setStyle]}`
                              : ""}
                          </p>
                        </div>
                        <ChevronRight className="size-4 text-faint" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => skipExercise(item.instanceId)}
                        className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-raised hover:text-danger"
                        aria-label={`Remove ${ex.name}`}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="space-y-2 px-4 pb-3 pt-1">
                      <SetStylePicker
                        value={item.setStyle ?? "normal"}
                        onChange={(style) => setExerciseStyle(item.instanceId, style)}
                      />
                      <BiasControls exerciseId={ex.id} size="sm" />
                    </div>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => {
                setAddQuery("");
                setAdding(true);
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-primary/10 px-4 py-3.5 text-sm font-semibold text-primary"
            >
              <Plus className="size-4" />
              Add exercise
            </button>
            {adding && (
              <AddExerciseSheet
                usedIds={new Set(planned.exercises.map((e) => e.exerciseId))}
                equipment={profile.equipment}
                query={addQuery}
                onQuery={setAddQuery}
                onClose={() => setAdding(false)}
                onPick={(id) => {
                  addExercise(id);
                  setAdding(false);
                }}
              />
            )}
          </div>
        ) : (
          <div className="rounded-3xl bg-surface p-6 shadow-border">
            <p className="font-medium">No workout yet</p>
            <Button className="mt-4" onClick={() => regenerate()}>
              Generate one
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
