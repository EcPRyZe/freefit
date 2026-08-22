import { EXERCISES } from "./exercises";
import { epley1RM, lbToKg } from "./format";
import type { Muscle, Profile, Sex, WorkoutSession } from "./types";
import { MUSCLES } from "./types";

/**
 * Relative-strength ratings from Strength Level / ExRx-style 1RM÷bodyweight
 * bands, shifted for age (ACSM/NSCA young-adult peak, decline after 30).
 * Height enters via BMI as a frame factor so very tall/light or short/heavy
 * athletes aren't scored on raw bodyweight alone.
 */

export type RatingBand = "unrated" | "developing" | "novice" | "intermediate" | "advanced" | "elite";

export interface MuscleRating {
  muscle: Muscle;
  score: number | null;
  band: RatingBand;
  liftName: string | null;
  e1rm: number | null;
  ratio: number | null;
}

type StandardKey =
  | "bench"
  | "ohp"
  | "squat"
  | "deadlift"
  | "row"
  | "pulldown"
  | "curl"
  | "tricep"
  | "raise"
  | "rear"
  | "rdl"
  | "hip"
  | "shrug"
  | "calf"
  | "legcurl"
  | "core"
  | "farmer";

/** Untrained → novice → intermediate → advanced → elite (1RM / bodyweight). */
const MALE_BANDS: Record<StandardKey, [number, number, number, number, number]> = {
  bench: [0.5, 0.75, 1.0, 1.5, 2.0],
  ohp: [0.35, 0.5, 0.7, 0.95, 1.25],
  squat: [0.75, 1.05, 1.4, 1.9, 2.4],
  deadlift: [1.0, 1.3, 1.75, 2.25, 2.75],
  row: [0.5, 0.75, 1.0, 1.35, 1.7],
  pulldown: [0.5, 0.7, 0.95, 1.25, 1.55],
  curl: [0.25, 0.35, 0.5, 0.65, 0.85],
  tricep: [0.4, 0.55, 0.75, 1.05, 1.4],
  raise: [0.08, 0.12, 0.18, 0.25, 0.35],
  rear: [0.08, 0.12, 0.18, 0.26, 0.36],
  rdl: [0.7, 0.95, 1.25, 1.7, 2.15],
  hip: [0.8, 1.15, 1.55, 2.1, 2.7],
  shrug: [0.8, 1.1, 1.45, 1.9, 2.4],
  calf: [0.7, 1.0, 1.35, 1.8, 2.3],
  legcurl: [0.25, 0.4, 0.55, 0.75, 1.0],
  core: [0, 0, 0, 0, 0],
  farmer: [0.4, 0.55, 0.75, 1.0, 1.3],
};

const FEMALE_BANDS: Record<StandardKey, [number, number, number, number, number]> = {
  bench: [0.3, 0.5, 0.7, 1.0, 1.35],
  ohp: [0.2, 0.32, 0.45, 0.6, 0.8],
  squat: [0.55, 0.8, 1.1, 1.5, 1.95],
  deadlift: [0.7, 1.0, 1.35, 1.8, 2.25],
  row: [0.35, 0.5, 0.7, 0.95, 1.25],
  pulldown: [0.3, 0.5, 0.7, 0.95, 1.25],
  curl: [0.15, 0.22, 0.32, 0.45, 0.6],
  tricep: [0.25, 0.38, 0.52, 0.72, 0.95],
  raise: [0.05, 0.08, 0.12, 0.18, 0.26],
  rear: [0.05, 0.08, 0.12, 0.18, 0.26],
  rdl: [0.5, 0.7, 1.0, 1.35, 1.75],
  hip: [0.7, 1.0, 1.4, 1.9, 2.4],
  shrug: [0.5, 0.75, 1.05, 1.4, 1.8],
  calf: [0.5, 0.75, 1.05, 1.45, 1.9],
  legcurl: [0.18, 0.28, 0.4, 0.55, 0.75],
  core: [0, 0, 0, 0, 0],
  farmer: [0.28, 0.4, 0.55, 0.75, 1.0],
};

