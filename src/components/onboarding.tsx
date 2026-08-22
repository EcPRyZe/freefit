import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useGym } from "@/lib/store";
import {
  BODYWEIGHT_KIT,
  DURATIONS,
  EQUIPMENT,
  EQUIPMENT_LABEL,
  EXPERIENCE,
  EXPERIENCE_LABEL,
  FULL_GYM,
  GOAL_BLURB,
  GOAL_LABEL,
  GOALS,
  HOME_GYM,
  type DurationMin,
  type Equipment,
  type Experience,
  type Goal,
  type Profile,
} from "@/lib/types";
import { DEFAULT_PROFILE } from "@/lib/seed";

const STEPS = ["Welcome", "Goal", "Level", "Time", "Gym", "Days"] as const;

export function Onboarding() {
  const complete = useGym((s) => s.completeOnboarding);
  const loadDemo = useGym((s) => s.loadDemo);
  const [mode, setMode] = useState<"gate" | "create">("gate");
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Profile>({ ...DEFAULT_PROFILE, name: "" });

  function patch(p: Partial<Profile>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else complete({ ...draft, name: draft.name.trim() || "Athlete" });
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
    else setMode("gate");
  }

  if (mode === "gate") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-bg px-5 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
        <div className="flex flex-1 flex-col justify-center">
          <p className="font-display text-5xl font-semibold tracking-wide">FREEFIT</p>
          <h1 className="mt-6 text-3xl font-semibold leading-tight tracking-tight">
            How do you want
            <br />
            to start?
          </h1>
          <p className="mt-3 max-w-sm text-muted">
            Build a plan around you, or poke around a fully logged demo first.
          </p>

          <div className="mt-8 grid gap-3">
            <button
              type="button"
              onClick={() => setMode("create")}
              className="rounded-2xl bg-primary px-5 py-5 text-left text-primary-fg transition-transform duration-150 active:scale-[0.98]"
            >
              <div className="text-lg font-semibold">Create a new profile</div>
              <p className="mt-1 text-sm text-primary-fg/80">
                Name, goal, gym, and empty history. Workouts start from your numbers.
              </p>
            </button>
            <button
              type="button"
              onClick={() => loadDemo()}
              className="rounded-2xl bg-raised px-5 py-5 text-left shadow-border transition-transform duration-150 active:scale-[0.98]"
            >
              <div className="text-lg font-semibold">View the demo</div>
              <p className="mt-1 text-sm text-muted">
                Alex — intermediate, full gym, eight logged workouts so ratings and charts already
                have something to show.
              </p>
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-faint">
          Demo data stays on this device. You can start fresh anytime from You.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-bg px-5 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="flex gap-1">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-200",
              i <= step ? "bg-primary" : "bg-raised",
            )}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col justify-center py-8">
        {step === 0 && (
          <div className="stagger-in">
            <p className="font-display text-5xl font-semibold tracking-wide">FREEFIT</p>
            <h1 className="mt-6 text-3xl font-semibold leading-tight tracking-tight">
              Less planning.
              <br />
              More progress.
            </h1>
            <p className="mt-3 max-w-sm text-muted">
              Workouts adapt to your recovery, equipment, and the weight you actually lift.
            </p>
            <label className="mt-8 block text-xs font-medium uppercase tracking-wider text-faint">
              What should we call you?
            </label>
            <input
              value={draft.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="First name"
              className="mt-2 h-12 w-full rounded-xl bg-raised px-4 text-base text-fg shadow-border outline-none placeholder:text-faint focus:shadow-[0_0_0_1px_var(--color-primary)]"
            />
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">What's the goal?</h1>
            <p className="mt-2 text-sm text-muted">This sets your sets, reps, and rest.</p>
            <div className="mt-6 grid gap-2">
              {GOALS.map((g) => (
                <Choice
                  key={g}
                  title={GOAL_LABEL[g]}
                  subtitle={GOAL_BLURB[g]}
                  active={draft.goal === g}
                  onClick={() => patch({ goal: g as Goal })}
                />
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Experience</h1>
            <p className="mt-2 text-sm text-muted">We'll scale starting weights from here.</p>
            <div className="mt-6 grid gap-2">
              {EXPERIENCE.map((x) => (
                <Choice
                  key={x}
                  title={EXPERIENCE_LABEL[x]}
                  subtitle={
                    x === "beginner"
                      ? "Less than a year of consistent lifting."
                      : x === "intermediate"
                        ? "You know the compounds and can load them."
                        : "Years under the bar. Chase overload."
                  }
                  active={draft.experience === x}
                  onClick={() => patch({ experience: x as Experience })}
                />
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Session length</h1>
            <p className="mt-2 text-sm text-muted">We'll fit the workout to the clock.</p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => patch({ durationMin: d as DurationMin })}
                  className={cn(
                    "h-20 rounded-2xl text-lg font-semibold transition-colors duration-150",
                    draft.durationMin === d
                      ? "bg-primary text-primary-fg"
                      : "bg-raised text-fg shadow-border",
                  )}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Your equipment</h1>
            <p className="mt-2 text-sm text-muted">Only movements you can actually do.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Preset label="Full gym" onClick={() => patch({ equipment: [...FULL_GYM] })} />
              <Preset label="Home gym" onClick={() => patch({ equipment: [...HOME_GYM] })} />
              <Preset label="Bodyweight" onClick={() => patch({ equipment: [...BODYWEIGHT_KIT] })} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {EQUIPMENT.map((eq) => {
                const on = draft.equipment.includes(eq);
                return (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => {
                      const next = on
                        ? draft.equipment.filter((x) => x !== eq)
                        : [...draft.equipment, eq];
                      patch({ equipment: next.length ? next : ["bodyweight"] });
                    }}
                    className={cn(
                      "h-11 rounded-xl px-3 text-left text-sm font-medium transition-colors duration-150",
                      on ? "bg-fg text-bg" : "bg-raised text-muted shadow-border",
                    )}
                  >
                    {EQUIPMENT_LABEL[eq as Equipment]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Days per week</h1>
            <p className="mt-2 text-sm text-muted">Used for recovery and weekly targets.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => patch({ workoutsPerWeek: n })}
                  className={cn(
                    "size-16 rounded-2xl font-display text-2xl font-semibold transition-colors duration-150",
                    draft.workoutsPerWeek === n
                      ? "bg-primary text-primary-fg"
                      : "bg-raised text-fg shadow-border",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" size="xl" className="flex-1" onClick={back}>
          Back
        </Button>
        <Button size="xl" className="flex-[2]" onClick={next}>
          {step === STEPS.length - 1 ? "Build my plan" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

function Choice({
  title,
  subtitle,
  active,
  onClick,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl px-4 py-4 text-left transition-colors duration-150",
        active ? "bg-fg text-bg" : "bg-raised text-fg shadow-border",
      )}
    >
      <div className="font-medium">{title}</div>
      <div className={cn("mt-0.5 text-sm", active ? "text-bg/70" : "text-muted")}>{subtitle}</div>
    </button>
  );
}

function Preset({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 rounded-full bg-raised px-3 text-sm font-medium text-fg shadow-border"
    >
      {label}
    </button>
  );
}
