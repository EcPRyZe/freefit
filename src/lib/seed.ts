import { daysAgoISO, uid } from "./format";
import type { Focus, LoggedSet, Profile, SessionExercise, WorkoutSession } from "./types";
import { FULL_GYM } from "./types";

export const DEFAULT_PROFILE: Profile = {
  name: "Alex",
  goal: "muscle",
  experience: "intermediate",
  durationMin: 60,
  units: "lb",
  equipment: [...FULL_GYM],
  excludedExerciseIds: [],
  workoutsPerWeek: 4,
  restTimerEnabled: true,
  showWarmups: true,
  sex: "male",
  age: 28,
  bodyweightLb: 185,
  heightIn: 71,
  exerciseBias: {},
  isDemo: false,
};

export function normalizeProfile(raw: Partial<Profile> | undefined): Profile {
  const p = raw ?? {};
  return {
    ...DEFAULT_PROFILE,
    ...p,
    equipment: p.equipment?.length ? p.equipment : [...FULL_GYM],
    excludedExerciseIds: p.excludedExerciseIds ?? [],
    exerciseBias: p.exerciseBias ?? {},
    isDemo: Boolean(p.isDemo),
    sex: p.sex === "female" ? "female" : "male",
    age: clampNum(p.age, 14, 80, DEFAULT_PROFILE.age),
    bodyweightLb: clampNum(p.bodyweightLb, 70, 450, DEFAULT_PROFILE.bodyweightLb),
    heightIn: clampNum(p.heightIn, 48, 90, DEFAULT_PROFILE.heightIn),
  };
}

function clampNum(n: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof n !== "number" || Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function sets(pairs: [number, number][]): LoggedSet[] {
  return pairs.map(([weight, reps]) => ({
    weight,
    reps,
    completed: true,
    warmup: false,
  }));
}

function item(exerciseId: string, pairs: [number, number][], restSec = 90): SessionExercise {
  return {
    instanceId: uid(),
    exerciseId,
    sets: sets(pairs),
    restSec,
    notes: "",
    setStyle: "normal",
  };
}

function session(
  title: string,
  focus: Focus,
  daysAgo: number,
  durationSec: number,
  exercises: SessionExercise[],
): WorkoutSession {
  const date = daysAgoISO(daysAgo);
  const finishedAt = Date.parse(`${date}T18:30:00`);
  return {
    id: uid(),
    title,
    focus,
    date,
    exercises,
    startedAt: finishedAt - durationSec * 1000,
    finishedAt,
    durationSec,
  };
}

/** Lived-in history so recovery, charts, and recommendations feel real. Newest first. */
export function createSeedHistory(): WorkoutSession[] {
  return [
    session("Push Hypertrophy", "push", 1, 3380, [
      item("bb-bench", [[185, 8], [185, 8], [185, 7], [185, 6]], 120),
      item("inc-db-press", [[55, 10], [55, 10], [55, 9]]),
      item("ohp", [[95, 8], [95, 7], [95, 6]], 120),
      item("lat-raise", [[20, 12], [20, 12], [20, 11]]),
      item("pushdown", [[45, 12], [45, 12], [45, 10]]),
      item("cable-fly", [[25, 12], [25, 12], [25, 12]]),
    ]),
    session("Lower Hypertrophy", "legs", 3, 3520, [
      item("bb-squat", [[225, 6], [225, 6], [225, 6], [225, 5]], 150),
      item("rdl", [[185, 8], [185, 8], [185, 8]], 120),
      item("leg-press", [[360, 10], [360, 10], [360, 9]]),
      item("leg-curl", [[70, 12], [70, 12], [70, 11]]),
      item("calf-raise", [[135, 12], [135, 12], [135, 12], [135, 10]]),
      item("hanging-leg-raise", [[0, 12], [0, 10], [0, 10]]),
    ]),
    session("Pull Hypertrophy", "pull", 4, 3410, [
      item("deadlift", [[275, 5], [275, 5], [275, 4], [275, 4]], 180),
      item("lat-pd", [[120, 10], [120, 10], [120, 9], [120, 9]]),
      item("bb-row", [[155, 8], [155, 8], [155, 8]], 120),
      item("face-pull", [[30, 15], [30, 15], [30, 14]]),
      item("bb-curl", [[65, 10], [65, 9], [65, 8]]),
      item("db-shrug", [[55, 12], [55, 12], [55, 12]]),
    ]),
    session("Push Hypertrophy", "push", 6, 3290, [
      item("bb-bench", [[180, 8], [180, 8], [180, 8], [180, 7]], 120),
      item("inc-db-press", [[50, 10], [50, 10], [50, 10]]),
      item("db-ohp", [[40, 8], [40, 8], [40, 7]]),
      item("cable-lat-raise", [[10, 12], [10, 12], [10, 12]]),
      item("skull-crusher", [[50, 10], [50, 10], [50, 9]]),
      item("chest-dip", [[0, 8], [0, 8], [0, 6]]),
    ]),
    session("Lower Hypertrophy", "legs", 8, 3480, [
      item("bb-squat", [[215, 6], [215, 6], [215, 6], [215, 6]], 150),
      item("rdl", [[175, 8], [175, 8], [175, 8]]),
      item("bulg-split", [[40, 10], [40, 10], [40, 8]]),
      item("leg-ext", [[80, 12], [80, 12], [80, 12]]),
      item("seated-curl", [[70, 12], [70, 12], [70, 10]]),
      item("hip-thrust", [[185, 8], [185, 8], [185, 8]]),
    ]),
    session("Pull Hypertrophy", "pull", 9, 3360, [
      item("pull-up", [[0, 8], [0, 7], [0, 6], [0, 6]]),
      item("seated-row", [[120, 10], [120, 10], [120, 10]]),
      item("db-row", [[60, 10], [60, 10], [60, 9]]),
      item("rear-delt-fly", [[15, 15], [15, 14], [15, 12]]),
      item("hammer-curl", [[30, 10], [30, 10], [30, 9]]),
      item("face-pull", [[25, 15], [25, 15], [25, 15]]),
    ]),
    session("Push Hypertrophy", "push", 11, 3180, [
      item("bb-bench", [[175, 8], [175, 8], [175, 8], [175, 8]], 120),
      item("inc-bb-bench", [[115, 8], [115, 8], [115, 7]]),
      item("ohp", [[95, 6], [95, 6], [95, 5]]),
      item("lat-raise", [[17.5, 12], [17.5, 12], [17.5, 10]]),
      item("pushdown", [[40, 12], [40, 12], [40, 12]]),
    ]),
    session("Lower Hypertrophy", "legs", 13, 3400, [
      item("bb-squat", [[205, 8], [205, 8], [205, 7], [205, 6]], 150),
      item("leg-press", [[320, 12], [320, 12], [320, 10]]),
      item("rdl", [[165, 8], [165, 8], [165, 8]]),
      item("leg-curl", [[60, 12], [60, 12], [60, 12]]),
      item("calf-raise", [[115, 15], [115, 15], [115, 12]]),
      item("cable-crunch", [[50, 12], [50, 12], [50, 12]]),
    ]),
  ];
}
