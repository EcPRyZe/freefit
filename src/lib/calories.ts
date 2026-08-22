import { getExercise } from "./exercises";
import type { Exercise, Profile, SessionExercise, WorkoutSession } from "./types";

/** Mifflin–St Jeor resting metabolic rate, kcal/day. */
export function mifflinBmr(profile: Profile): number {
  const kg = profile.bodyweightLb * 0.45359237;
  const cm = profile.heightIn * 2.54;
  const sex = profile.sex === "female" ? -161 : 5;
  return Math.max(800, 10 * kg + 6.25 * cm - 5 * profile.age + sex);
}

export function metFor(ex: Exercise): number {
  if (ex.met && ex.met > 0) return ex.met;
  if (ex.bodyweight && ex.mechanic === "compound") return 8;
  if (ex.mechanic === "compound") return 6;
  if (ex.primary === "abs" || ex.primary === "obliques") return 4.5;
  return 5;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function workingSets(item: SessionExercise) {
  const done = item.sets.filter((s) => s.completed && !s.warmup);
  return done.length ? done : item.sets.filter((s) => !s.warmup);
}

/** Compendium-style MET, bumped when the load is heavy for the lifter. */
function itemMet(item: SessionExercise, profile: Profile): number {
  const ex = getExercise(item.exerciseId);
  let met = metFor(ex);
  const working = workingSets(item);
  if (!working.length || ex.bodyweight) return met;
  const avgW = working.reduce((a, s) => a + s.weight, 0) / working.length;
  const rel = avgW / Math.max(80, profile.bodyweightLb);
  if (ex.mechanic === "compound") met += clamp((rel - 0.35) * 2.2, 0, 2.2);
  else met += clamp((rel - 0.12) * 3, 0, 1.5);
  return met;
}

function setTiming(item: SessionExercise): { work: number; rest: number; sets: number } {
  const ex = getExercise(item.exerciseId);
  const sets = item.sets.length || workingSets(item).length || 1;
  const work = ex.mechanic === "compound" ? 40 : 28;
  const rest = item.restSec > 0 ? item.restSec : ex.mechanic === "compound" ? 90 : 60;
  return { work, rest, sets };
}

/** Gym-session length like Fitbod: sets × (work + rest), never shorter than a plausible clock. */
export function sessionMinutes(session: WorkoutSession): number {
  let sec = 0;
  for (const item of session.exercises) {
    const { work, rest, sets } = setTiming(item);
    sec += sets * work + Math.max(0, sets - 1) * rest;
  }
  if (session.exercises.length > 1) sec += (session.exercises.length - 1) * 40;
  const estimated = sec / 60;
  const clock = session.durationSec > 0 ? session.durationSec / 60 : 0;
  if (clock >= estimated * 0.75) return Math.max(Math.min(clock, estimated * 1.35), 8);
  return Math.max(estimated, clock, 12);
}

/** Keytel 2005 — kcal from average HR, weight, age, sex. */
export function keytelKcal(profile: Profile, bpm: number, minutes: number): number {
  const kg = profile.bodyweightLb * 0.45359237;
  const hr = clamp(bpm, 70, 220);
  const kjMin =
    profile.sex === "female"
      ? -20.4022 + 0.4472 * hr - 0.1263 * kg + 0.074 * profile.age
      : -55.0969 + 0.6309 * hr + 0.1988 * kg + 0.2017 * profile.age;
  return Math.max(1, Math.round((kjMin / 4.184) * Math.max(minutes, 1)));
}

/**
 * ACSM kcal = MET × 3.5 × kg × min / 200, individualized with Mifflin
 * (age/sex/height) and a modest volume bump so heavy days outrun pump work.
 * When average heart rate is on the session, Keytel 2005 replaces MET
 * (that's the wearable path Fitbod uses).
 */
export function estimateKcal(session: WorkoutSession, profile: Profile): number {
  const minutes = sessionMinutes(session);
  if (session.avgHr && session.avgHr >= 80) {
    return keytelKcal(profile, session.avgHr, minutes);
  }
  const kg = profile.bodyweightLb * 0.45359237;
  const parts = session.exercises.map((item) => ({
    met: itemMet(item, profile),
    sets: Math.max(1, item.sets.length),
    volume: workingSets(item).reduce((a, s) => a + s.weight * s.reps, 0),
  }));
  const totalSets = parts.reduce((a, p) => a + p.sets, 0);

  if (totalSets === 0) {
    return Math.max(1, Math.round((5 * 3.5 * kg * Math.max(minutes, 8)) / 200));
  }

  const avgMet = parts.reduce((a, p) => a + p.met * p.sets, 0) / totalSets;
  const acsm = (avgMet * 3.5 * kg * minutes) / 200;
  const rmrAdj = clamp(mifflinBmr(profile) / (24 * kg), 0.88, 1.12);
  const volumeLb = parts.reduce((a, p) => a + p.volume, 0);
  const volAdj = 1 + clamp(volumeLb / (profile.bodyweightLb * 90), 0, 0.22);
  return Math.max(1, Math.round(acsm * rmrAdj * volAdj));
}

export function exerciseKcal(
  item: SessionExercise,
  profile: Profile,
  session: WorkoutSession,
): number {
  const total = estimateKcal(session, profile);
  const parts = session.exercises.map((it) => {
    const { sets } = setTiming(it);
    return itemMet(it, profile) * Math.max(1, sets);
  });
  const sum = parts.reduce((a, n) => a + n, 0) || 1;
  const idx = session.exercises.findIndex((it) => it.instanceId === item.instanceId);
  return Math.round(((parts[idx] ?? 0) / sum) * total);
}
