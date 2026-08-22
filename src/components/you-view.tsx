import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackupCard } from "@/components/backup-card";
import { IntegrationsCard } from "@/components/integrations-card";
import { cn } from "@/lib/cn";
import { formatHeight, formatWeight, kgToLb, lbToKg } from "@/lib/format";
import { BAND_LABEL, overallRating, rateAllMuscles, ratingColor } from "@/lib/ratings";
import { personalRecords } from "@/lib/stats";
import { useGym } from "@/lib/store";
import {
  DURATIONS,
  EQUIPMENT,
  EQUIPMENT_LABEL,
  EXPERIENCE,
  EXPERIENCE_LABEL,
  GOAL_LABEL,
  GOALS,
  SEX_LABEL,
  SEXES,
  type DurationMin,
  type Equipment,
  type Experience,
  type Goal,
  type Sex,
} from "@/lib/types";

export function YouView() {
  const profile = useGym((s) => s.profile);
  const history = useGym((s) => s.history);
  const update = useGym((s) => s.updateProfile);
  const reset = useGym((s) => s.resetAll);
  const prs = personalRecords(history).slice(0, 8);
  const overall = overallRating(rateAllMuscles(profile, history));
  const weightShown =
    profile.units === "kg" ? Math.round(lbToKg(profile.bodyweightLb)) : Math.round(profile.bodyweightLb);

  const initial = (profile.name || "A").slice(0, 1).toUpperCase();

  return (
    <main className="px-5 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary font-display text-3xl font-bold text-primary-fg">
          {initial}
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{profile.name || "Athlete"}</h1>
          <p className="text-sm text-muted">
            {GOAL_LABEL[profile.goal]} · {EXPERIENCE_LABEL[profile.experience]}
          </p>
        </div>
      </div>

      <Link
        to="/stats"
        className="mt-6 flex items-center justify-between rounded-2xl bg-surface px-4 py-3 shadow-border"
      >
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Strength rating</p>
          <p className="font-medium" style={{ color: ratingColor(overall.score) }}>
            {overall.score == null ? "Unrated" : `${BAND_LABEL[overall.band]} · ${overall.score}`}
          </p>
        </div>
        <ChevronRight className="size-4 text-faint" />
      </Link>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-muted">Body</h2>
        <p className="mt-1 text-xs text-faint">Used for muscle strength ratings versus standards.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SEXES.map((s) => (
            <Pill key={s} active={profile.sex === s} onClick={() => update({ sex: s as Sex })}>
              {SEX_LABEL[s]}
            </Pill>
          ))}
        </div>
        <div className="mt-2 space-y-2">
          <StepField
            label="Age"
            display={`${profile.age}`}
            onStep={(dir) => update({ age: profile.age + dir })}
          />
          <StepField
            label="Weight"
            display={`${weightShown} ${profile.units}`}
            onStep={(dir) => {
              if (profile.units === "kg") {
                update({ bodyweightLb: kgToLb(weightShown + dir) });
              } else {
                update({ bodyweightLb: profile.bodyweightLb + dir });
              }
            }}
          />
          <StepField
            label="Height"
            display={formatHeight(profile.heightIn, profile.units)}
            onStep={(dir) => {
              if (profile.units === "kg") {
                const cm = Math.round(profile.heightIn * 2.54) + dir;
                update({ heightIn: cm / 2.54 });
              } else {
                update({ heightIn: profile.heightIn + dir });
              }
            }}
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-muted">Goal</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <Pill key={g} active={profile.goal === g} onClick={() => update({ goal: g as Goal })}>
              {GOAL_LABEL[g]}
            </Pill>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-muted">Experience</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {EXPERIENCE.map((x) => (
            <Pill
              key={x}
              active={profile.experience === x}
              onClick={() => update({ experience: x as Experience })}
            >
              {EXPERIENCE_LABEL[x]}
            </Pill>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-muted">Session length</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {DURATIONS.map((d) => (
            <Pill
              key={d}
              active={profile.durationMin === d}
              onClick={() => update({ durationMin: d as DurationMin })}
            >
              {d} min
            </Pill>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-muted">Days per week</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {[3, 4, 5, 6].map((n) => (
            <Pill key={n} active={profile.workoutsPerWeek === n} onClick={() => update({ workoutsPerWeek: n })}>
              {n}
            </Pill>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-muted">Units</h2>
        <div className="mt-2 flex gap-2">
          <Pill active={profile.units === "lb"} onClick={() => update({ units: "lb" })}>
            Pounds
          </Pill>
          <Pill active={profile.units === "kg"} onClick={() => update({ units: "kg" })}>
            Kilograms
          </Pill>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-muted">Preferences</h2>
        <div className="mt-2 space-y-2">
          <Toggle
            label="Rest timer"
            on={profile.restTimerEnabled}
            onChange={(v) => update({ restTimerEnabled: v })}
          />
          <Toggle
            label="Warm-up sets on compounds"
            on={profile.showWarmups}
            onChange={(v) => update({ showWarmups: v })}
          />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-muted">Equipment</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {EQUIPMENT.map((eq) => {
            const on = profile.equipment.includes(eq);
            return (
              <button
                key={eq}
                type="button"
                onClick={() => {
                  const next = on
                    ? profile.equipment.filter((x) => x !== eq)
                    : [...profile.equipment, eq];
                  update({ equipment: next.length ? next : ["bodyweight"] });
                }}
                className={cn(
                  "h-11 rounded-xl px-3 text-left text-sm font-medium",
                  on ? "bg-fg text-bg" : "bg-raised text-muted shadow-border",
                )}
              >
                {EQUIPMENT_LABEL[eq as Equipment]}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-muted">Personal records</h2>
        <ul className="mt-2 divide-y divide-border overflow-hidden rounded-2xl bg-surface shadow-border">
          {prs.map((pr) => (
            <li key={pr.exerciseId} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm">{pr.name}</span>
              <span className="text-sm tabular text-muted">
                {formatWeight(pr.weight, profile.units)} × {pr.reps}
              </span>
            </li>
          ))}
          {prs.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted">PRs show up as you log.</li>
          )}
        </ul>
      </section>

      <BackupCard />

      <IntegrationsCard />

      <Button
        variant="secondary"
        className="mt-10 w-full"
        onClick={() => {
          if (window.confirm("Start over? This clears history and setup.")) reset();
        }}
      >
        Start fresh
      </Button>
    </main>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10 rounded-full px-4 text-sm font-medium transition-colors duration-150",
        active ? "bg-fg text-bg" : "bg-raised text-muted",
      )}
    >
      {children}
    </button>
  );
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex h-14 w-full items-center justify-between rounded-2xl bg-surface px-4 shadow-border"
    >
      <span className="text-sm font-medium">{label}</span>
      <span
        className={cn(
          "relative h-7 w-12 rounded-full transition-colors duration-200",
          on ? "bg-primary" : "bg-raised shadow-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-6 rounded-full bg-fg transition-transform duration-200",
            on ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

function StepField({
  label,
  display,
  onStep,
}: {
  label: string;
  display: string;
  onStep: (dir: -1 | 1) => void;
}) {
  return (
    <div className="flex h-14 items-center justify-between rounded-2xl bg-surface px-4 shadow-border">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="size-10 rounded-lg text-lg text-muted hover:bg-raised hover:text-fg"
          onClick={() => onStep(-1)}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="min-w-16 text-center text-sm font-medium tabular">{display}</span>
        <button
          type="button"
          className="size-10 rounded-lg text-lg text-muted hover:bg-raised hover:text-fg"
          onClick={() => onStep(1)}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
