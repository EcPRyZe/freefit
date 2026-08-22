import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { BodyMap } from "@/components/body-map";
import { ExerciseChart } from "@/components/exercise-chart";
import { getExercise } from "@/lib/exercises";
import { formatWeight } from "@/lib/format";
import {
  BAND_LABEL,
  overallRating,
  rateAllMuscles,
  rateMuscle,
  ratingColor,
  ratingMap,
} from "@/lib/ratings";
import { exerciseHistoryPoints, trainedExerciseIds } from "@/lib/stats";
import { useGym } from "@/lib/store";
import { MUSCLE_LABEL, type Muscle } from "@/lib/types";

export function StatsView() {
  const profile = useGym((s) => s.profile);
  const history = useGym((s) => s.history);
  const [selected, setSelected] = useState<Muscle | null>(null);

  const ratings = useMemo(() => rateAllMuscles(profile, history), [profile, history]);
  const map = useMemo(() => ratingMap(profile, history), [profile, history]);
  const overall = overallRating(ratings);
  const picked = selected ? rateMuscle(profile, history, selected) : null;
  const exerciseIds = useMemo(() => trainedExerciseIds(history), [history]);

  const ranked = [...ratings].sort((a, b) => {
    if (a.score == null && b.score == null) return 0;
    if (a.score == null) return 1;
    if (b.score == null) return -1;
    return b.score - a.score;
  });

  return (
    <main className="px-5 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <h1 className="text-3xl font-semibold tracking-tight">Stats</h1>
      <p className="mt-1 text-sm text-muted">
        Strength ratings use estimated 1RM versus bodyweight, adjusted for age and frame.
      </p>

      <section className="mt-5 rounded-3xl bg-surface p-5 shadow-border">
        <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Overall</p>
        <p className="font-display mt-1 text-4xl font-semibold tracking-wide">
          {overall.score == null ? "—" : overall.score}
        </p>
        <p className="mt-1 text-sm font-medium" style={{ color: ratingColor(overall.score) }}>
          {BAND_LABEL[overall.band]}
        </p>
        <p className="mt-2 text-xs text-muted">
          Age {profile.age} · {profile.sex === "female" ? "Female" : "Male"} ·{" "}
          {Math.round(profile.bodyweightLb)} lb. Edit body stats in You.
        </p>
      </section>

      <section className="mt-6 rounded-3xl bg-surface p-4 shadow-border">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted">Muscle strength</h2>
          {picked && (
            <span className="text-sm font-medium" style={{ color: ratingColor(picked.score) }}>
              {MUSCLE_LABEL[picked.muscle]}{" "}
              {picked.score == null ? "Unrated" : `${picked.score} · ${BAND_LABEL[picked.band]}`}
            </span>
          )}
        </div>
        <BodyMap recovery={map} selected={selected} onSelect={setSelected} mode="strength" />
        {picked?.liftName && (
          <p className="mt-2 text-center text-xs text-muted">Best from {picked.liftName}</p>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-muted">By muscle</h2>
        <ul className="mt-2 divide-y divide-border overflow-hidden rounded-2xl bg-surface shadow-border">
          {ranked.map((r) => (
            <li key={r.muscle} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{MUSCLE_LABEL[r.muscle]}</p>
                <p className="text-xs text-muted">{r.liftName ?? "No loaded sets yet"}</p>
              </div>
              <span className="text-sm font-medium tabular" style={{ color: ratingColor(r.score) }}>
                {r.score == null ? "—" : `${r.score} · ${BAND_LABEL[r.band]}`}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-muted">Exercise progress</h2>
        <p className="mt-1 text-xs text-faint">Line graphs live here — not during a live session.</p>
        <ul className="mt-3 space-y-3">
          {exerciseIds.map((id) => {
            let ex;
            try {
              ex = getExercise(id);
            } catch {
              return null;
            }
            const points = exerciseHistoryPoints(history, id);
            const last = points[points.length - 1];
            return (
              <li key={id}>
                <Link
                  to="/stats/$id"
                  params={{ id }}
                  className="block rounded-3xl bg-surface p-4 shadow-border"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{ex.name}</p>
                      <p className="text-sm text-muted">
                        {last
                          ? last.weight > 0
                            ? `${formatWeight(last.weight, profile.units, ex.incrementLb)} × ${last.reps}`
                            : `${last.reps} reps`
                          : "No working sets"}
                      </p>
                    </div>
                    <ChevronRight className="mt-1 size-4 shrink-0 text-faint" />
                  </div>
                  {points.length >= 2 && (
                    <div className="pointer-events-none mt-2">
                      <ExerciseChart points={points} units={profile.units} height={120} />
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
          {exerciseIds.length === 0 && (
            <li className="rounded-2xl bg-surface px-4 py-8 text-center text-sm text-muted shadow-border">
              Finish a workout to start tracking lifts.
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