const EXERCISE_KEY: Record<string, StandardKey> = {
  "bb-bench": "bench",
  "inc-bb-bench": "bench",
  "db-bench": "bench",
  "inc-db-press": "bench",
  "chest-press-machine": "bench",
  "smith-bench": "bench",
  "chest-dip": "tricep",
  ohp: "ohp",
  "db-ohp": "ohp",
  "arnold-press": "ohp",
  "machine-shoulder": "ohp",
  "lat-raise": "raise",
  "cable-lat-raise": "raise",
  "front-raise": "raise",
  "rear-delt-fly": "rear",
  "face-pull": "rear",
  "bb-squat": "squat",
  "front-squat": "squat",
  "goblet-squat": "squat",
  "leg-press": "squat",
  "hack-squat": "squat",
  "bulg-split": "squat",
  "walking-lunge": "squat",
  deadlift: "deadlift",
  "trap-bar-dl": "deadlift",
  rdl: "rdl",
  "db-rdl": "rdl",
  "good-morning": "rdl",
  "hip-thrust": "hip",
  "kb-swing": "hip",
  "bb-row": "row",
  "pendlay-row": "row",
  "seated-row": "row",
  "t-bar-row": "row",
  "machine-row": "row",
  "db-row": "row",
  "lat-pd": "pulldown",
  "pull-up": "pulldown",
  "chin-up": "pulldown",
  "bb-curl": "curl",
  "ez-curl": "curl",
  "db-curl": "curl",
  "hammer-curl": "curl",
  "cable-curl": "curl",
  "preacher-curl": "curl",
  "cg-bench": "tricep",
  "skull-crusher": "tricep",
  pushdown: "tricep",
  "oh-ext": "tricep",
  "tricep-dip": "tricep",
  "bb-shrug": "shrug",
  "db-shrug": "shrug",
  "farmer-carry": "farmer",
  "calf-raise": "calf",
  "seated-calf": "calf",
  "db-calf": "calf",
  "leg-curl": "legcurl",
  "seated-curl": "legcurl",
  "leg-ext": "squat",
};

const PRIMARY_KEY: Record<Muscle, StandardKey> = {
  chest: "bench",
  frontDelts: "ohp",
  sideDelts: "raise",
  rearDelts: "rear",
  biceps: "curl",
  triceps: "tricep",
  forearms: "farmer",
  traps: "shrug",
  lats: "pulldown",
  upperBack: "row",
  lowerBack: "deadlift",
  abs: "core",
  obliques: "core",
  quads: "squat",
  hamstrings: "rdl",
  glutes: "hip",
  adductors: "squat",
  calves: "calf",
  neck: "shrug",
};

export const BAND_LABEL: Record<RatingBand, string> = {
  unrated: "Unrated",
  developing: "Developing",
  novice: "Novice",
  intermediate: "Intermediate",
  advanced: "Advanced",
  elite: "Elite",
};

export function ageFactor(age: number): number {
  if (age < 18) return 0.9;
  if (age < 30) return 1;
  if (age < 40) return 0.96;
  if (age < 50) return 0.88;
  if (age < 60) return 0.8;
  if (age < 70) return 0.7;
  return 0.62;
}

export function bodyMassIndex(profile: Profile): number {
  const kg = lbToKg(profile.bodyweightLb);
  const m = (profile.heightIn * 2.54) / 100;
  if (m <= 0) return 0;
  return kg / (m * m);
}

function frameFactor(profile: Profile): number {
  const bmi = bodyMassIndex(profile);
  if (bmi <= 0) return 1;
  return Math.min(1.12, Math.max(0.9, Math.sqrt(23 / bmi)));
}

function bandsFor(sex: Sex, key: StandardKey): [number, number, number, number, number] {
  const table = (sex === "female" ? FEMALE_BANDS : MALE_BANDS)[key];
  return table ?? MALE_BANDS.bench;
}

