import { catalog, getExercise } from "./exercises";
import { epley1RM, roundTo, todayISO, uid } from "./format";
import {
  averageRecovery,
  computeRecovery,
  daysSinceFocus,
} from "./recovery";
import type {
  Exercise,
  Focus,
  LoggedSet,
  Muscle,
  Profile,
  SessionExercise,
  WorkoutSession,
} from "./types";
import { FOCUS_LABEL, FOCUS_MUSCLES } from "./types";

const CORE_MUSCLES: Muscle[] = ["abs", "obliques"];
const ISO_SLOTS = new Set<string>([
  "core",
  "sideDelts",
  "triceps",
  "biceps",
  "rearDelts",
  "calves",
  "adductors",
]);

type Slot = Muscle | "core";

function isCore(ex: Exercise): boolean {
  return CORE_MUSCLES.includes(ex.primary);
}

function available(profile: Profile): Exercise[] {
  const kit = new Set(profile.equipment);
  return catalog().filter((ex) => {
    if (profile.excludedExerciseIds.includes(ex.id)) return false;
    if ((profile.exerciseBias[ex.id] ?? 0) <= -2) return false;
    return ex.equipment.every((eq) => kit.has(eq));
  });
}

function hashPick(id: string, nonce: number): number {
  let h = nonce * 2654435761;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function pickFocus(history: WorkoutSession[], now = new Date()): Focus {
  const recovery = computeRecovery(history, now);
  const scores: Partial<Record<Focus, number>> = {
    push:
      averageRecovery(recovery, ["chest", "frontDelts", "triceps"]) +
      daysSinceFocus(history, "push", now) * 7,
    pull:
      averageRecovery(recovery, ["lats", "upperBack", "biceps"]) +
      daysSinceFocus(history, "pull", now) * 7,
    legs:
      averageRecovery(recovery, ["quads", "hamstrings", "glutes"]) +
      daysSinceFocus(history, "legs", now) * 7,
  };
  const last = history.find((s) => s.finishedAt);
  if (last && last.focus in scores) {
    scores[last.focus] = (scores[last.focus] ?? 0) - 18;
  }
  return (Object.entries(scores) as [Focus, number][]).sort((a, b) => b[1] - a[1])[0][0];
}

function scheme(profile: Profile, ex: Exercise): { sets: number; reps: number; rest: number } {
  const compound = ex.mechanic === "compound";
  const expBonus = profile.experience === "advanced" ? 1 : 0;
  if (profile.goal === "strength") {
    return compound
      ? { sets: 5, reps: 5, rest: 150 }
      : { sets: 3 + expBonus, reps: 8, rest: 90 };
  }
  if (profile.goal === "muscle") {
    return compound
      ? { sets: 4, reps: 8, rest: 90 }
      : { sets: 3 + expBonus, reps: 12, rest: 60 };
  }
  if (profile.goal === "power") {
    return compound
      ? { sets: 5, reps: 3, rest: 180 }
      : { sets: 3, reps: 6, rest: 90 };
  }
  return compound
    ? { sets: 3 + expBonus, reps: 8, rest: 90 }
    : { sets: 3, reps: 10, rest: 60 };
}

export function lastWorkingSets(
  history: WorkoutSession[],
  exerciseId: string,
): LoggedSet[] | null {
  for (const w of history) {
    const item = w.exercises.find((e) => e.exerciseId === exerciseId);
    if (!item) continue;
    const working = item.sets.filter((s) => !s.warmup && s.completed);
    if (working.length) return working;
  }
  return null;
}

export function recommendWeightLb(
  profile: Profile,
  history: WorkoutSession[],
  exerciseId: string,
): number {
  const ex = getExercise(exerciseId);
  if (ex.bodyweight) {
    const last = lastWorkingSets(history, exerciseId);
    return last ? last[0].weight : 0;
  }
  const last = lastWorkingSets(history, exerciseId);
  const { reps } = scheme(profile, ex);
  if (!last) {
    const exp =
      profile.experience === "beginner" ? 0.7 : profile.experience === "advanced" ? 1.2 : 1;
    return roundTo(ex.defaultWeightLb * exp, ex.incrementLb);
  }
  const top = Math.max(...last.map((s) => s.weight));
  const hit = last.every((s) => s.reps >= reps);
  const next = hit ? top + ex.incrementLb : top;
  return roundTo(next, ex.incrementLb);
}

function buildSets(
  profile: Profile,
  history: WorkoutSession[],
  ex: Exercise,
): { sets: LoggedSet[]; restSec: number } {
  const { sets: n, reps, rest } = scheme(profile, ex);
  const weight = recommendWeightLb(profile, history, ex.id);
  const working: LoggedSet[] = Array.from({ length: n }, () => ({
    weight,
    reps,
    completed: false,
    warmup: false,
  }));
  const warmups: LoggedSet[] = [];
  if (profile.showWarmups && ex.mechanic === "compound" && !ex.bodyweight && weight >= 95) {
    warmups.push(
      { weight: roundTo(weight * 0.5, ex.incrementLb), reps: Math.min(8, reps + 2), completed: false, warmup: true },
      { weight: roundTo(weight * 0.7, ex.incrementLb), reps: Math.min(5, reps), completed: false, warmup: true },
    );
  }
  return { sets: [...warmups, ...working], restSec: rest };
}

function exerciseCount(durationMin: number): number {
  if (durationMin <= 30) return 4;
  if (durationMin <= 45) return 5;
  if (durationMin <= 60) return 6;
  if (durationMin <= 75) return 7;
  return 8;
}

/** 4–8 slot templates. Push = chest/shoulders/tris + abs. Pull = back/bis + abs. */
function slotsFor(focus: Focus, want: number): Slot[] {
  const table: Record<Focus, Slot[][]> = {
    push: [
      ["chest", "frontDelts", "triceps", "core"],
      ["chest", "chest", "frontDelts", "triceps", "core"],
      ["chest", "chest", "frontDelts", "sideDelts", "triceps", "core"],
      ["chest", "chest", "frontDelts", "sideDelts", "triceps", "triceps", "core"],
      ["chest", "chest", "frontDelts", "sideDelts", "triceps", "triceps", "chest", "core"],
    ],
    pull: [
      ["lats", "upperBack", "biceps", "core"],
      ["lats", "upperBack", "lats", "biceps", "core"],
      ["lats", "upperBack", "lats", "rearDelts", "biceps", "core"],
      ["lats", "upperBack", "lats", "rearDelts", "biceps", "biceps", "core"],
      ["lats", "upperBack", "lats", "lowerBack", "rearDelts", "biceps", "biceps", "core"],
    ],
    legs: [
      ["quads", "hamstrings", "glutes", "calves"],
      ["quads", "hamstrings", "glutes", "calves", "core"],
      ["quads", "hamstrings", "glutes", "quads", "calves", "core"],
      ["quads", "hamstrings", "glutes", "quads", "hamstrings", "calves", "core"],
      ["quads", "hamstrings", "glutes", "quads", "adductors", "calves", "core", "core"],
    ],
    upper: [
      ["chest", "lats", "frontDelts", "biceps"],
      ["chest", "lats", "frontDelts", "triceps", "core"],
      ["chest", "lats", "frontDelts", "upperBack", "triceps", "biceps"],
      ["chest", "lats", "frontDelts", "upperBack", "triceps", "biceps", "core"],
      ["chest", "lats", "frontDelts", "upperBack", "sideDelts", "triceps", "biceps", "core"],
    ],
    full: [
      ["quads", "chest", "lats", "core"],
      ["quads", "chest", "lats", "hamstrings", "core"],
      ["quads", "chest", "lats", "hamstrings", "frontDelts", "core"],
      ["quads", "chest", "lats", "hamstrings", "frontDelts", "biceps", "core"],
      ["quads", "chest", "lats", "hamstrings", "frontDelts", "triceps", "biceps", "core"],
    ],
  };
  const idx = Math.min(Math.max(want, 4), 8) - 4;
  return table[focus][idx];
}

function matchesSlot(ex: Exercise, slot: Slot): boolean {
  if (slot === "core") return isCore(ex);
  return ex.primary === slot;
}

function scoreForSlot(
  ex: Exercise,
  slot: Slot,
  usedOfSlot: number,
  recent: Set<string>,
  profile: Profile,
  nonce: number,
): number {
  const wantIso = ISO_SLOTS.has(slot) || usedOfSlot >= 1;
  let score = 0;
  if (wantIso) score += ex.mechanic === "isolation" ? 35 : 12;
  else score += ex.mechanic === "compound" ? 48 : 16;
  if (recent.has(ex.id)) score -= 25;
  score += (profile.exerciseBias[ex.id] ?? 0) * 32;
  score += (hashPick(ex.id, nonce) % 17) - 8;
  return score;
}

function pickForSlot(
  slot: Slot,
  pool: Exercise[],
  taken: Set<string>,
  usedOfSlot: number,
  recent: Set<string>,
  profile: Profile,
  nonce: number,
): Exercise | undefined {
  const ranked = pool
    .filter((ex) => matchesSlot(ex, slot) && !taken.has(ex.id))
    .map((ex) => ({
      ex,
      score: scoreForSlot(ex, slot, usedOfSlot, recent, profile, nonce),
    }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.ex;
}

function fallbackForFocus(
  focus: Focus,
  pool: Exercise[],
  taken: Set<string>,
): Exercise | undefined {
  const allowed = new Set<Muscle>([...FOCUS_MUSCLES[focus], ...CORE_MUSCLES]);
  return pool.find((ex) => !taken.has(ex.id) && allowed.has(ex.primary));
}

export function generateWorkout(
  profile: Profile,
  history: WorkoutSession[],
  opts: { focus?: Focus; nonce?: number; now?: Date } = {},
): WorkoutSession {
  const now = opts.now ?? new Date();
  const focus = opts.focus ?? pickFocus(history, now);
  const nonce = opts.nonce ?? 0;
  const pool = available(profile);
  const recent = new Set(
    history.slice(0, 3).flatMap((w) => w.exercises.map((e) => e.exerciseId)),
  );
  const want = exerciseCount(profile.durationMin);
  const slots = slotsFor(focus, want);
  const picked: Exercise[] = [];
  const taken = new Set<string>();
  const usedOfSlot = new Map<Slot, number>();

  for (const slot of slots) {
    const used = usedOfSlot.get(slot) ?? 0;
    const hit =
      pickForSlot(slot, pool, taken, used, recent, profile, nonce) ??
      fallbackForFocus(focus, pool, taken);
    if (!hit) continue;
    picked.push(hit);
    taken.add(hit.id);
    usedOfSlot.set(slot, used + 1);
  }

  if (picked.length === 0) {
    picked.push(...pool.filter((ex) => ex.mechanic === "compound").slice(0, want));
  }

  const title = workoutTitle(profile, focus);

  return {
    id: uid(),
    title,
    focus,
    date: todayISO(now),
    startedAt: null,
    finishedAt: null,
    durationSec: 0,
    exercises: picked.map((ex) => {
      const built = buildSets(profile, history, ex);
      return {
        instanceId: uid(),
        exerciseId: ex.id,
        sets: built.sets,
        restSec: built.restSec,
        notes: "",
        setStyle: "normal",
      } satisfies SessionExercise;
    }),
  };
}

function workoutTitle(profile: Profile, focus: Focus): string {
  const g =
    profile.goal === "strength"
      ? "Strength"
      : profile.goal === "muscle"
        ? "Hypertrophy"
        : profile.goal === "power"
          ? "Power"
          : "Training";
  return `${FOCUS_LABEL[focus]} ${g}`;
}

export function alternatives(
  profile: Profile,
  exerciseId: string,
  history: WorkoutSession[],
): Exercise[] {
  const current = getExercise(exerciseId);
  const pool = available(profile).filter((ex) => ex.id !== exerciseId);
  const sameFamily =
    isCore(current)
      ? pool.filter(isCore)
      : pool.filter((ex) => ex.primary === current.primary);
  return sameFamily
    .sort((a, b) => recentBonus(history, a.id) - recentBonus(history, b.id))
    .slice(0, 8);
}

function recentBonus(history: WorkoutSession[], id: string): number {
  const idx = history.findIndex((w) => w.exercises.some((e) => e.exerciseId === id));
  return idx === -1 ? 99 : idx;
}

export function estimated1RM(history: WorkoutSession[], exerciseId: string): number {
  let best = 0;
  for (const w of history) {
    const item = w.exercises.find((e) => e.exerciseId === exerciseId);
    if (!item) continue;
    for (const s of item.sets) {
      if (!s.completed || s.warmup || s.weight <= 0) continue;
      best = Math.max(best, epley1RM(s.weight, s.reps));
    }
  }
  return best;
}

export function isPersonalRecord(
  history: WorkoutSession[],
  exerciseId: string,
  weight: number,
  reps: number,
): boolean {
  if (weight <= 0) return false;
  const est = epley1RM(weight, reps);
  return est > estimated1RM(history, exerciseId) + 0.5;
}
