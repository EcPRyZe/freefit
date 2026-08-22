import { useEffect, useState, type ReactNode } from "react";
import { Check, ChevronDown, Heart, Minus, Plus, Repeat2, SkipForward, X } from "lucide-react";
import { toast } from "sonner";
import { AddExerciseSheet } from "@/components/add-exercise-sheet";
import { RestTimer } from "@/components/rest-timer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { estimateKcal } from "@/lib/calories";
import { getExercise } from "@/lib/exercises";
import {
  displayWeight,
  formatDuration,
  formatWeightShort,
  storeWeight,
} from "@/lib/format";
import { lastWorkingSets } from "@/lib/generator";
import { unlockAudio } from "@/lib/ping";
import {
  bleHrSupported,
  connectBleHr,
  disconnectHr,
  subscribeHr,
  type HrSnapshot,
} from "@/lib/heart-rate";
import { sessionSets } from "@/lib/stats";
import { useGym } from "@/lib/store";
import { EQUIPMENT_LABEL, MUSCLE_LABEL, SET_STYLE_LABEL, type SetStyle } from "@/lib/types";
import { SetStylePicker } from "@/components/set-style-picker";

export function SessionView() {
  const active = useGym((s) => s.active);
  const profile = useGym((s) => s.profile);
  const history = useGym((s) => s.history);
  const lastPR = useGym((s) => s.lastPR);
  const toggleSet = useGym((s) => s.toggleSet);
  const updateSet = useGym((s) => s.updateSet);
  const swapExercise = useGym((s) => s.swapExercise);
  const skipExercise = useGym((s) => s.skipExercise);
  const setExerciseStyle = useGym((s) => s.setExerciseStyle);
  const addExercise = useGym((s) => s.addExercise);
  const addSet = useGym((s) => s.addSet);
  const removeSet = useGym((s) => s.removeSet);
  const finish = useGym((s) => s.finishWorkout);
  const discard = useGym((s) => s.discardWorkout);
  const suggestionsFor = useGym((s) => s.suggestionsFor);

  const [clock, setClock] = useState(0);
  const [openId, setOpenId] = useState<string | null>(active?.exercises[0]?.instanceId ?? null);
  const [swapFor, setSwapFor] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [hr, setHr] = useState<HrSnapshot>(() => ({
    bpm: null,
    avg: null,
    max: null,
    source: null,
    connected: false,
    deviceName: null,
    error: null,
  }));

  useEffect(() => subscribeHr(setHr), []);

  useEffect(() => {
    unlockAudio();
  }, []);

  useEffect(() => {
    if (!active?.startedAt) return;
    const tick = () => setClock(Math.floor((Date.now() - active.startedAt!) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [active?.startedAt]);

  useEffect(() => {
    if (!lastPR) return;
    toast.success("New PR", {
      description: `${lastPR.name} · ${formatWeightShort(lastPR.weight, profile.units)} × ${lastPR.reps}`,
    });
  }, [lastPR, profile.units]);

  if (!active) return null;

  const completedSets = sessionSets({ ...active, exercises: active.exercises });
  const totalWorking = active.exercises.reduce(
    (a, e) => a + e.sets.filter((s) => !s.warmup).length,
    0,
  );
  const suggestions = swapFor ? suggestionsFor(swapFor) : [];

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col overflow-hidden bg-bg">
      <header className="z-20 flex shrink-0 items-center gap-3 border-b border-border bg-bg px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="inline-flex size-11 items-center justify-center rounded-xl text-muted hover:bg-raised hover:text-fg"
          aria-label="Close workout"
        >
          <X className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{active.title}</p>
          <p className="tabular text-xs text-muted">
            {formatDuration(clock)} · {completedSets}/{totalWorking} sets
            {hr.bpm
              ? ` · ${hr.bpm} bpm`
              : hr.avg
                ? ` · avg ${hr.avg}`
                : ""}
            {` · ${estimateKcal(
              {
                ...active,
                durationSec: clock,
                avgHr: hr.avg ?? undefined,
              },
              profile,
            )} kcal`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void (async () => {
              if (hr.connected) {
                await disconnectHr();
                toast.message("Heart rate disconnected");
                return;
              }
              try {
                await connectBleHr();
                toast.success("Heart rate connected");
              } catch (err) {
                const msg = err instanceof Error ? err.message : "";
                if (/cancelled|canceled/i.test(msg)) return;
                toast.error(
                  bleHrSupported()
                    ? msg || "Couldn't find a heart-rate sensor"
                    : "Watch and AirPods need the iOS app. BLE straps work in Chrome.",
                );
              }
            })();
          }}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium",
            hr.connected ? "bg-danger/15 text-danger" : "text-muted hover:bg-raised",
          )}
          aria-label={hr.connected ? "Disconnect heart rate" : "Connect heart rate"}
        >
          <Heart className={cn("size-4", hr.connected && "fill-current")} />
          {hr.connected && hr.bpm ? hr.bpm : "HR"}
        </button>
        <Button size="sm" onClick={() => setConfirm(true)}>
          Finish
        </Button>
      </header>

      <ol className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain px-4 py-4 pb-36">
        {active.exercises.map((item, index) => {
          const ex = getExercise(item.exerciseId);
          const open = openId === item.instanceId;
          const prev = lastWorkingSets(history, item.exerciseId);
          const done = item.sets.filter((s) => !s.warmup && s.completed).length;
          const work = item.sets.filter((s) => !s.warmup).length;
          return (
            <li key={item.instanceId} className="overflow-hidden rounded-3xl bg-surface shadow-border">
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-4 text-left"
                onClick={() => setOpenId(open ? null : item.instanceId)}
              >
                <span className="font-display w-6 text-lg text-faint tabular">{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{ex.name}</span>
                  <span className="text-sm text-muted">
                    {done}/{work} · {MUSCLE_LABEL[ex.primary]}
                    {(item.setStyle ?? "normal") !== "normal"
                      ? ` · ${SET_STYLE_LABEL[item.setStyle as SetStyle]}`
                      : ""}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 text-faint transition-transform duration-200",
                    open && "rotate-180",
                  )}
                />
              </button>
              {open && (
                <div className="border-t border-border px-3 pb-3 pt-2">
                  <div className="mb-2 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSwapFor(item.instanceId)}
                    >
                      <Repeat2 className="size-3.5" />
                      Swap
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => skipExercise(item.instanceId)}
                    >
                      <SkipForward className="size-3.5" />
                      Skip
                    </Button>
                  </div>
                  <div className="mb-3">
                    <SetStylePicker
                      value={item.setStyle ?? "normal"}
                      onChange={(style) => setExerciseStyle(item.instanceId, style)}
                    />
                  </div>
                  <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2.5rem] gap-1 px-1 pb-1 text-[10px] font-medium uppercase tracking-wider text-faint">
                    <span>Set</span>
                    <span>Prev</span>
                    <span>{profile.units}</span>
                    <span>Reps</span>
                    <span />
                  </div>
                  {item.sets.map((s, i) => {
                    const prevSet = prev?.[Math.min(i, (prev.length || 1) - 1)];
                    const prevLabel = prevSet
                      ? `${formatWeightShort(prevSet.weight, profile.units, ex.incrementLb)}×${prevSet.reps}`
                      : "—";
                    return (
                      <div
                        key={i}
                        className={cn(
                          "grid grid-cols-[2rem_1fr_1fr_1fr_2.5rem] items-center gap-1 rounded-xl py-1",
                          s.completed && "opacity-70",
                          s.warmup && "opacity-80",
                        )}
                      >
                        <span className="text-center text-xs tabular text-muted">
                          {s.warmup ? "W" : item.sets.slice(0, i).filter((x) => !x.warmup).length + 1}
                        </span>
                        <span className="truncate text-xs tabular text-muted">{prevLabel}</span>
                        <Stepper
                          value={displayWeight(s.weight, profile.units, ex.incrementLb)}
                          step={profile.units === "kg" ? (ex.incrementLb >= 5 ? 2.5 : 1) : ex.incrementLb}
                          disabled={ex.bodyweight && s.weight === 0}
                          onChange={(v) =>
                            updateSet(item.instanceId, i, {
                              weight: storeWeight(v, profile.units),
                            })
                          }
                        />
                        <Stepper
                          value={s.reps}
                          step={1}
                          onChange={(v) => updateSet(item.instanceId, i, { reps: Math.max(1, v) })}
                        />
                        <button
                          type="button"
                          onClick={() => toggleSet(item.instanceId, i)}
                          className={cn(
                            "mx-auto flex size-9 items-center justify-center rounded-lg transition-colors duration-150",
                            s.completed ? "bg-fresh text-bg" : "bg-raised text-muted",
                          )}
                          aria-label={s.completed ? "Uncheck set" : "Complete set"}
                        >
                          <Check className="size-4" strokeWidth={2.6} />
                        </button>
                      </div>
                    );
                  })}
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => addSet(item.instanceId)}
                    >
                      <Plus className="size-3.5" />
                      Add set
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      disabled={item.sets.filter((s) => !s.warmup).length <= 1}
                      onClick={() => removeSet(item.instanceId)}
                    >
                      <Minus className="size-3.5" />
                      Remove set
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={() => {
              setAddQuery("");
              setAdding(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-primary/40 bg-primary/10 px-4 py-4 text-sm font-semibold text-primary"
          >
            <Plus className="size-4" />
            Add exercise
          </button>
        </li>
      </ol>

      <RestTimer />

      {adding && (
        <AddExerciseSheet
          usedIds={new Set(active.exercises.map((e) => e.exerciseId))}
          equipment={profile.equipment}
          query={addQuery}
          onQuery={setAddQuery}
          onClose={() => setAdding(false)}
          onPick={(id) => {
            const instanceId = addExercise(id);
            setAdding(false);
            if (instanceId) setOpenId(instanceId);
          }}
        />
      )}

      {swapFor && (
        <Sheet onClose={() => setSwapFor(null)} title="Swap exercise">
          <ul className="space-y-2">
            {suggestions.map((ex) => (
              <li key={ex.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-2xl bg-raised px-4 py-3 text-left"
                  onClick={() => {
                    swapExercise(swapFor, ex.id);
                    setSwapFor(null);
                    setOpenId(null);
                  }}
                >
                  <span>
                    <span className="block font-medium">{ex.name}</span>
                    <span className="text-sm text-muted">
                      {MUSCLE_LABEL[ex.primary]} · {ex.equipment.map((e) => EQUIPMENT_LABEL[e]).join(", ")}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {suggestions.length === 0 && (
              <p className="text-sm text-muted">No swaps with your current equipment.</p>
            )}
          </ul>
        </Sheet>
      )}

      {confirm && (
        <Sheet onClose={() => setConfirm(false)} title="Finish workout?">
          <p className="text-sm text-muted">
            {completedSets} working sets will be saved. Incomplete sets are dropped.
          </p>
          <div className="mt-5 grid gap-2">
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                finish();
                toast.success("Workout logged");
              }}
              disabled={completedSets === 0}
            >
              Save session
            </Button>
            <Button variant="secondary" size="lg" className="w-full" onClick={() => setConfirm(false)}>
              Keep lifting
            </Button>
            <Button variant="ghost" size="lg" className="w-full text-danger" onClick={discard}>
              Discard
            </Button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function Stepper({
  value,
  step,
  onChange,
  disabled,
}: {
  value: number;
  step: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const shown = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return (
    <div className="flex h-10 items-center justify-between rounded-lg bg-raised px-1">
      <button
        type="button"
        className="size-8 text-lg text-muted"
        disabled={disabled}
        onClick={() => onChange(Math.max(0, roundStep(value - step, step)))}
        aria-label="Decrease"
      >
        −
      </button>
      <span className="min-w-8 text-center text-sm font-medium tabular">{shown}</span>
      <button
        type="button"
        className="size-8 text-lg text-muted"
        disabled={disabled}
        onClick={() => onChange(roundStep(value + step, step))}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}

function roundStep(v: number, step: number): number {
  return Math.round(v / step) * step;
}

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-bg/70"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-t-3xl bg-surface p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-border">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="size-10 rounded-lg text-muted hover:bg-raised"
            aria-label="Close"
          >
            <X className="mx-auto size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