function scoreRatio(ratio: number, bands: [number, number, number, number, number]): number {
  const [a, b, c, d, e] = bands;
  if (e <= 0) return 0;
  const pts = [0, a, b, c, d, e];
  const scores = [0, 20, 40, 60, 80, 100];
  if (ratio <= 0) return 0;
  if (ratio >= e) return 100;
  for (let i = 1; i < pts.length; i++) {
    if (ratio <= pts[i]) {
      const t = (ratio - pts[i - 1]) / (pts[i] - pts[i - 1] || 1);
      return scores[i - 1] + t * (scores[i] - scores[i - 1]);
    }
  }
  return 100;
}

export function bandFromScore(score: number | null): RatingBand {
  if (score == null) return "unrated";
  if (score < 30) return "developing";
  if (score < 50) return "novice";
  if (score < 70) return "intermediate";
  if (score < 88) return "advanced";
  return "elite";
}

function bestLiftForMuscle(
  history: WorkoutSession[],
  muscle: Muscle,
): { exerciseId: string; name: string; e1rm: number } | null {
  let best: { exerciseId: string; name: string; e1rm: number } | null = null;
  for (const w of history) {
    for (const item of w.exercises) {
      const ex = EXERCISES.find((e) => e.id === item.exerciseId);
      if (!ex) continue;
      if (ex.primary !== muscle && !ex.secondary.includes(muscle)) continue;
      for (const s of item.sets) {
        if (!s.completed || s.warmup) continue;
        const e1 = s.weight > 0 ? epley1RM(s.weight, s.reps) : 0;
        if (e1 <= 0) continue;
        if (!best || e1 > best.e1rm) best = { exerciseId: ex.id, name: ex.name, e1rm: e1 };
      }
    }
  }
  return best;
}

export function rateMuscle(profile: Profile, history: WorkoutSession[], muscle: Muscle): MuscleRating {
  const lift = bestLiftForMuscle(history, muscle);
  if (!lift) {
    return { muscle, score: null, band: "unrated", liftName: null, e1rm: null, ratio: null };
  }
  const key = EXERCISE_KEY[lift.exerciseId] ?? PRIMARY_KEY[muscle];
  if (key === "core") {
    return { muscle, score: null, band: "unrated", liftName: lift.name, e1rm: lift.e1rm, ratio: null };
  }
  const ageAdj = ageFactor(profile.age);
  const frame = frameFactor(profile);
  const ratio = (lift.e1rm / profile.bodyweightLb) * frame;
  const comparable = ratio / ageAdj;
  const score = Math.round(scoreRatio(comparable, bandsFor(profile.sex, key)));
  return {
    muscle,
    score,
    band: bandFromScore(score),
    liftName: lift.name,
    e1rm: lift.e1rm,
    ratio,
  };
}

export function rateAllMuscles(profile: Profile, history: WorkoutSession[]): MuscleRating[] {
  return MUSCLES.map((m) => rateMuscle(profile, history, m));
}

export function ratingMap(profile: Profile, history: WorkoutSession[]): Record<Muscle, number> {
  const out = {} as Record<Muscle, number>;
  for (const r of rateAllMuscles(profile, history)) {
    out[r.muscle] = r.score ?? -1;
  }
  return out;
}

export function overallRating(ratings: MuscleRating[]): { score: number | null; band: RatingBand } {
  const scored = ratings.filter((r) => r.score != null) as (MuscleRating & { score: number })[];
  if (!scored.length) return { score: null, band: "unrated" };
  const compounds: Muscle[] = ["chest", "quads", "lats", "hamstrings", "frontDelts", "upperBack"];
  const focus = scored.filter((r) => compounds.includes(r.muscle));
  const pool = focus.length ? focus : scored;
  const avg = Math.round(pool.reduce((a, r) => a + r.score, 0) / pool.length);
  return { score: avg, band: bandFromScore(avg) };
}

export function ratingColor(score: number | null): string {
  if (score == null || score < 0) return "var(--color-faint)";
  if (score < 30) return "var(--color-danger)";
  if (score < 50) return "var(--color-warn)";
  if (score < 70) return "var(--color-muted)";
  return "var(--color-fresh)";
}
