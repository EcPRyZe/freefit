import { catalog, getExercise } from "./exercises";
import { epley1RM, roundTo, todayISO, uid } from "./format";
import {
  isCorePattern,
  isSpinalLoad,
  patternOf,
  pressAngle,
  qualityScore,
  type Pattern,
} from "./patterns";
import {
  averageRecovery,
  computeRecovery,
  daysSinceFocus,
} from "./recovery";
import type {
  Exercise,
  Focus,
  LoggedSet,
  Profile,
  SessionExercise,
  WorkoutSession,
} from "./types";
import { FOCUS_LABEL, FOCUS_MUSCLES } from "./types";

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
      ? { sets: 4, reps: 8, rest: 120 }
      : { sets: 3 + expBonus, reps: 12, rest: 75 };
  }
  if (profile.goal === "power") {
    return compound
      ? { sets: 5, reps: 3, rest: 180 }
      : { sets: 3, reps: 6, rest: 90 };
  }
  return compound
    ? { sets: 3 + expBonus, reps: 8, rest: 120 }
    : { sets: 3, reps: 10, rest: 75 };
}

export function lastLoggedExercise(
  history: WorkoutSession[],
  exerciseId: string,
): SessionExercise | null {
  for (const w of history) {
    const item = w.exercises.find((e) => e.exerciseId === exerciseId);
    if (!item) continue;
    if (item.sets.some((s) => !s.warmup && s.completed)) return item;
  }
  return null;
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

/** Typical training load: the working weight they actually used, not a catalog default. */
export function typicalLoad(sets: LoggedSet[]): { weight: number; reps: number } | null {
  const working = sets.filter((s) => !s.warmup && s.weight > 0);
  if (!working.length) return null;
  const counts = new Map<number, number>();
  for (const s of working) counts.set(s.weight, (counts.get(s.weight) ?? 0) + 1);
  let weight = working[0].weight;
  let best = 0;
  for (const [w, n] of counts) {
    if (n > best || (n === best && w > weight)) {
      weight = w;
      best = n;
    }
  }
  const atWeight = working.filter((s) => s.weight === weight);
  const reps = atWeight[0]?.reps ?? working[0].reps;
  return { weight, reps };
}

function musclesOf(exerciseId: string): Set<string> {
  const ex = getExercise(exerciseId);
  return new Set([ex.primary, ...ex.secondary]);
}

/**
 * 0–15% reduction when earlier lifts in this session overlap and were heavy or
 * already a grind. First lift stays at last working weight.
 */
export function sessionFatigue(
  history: WorkoutSession[],
  exerciseId: string,
  prior: SessionExercise[],
): number {
  const target = musclesOf(exerciseId);
  let f = 0;
  let priorCompounds = 0;
  for (const item of prior) {
    const ex = getExercise(item.exerciseId);
    const overlap = [ex.primary, ...ex.secondary].some((m) => target.has(m));
    if (ex.mechanic === "compound") priorCompounds += 1;

    const last = lastWorkingSets(history, item.exerciseId);
    const typical = last ? typicalLoad(last) : null;
    const prescribed = item.sets.find((s) => !s.warmup);
    const heavy =
      typical && prescribed && typical.weight > 0 && prescribed.weight >= typical.weight * 0.92;

    const done = item.sets.filter((s) => s.completed && !s.warmup);
    const targetReps = prescribed?.reps ?? 0;
    const grind =
      done.some((s) => targetReps > 0 && s.reps <= targetReps - 2) ||
      done.some((s, i, arr) => i > 0 && s.weight + 0.5 < arr[0].weight);

    if (overlap && ex.mechanic === "compound") f += 0.04;
    else if (overlap) f += 0.015;
    if (overlap && heavy) f += 0.03;
    if (grind) f += 0.05;
  }
  if (priorCompounds >= 3) f += 0.03;
  return Math.min(0.15, f);
}

export function recommendWeightLb(
  profile: Profile,
  history: WorkoutSession[],
  exerciseId: string,
  prior: SessionExercise[] = [],
): number {
  const ex = getExercise(exerciseId);
  const last = lastWorkingSets(history, exerciseId);
  const { reps } = scheme(profile, ex);
  const fatigue = sessionFatigue(history, exerciseId, prior);

  if (ex.bodyweight) {
    const typical = last ? typicalLoad(last) : null;
    return typical ? typical.weight : 0;
  }

  if (!last) {
    const exp =
      profile.experience === "beginner" ? 0.7 : profile.experience === "advanced" ? 1.2 : 1;
    return roundTo(ex.defaultWeightLb * exp * (1 - fatigue), ex.incrementLb);
  }

  const typical = typicalLoad(last) ?? { weight: last[0].weight, reps: last[0].reps };
  const rpe = lastLoggedExercise(history, exerciseId)?.rpe;
  const held = last
    .filter((s) => !s.warmup && s.completed)
    .every((s) => s.weight >= typical.weight - 0.5 && s.reps >= reps);
  let weight = typical.weight;
  const grind = rpe != null && rpe >= 9;
  if (held && !grind) weight += ex.incrementLb;
  weight *= 1 - fatigue;
  const floor = typical.weight * (1 - Math.max(fatigue, grind ? 0 : 0.05));
  return roundTo(Math.max(weight, floor), ex.incrementLb);
}

function buildSets(
  profile: Profile,
  history: WorkoutSession[],
  ex: Exercise,
  prior: SessionExercise[] = [],
): { sets: LoggedSet[]; restSec: number } {
  const { sets: n, reps, rest } = scheme(profile, ex);
  const weight = recommendWeightLb(profile, history, ex.id, prior);
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

export function prescribeExercise(
  profile: Profile,
  history: WorkoutSession[],
  exerciseId: string,
  prior: SessionExercise[] = [],
): { sets: LoggedSet[]; restSec: number } {
  return buildSets(profile, history, getExercise(exerciseId), prior);
}

/** Re-apply last-session loads (and fatigue) to a planned/active session. */
export function prescribeSession(
  session: WorkoutSession,
  profile: Profile,
  history: WorkoutSession[],
): WorkoutSession {
  const prior: SessionExercise[] = [];
  const exercises = session.exercises.map((item) => {
    const built = buildSets(profile, history, getExercise(item.exerciseId), prior);
    const wantWork = Math.max(1, item.sets.filter((s) => !s.warmup).length);
    const builtWork = built.sets.filter((s) => !s.warmup);
    const builtWarm = built.sets.filter((s) => s.warmup);
    const proto = builtWork[0] ?? {
      weight: 0,
      reps: 10,
      completed: false,
      warmup: false,
    };
    const working = Array.from({ length: wantWork }, (_, i) => ({
      ...(builtWork[i] ?? proto),
      completed: false,
      warmup: false,
    }));
    const next: SessionExercise = {
      ...item,
      sets: [...builtWarm, ...working],
      restSec: built.restSec,
    };
    prior.push(next);
    return next;
  });
  return { ...session, exercises };
}

function exerciseCount(durationMin: number): number {
  if (durationMin <= 30) return 4;
  if (durationMin <= 45) return 5;
  if (durationMin <= 60) return 6;
  if (durationMin <= 75) return 7;
  return 8;
}

/**
 * Pattern templates. Compounds first. Push = horizontal + vertical press
 * (Helms / Israetel PPL). Pull = vertical + horizontal pull + face-pulls.
 * Legs = squat, then hinge, then unilateral — one axial-load pattern, not two.
 */
type Slot = Pattern | "core";

function slotsFor(focus: Focus, want: number): Slot[] {
  const table: Record<Focus, Slot[][]> = {
    push: [
      ["hPress", "vPress", "elbowExt", "core"],
      ["hPress", "vPress", "raise", "elbowExt", "core"],
      ["hPress", "vPress", "fly", "raise", "elbowExt", "core"],
      ["hPress", "vPress", "fly", "raise", "elbowExt", "elbowExt", "core"],
      ["hPress", "vPress", "hPress", "fly", "raise", "elbowExt", "elbowExt", "core"],
    ],
    pull: [
      ["vPull", "hPull", "elbowFlex", "core"],
      ["vPull", "hPull", "rearDelt", "elbowFlex", "core"],
      ["vPull", "hPull", "latIso", "rearDelt", "elbowFlex", "core"],
      ["vPull", "hPull", "hPull", "rearDelt", "elbowFlex", "elbowFlex", "core"],
      ["vPull", "hPull", "hPull", "latIso", "rearDelt", "elbowFlex", "elbowFlex", "core"],
    ],
    legs: [
      ["squat", "hinge", "plantarf", "core"],
      ["squat", "hinge", "kneeFlex", "plantarf", "core"],
      ["squat", "hinge", "lunge", "kneeFlex", "plantarf", "core"],
      ["squat", "hinge", "lunge", "kneeFlex", "plantarf", "core"],
      ["squat", "hinge", "lunge", "hipExt", "kneeFlex", "plantarf", "core", "core"],
    ],
    upper: [
      ["hPress", "vPull", "vPress", "elbowFlex"],
      ["hPress", "vPull", "vPress", "elbowExt", "core"],
      ["hPress", "vPull", "vPress", "hPull", "elbowExt", "elbowFlex"],
      ["hPress", "vPull", "vPress", "hPull", "elbowExt", "elbowFlex", "core"],
      ["hPress", "vPull", "vPress", "hPull", "raise", "elbowExt", "elbowFlex", "core"],
    ],
    full: [
      ["squat", "hPress", "vPull", "core"],
      ["squat", "hPress", "vPull", "hinge", "core"],
      ["squat", "hPress", "vPull", "hinge", "vPress", "core"],
      ["squat", "hPress", "vPull", "hinge", "vPress", "elbowFlex", "core"],
      ["squat", "hPress", "vPull", "hinge", "vPress", "elbowExt", "elbowFlex", "core"],
    ],
  };
  const idx = Math.min(Math.max(want, 4), 8) - 4;
  return table[focus][idx];
}

function matchesSlot(ex: Exercise, slot: Slot): boolean {
  const p = patternOf(ex);
  if (slot === "core") return isCorePattern(p);
  return p === slot;
}

const SLOT_FALLBACK: Partial<Record<Slot, Pattern[]>> = {
  fly: ["hPress"],
  latIso: ["vPull"],
  lunge: ["kneeExt", "squat"],
  kneeFlex: ["hinge"],
  hipExt: ["hinge"],
  raise: ["vPress"],
  rearDelt: ["hPull"],
  core: ["antiExt", "antiRot", "trunkFlx"],
};

function pickForSlot(slot: Slot, pool: Exercise[], ctx: PickCtx): Exercise | undefined {
  const trySlot = (s: Slot) => {
    const ranked = pool
      .filter((ex) => !ctx.taken.has(ex.id) && matchesSlot(ex, s))
      .map((ex) => ({ ex, score: scoreCandidate(ex, slot, ctx) }))
      .sort((a, b) => b.score - a.score);
    return ranked[0]?.ex;
  };
  const direct = trySlot(slot);
  if (direct) return direct;
  for (const alt of SLOT_FALLBACK[slot] ?? []) {
    const hit = trySlot(alt);
    if (hit) return hit;
  }
  return undefined;
}

interface PickCtx {
  taken: Set<string>;
  patterns: Pattern[];
  angles: Set<string>;
  spinal: boolean;
  recent: Set<string>;
  profile: Profile;
  nonce: number;
}

function scoreCandidate(ex: Exercise, slot: Slot, ctx: PickCtx): number {
  const p = patternOf(ex);
  let score = qualityScore(ex);
  score += (ctx.profile.exerciseBias[ex.id] ?? 0) * 32;
  if (ctx.recent.has(ex.id)) score -= 28;

  if (slot === "core") {
    if (p === "antiExt") score += 18;
    else if (p === "antiRot") score += 14;
    else score += 4;
  } else if (slot === "fly") {
    score += p === "fly" ? 22 : 4;
  } else if (slot === "latIso") {
    score += p === "latIso" ? 20 : 6;
  } else if (slot === "lunge") {
    score += p === "lunge" ? 24 : 2;
  } else if (slot === "raise") {
    score += p === "raise" ? 20 : -40;
  }

  if (p === "frontRaise") score -= 40;

  if (slot === "hPress" || slot === "fly") {
    const angle = pressAngle(ex);
    if (ctx.angles.has(angle) && p === "hPress") score -= 22;
    if (angle === "decline" && ctx.angles.size === 0) score -= 12;
  }

  if ((p === "hPress" || p === "vPress") && ctx.patterns.includes(p) && slot !== "fly") {
    score -= 16;
  }

  if (ctx.spinal && isSpinalLoad(ex)) score -= 30;

  const n = `${ex.id} ${ex.name}`.toLowerCase();
  if (slot === "hinge" && ctx.patterns.includes("squat")) {
    if (/rdl|romanian|good morning/.test(n)) score += 16;
    if (/trap bar/.test(n)) score -= 18;
  }

  score += (hashPick(ex.id, ctx.nonce) % 11) - 5;
  return score;
}

function fallbackForFocus(focus: Focus, pool: Exercise[], ctx: PickCtx): Exercise | undefined {
  const allowed = new Set(FOCUS_MUSCLES[focus]);
  return pool.find((ex) => {
    if (ctx.taken.has(ex.id)) return false;
    if (patternOf(ex) === "frontRaise") return false;
    return allowed.has(ex.primary) || isCorePattern(patternOf(ex));
  });
}

function commit(ex: Exercise, ctx: PickCtx, picked: Exercise[]) {
  picked.push(ex);
  ctx.taken.add(ex.id);
  const p = patternOf(ex);
  ctx.patterns.push(p);
  if (p === "hPress") ctx.angles.add(pressAngle(ex));
  if (isSpinalLoad(ex)) ctx.spinal = true;
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
  const ctx: PickCtx = {
    taken: new Set(),
    patterns: [],
    angles: new Set(),
    spinal: false,
    recent,
    profile,
    nonce,
  };

  for (const slot of slots) {
    const hit = pickForSlot(slot, pool, ctx) ?? fallbackForFocus(focus, pool, ctx);
    if (!hit) continue;
    commit(hit, ctx, picked);
  }

  if (picked.length === 0) {
    picked.push(...pool.filter((ex) => ex.mechanic === "compound").slice(0, want));
  }

  const exercises: SessionExercise[] = [];
  for (const ex of picked) {
    const built = buildSets(profile, history, ex, exercises);
    exercises.push({
      instanceId: uid(),
      exerciseId: ex.id,
      sets: built.sets,
      restSec: built.restSec,
      notes: "",
      setStyle: "normal",
    });
  }

  return {
    id: uid(),
    title: workoutTitle(profile, focus),
    focus,
    date: todayISO(now),
    startedAt: null,
    finishedAt: null,
    durationSec: 0,
    exercises: assignGroups(exercises, profile),
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
  const pat = patternOf(current);
  const sameFamily = isCorePattern(pat)
    ? pool.filter((ex) => isCorePattern(patternOf(ex)))
    : pool.filter((ex) => patternOf(ex) === pat || ex.primary === current.primary);
  return sameFamily
    .sort((a, b) => recentBonus(history, a.id) - recentBonus(history, b.id))
    .slice(0, 8);
}

function recentBonus(history: WorkoutSession[], id: string): number {
  const idx = history.findIndex((w) => w.exercises.some((e) => e.exerciseId === id));
  return idx === -1 ? 99 : idx;
}

export function targetRepsFor(profile: Profile, exerciseId: string): number {
  return scheme(profile, getExercise(exerciseId)).reps;
}

export function hitRepRange(item: SessionExercise, targetReps: number): boolean {
  const working = item.sets.filter((s) => !s.warmup && s.completed);
  if (!working.length) return false;
  return working.every((s) => s.reps >= targetReps);
}

export function loadCue(
  profile: Profile,
  history: WorkoutSession[],
  exerciseId: string,
): string | null {
  const ex = getExercise(exerciseId);
  if (ex.bodyweight) return null;
  const last = lastWorkingSets(history, exerciseId);
  if (!last) return null;
  const rpe = lastLoggedExercise(history, exerciseId)?.rpe;
  const target = scheme(profile, ex).reps;
  const hit = last.every((s) => s.reps >= target);
  const step = profile.units === "kg" ? (ex.incrementLb >= 5 ? "2.5 kg" : "1 kg") : `${ex.incrementLb} lb`;
  if (rpe != null && rpe >= 9) return `Last session was a grind (RPE ${rpe}). Holding weight.`;
  if (hit) return `You hit the range — adding ${step} next time.`;
  return null;
}

export function progressionToast(
  profile: Profile,
  item: SessionExercise,
): string | null {
  const ex = getExercise(item.exerciseId);
  const target = scheme(profile, ex).reps;
  if (!hitRepRange(item, target)) return null;
  if (ex.bodyweight) return "You hit the range — add a rep next time.";
  const step = profile.units === "kg" ? (ex.incrementLb >= 5 ? "2.5 kg" : "1 kg") : `${ex.incrementLb} lb`;
  return `You hit the range — adding ${step} next time.`;
}

function pairable(ex: Exercise): boolean {
  const p = patternOf(ex);
  if (isCorePattern(p)) return true;
  if (ex.mechanic === "isolation") return true;
  return false;
}

function overlapCount(a: Exercise, b: Exercise): number {
  const set = new Set([a.primary, ...a.secondary]);
  return [b.primary, ...b.secondary].filter((m) => set.has(m)).length;
}

function assignGroups(items: SessionExercise[], profile: Profile): SessionExercise[] {
  if (!profile.allowSupersets && !profile.allowCircuits) return items;
  const next = items.map((e) => ({ ...e }));
  const used = new Set<string>();

  const idxs = next
    .map((e, i) => ({ e, i, ex: getExercise(e.exerciseId) }))
    .filter((x) => pairable(x.ex));

  if (profile.allowSupersets) {
    for (let a = 0; a < idxs.length; a++) {
      if (used.has(idxs[a].e.instanceId)) continue;
      for (let b = a + 1; b < idxs.length; b++) {
        if (used.has(idxs[b].e.instanceId)) continue;
        if (overlapCount(idxs[a].ex, idxs[b].ex) > 1) continue;
        if (idxs[a].ex.primary === idxs[b].ex.primary) continue;
        const id = uid();
        next[idxs[a].i] = { ...next[idxs[a].i], groupId: id, groupKind: "superset" };
        next[idxs[b].i] = { ...next[idxs[b].i], groupId: id, groupKind: "superset" };
        used.add(idxs[a].e.instanceId);
        used.add(idxs[b].e.instanceId);
        break;
      }
    }
  }

  if (profile.allowCircuits) {
    const leftover = idxs.filter((x) => !used.has(x.e.instanceId));
    if (leftover.length >= 3) {
      const take = leftover.slice(0, 3);
      const id = uid();
      for (const x of take) {
        next[x.i] = { ...next[x.i], groupId: id, groupKind: "circuit" };
        used.add(x.e.instanceId);
      }
    }
  }

  const seen = new Set<string>();
  const clustered: SessionExercise[] = [];
  for (const item of next) {
    if (!item.groupId) {
      clustered.push(item);
      continue;
    }
    if (seen.has(item.groupId)) continue;
    seen.add(item.groupId);
    clustered.push(...next.filter((x) => x.groupId === item.groupId));
  }
  return clustered;
}

export function groupTag(
  exercises: SessionExercise[],
  instanceId: string,
): { kind: "superset" | "circuit"; tag: string } | null {
  const item = exercises.find((e) => e.instanceId === instanceId);
  if (!item?.groupId || !item.groupKind) return null;
  const ids: string[] = [];
  for (const e of exercises) {
    if (e.groupId && !ids.includes(e.groupId)) ids.push(e.groupId);
  }
  const letter = String.fromCharCode(65 + Math.max(0, ids.indexOf(item.groupId)));
  const members = exercises.filter((e) => e.groupId === item.groupId);
  const n = members.findIndex((e) => e.instanceId === instanceId) + 1;
  return { kind: item.groupKind, tag: `${letter}${n}` };
}

/** Seconds of rest after this set, or null for no timer. */
export function restAfterSet(
  session: WorkoutSession,
  instanceId: string,
  setIndex: number,
): number | null {
  const item = session.exercises.find((e) => e.instanceId === instanceId);
  if (!item) return null;
  const hasMoreOnThis = item.sets.slice(setIndex + 1).some((s) => !s.completed);
  if (!item.groupId) return hasMoreOnThis ? item.restSec : null;

  const workDone = item.sets.slice(0, setIndex + 1).filter((s) => !s.warmup).length;
  const partners = session.exercises.filter((e) => e.groupId === item.groupId);
  const waiting = partners.some((p) => {
    if (p.instanceId === instanceId) return false;
    return p.sets.filter((s) => !s.warmup && s.completed).length < workDone;
  });
  if (waiting) return item.groupKind === "circuit" ? 10 : 15;
  const moreInGroup = partners.some((p) => p.sets.some((s) => !s.completed));
  return moreInGroup ? item.restSec : null;
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
