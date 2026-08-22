import { getExercise } from "./exercises";
import { epley1RM, parseISODate, todayISO, volumeOf } from "./format";
import type { Profile, WorkoutSession } from "./types";

export function weekStart(d = new Date()): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function workoutsThisWeek(history: WorkoutSession[], now = new Date()): number {
  const start = weekStart(now).getTime();
  return history.filter((w) => w.finishedAt && w.finishedAt >= start).length;
}

export function volumeThisWeek(history: WorkoutSession[], now = new Date()): number {
  const start = weekStart(now).getTime();
  let vol = 0;
  for (const w of history) {
    if (!w.finishedAt || w.finishedAt < start) continue;
    vol += sessionVolume(w);
  }
  return vol;
}

export function sessionVolume(w: WorkoutSession): number {
  let vol = 0;
  for (const ex of w.exercises) {
    for (const s of ex.sets) {
      if (s.completed && !s.warmup) vol += volumeOf(s.weight, s.reps);
    }
  }
  return vol;
}

export function sessionSets(w: WorkoutSession): number {
  return w.exercises.reduce(
    (a, e) => a + e.sets.filter((s) => s.completed && !s.warmup).length,
    0,
  );
}

export function currentStreak(history: WorkoutSession[], now = new Date()): number {
  const days = new Set(history.filter((w) => w.finishedAt).map((w) => w.date));
  let streak = 0;
  let cursor = new Date(now);
  if (!days.has(todayISO(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let gaps = 0;
  for (let i = 0; i < 60; i++) {
    const iso = todayISO(cursor);
    if (days.has(iso)) {
      streak += 1;
      gaps = 0;
    } else {
      gaps += 1;
      if (gaps > 1) break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface PersonalRecord {
  exerciseId: string;
  name: string;
  weight: number;
  reps: number;
  e1rm: number;
  date: string;
}

export function personalRecords(history: WorkoutSession[]): PersonalRecord[] {
  const best = new Map<string, PersonalRecord>();
  for (const w of [...history].reverse()) {
    for (const item of w.exercises) {
      const ex = getExercise(item.exerciseId);
      for (const s of item.sets) {
        if (!s.completed || s.warmup || s.weight <= 0) continue;
        const e1rm = epley1RM(s.weight, s.reps);
        const prev = best.get(item.exerciseId);
        if (!prev || e1rm > prev.e1rm) {
          best.set(item.exerciseId, {
            exerciseId: item.exerciseId,
            name: ex.name,
            weight: s.weight,
            reps: s.reps,
            e1rm,
            date: w.date,
          });
        }
      }
    }
  }
  return [...best.values()].sort((a, b) => b.e1rm - a.e1rm);
}

export function trainedToday(history: WorkoutSession[], now = new Date()): boolean {
  const iso = todayISO(now);
  return history.some((w) => w.date === iso && w.finishedAt);
}

export function monthDays(year: number, month: number): { iso: string; inMonth: boolean }[] {
  const first = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7;
  const days: { iso: string; inMonth: boolean }[] = [];
  const cursor = new Date(year, month, 1 - startDow);
  for (let i = 0; i < 42; i++) {
    days.push({
      iso: todayISO(cursor),
      inMonth: cursor.getMonth() === month,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function historyByDate(history: WorkoutSession[]): Map<string, WorkoutSession[]> {
  const map = new Map<string, WorkoutSession[]>();
  for (const w of history) {
    if (!w.finishedAt) continue;
    const list = map.get(w.date) ?? [];
    list.push(w);
    map.set(w.date, list);
  }
  return map;
}

export function weeklyVolumeSeries(
  history: WorkoutSession[],
  weeks = 8,
  now = new Date(),
): { label: string; volume: number }[] {
  const out: { label: string; volume: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const start = weekStart(end);
    const startMs = start.getTime();
    const endMs = startMs + 7 * 86_400_000;
    let volume = 0;
    for (const w of history) {
      if (w.finishedAt && w.finishedAt >= startMs && w.finishedAt < endMs) {
        volume += sessionVolume(w);
      }
    }
    out.push({
      label: start.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      volume: Math.round(volume),
    });
  }
  return out;
}

export function exerciseHistoryPoints(
  history: WorkoutSession[],
  exerciseId: string,
): { date: string; weight: number; e1rm: number; reps: number }[] {
  const points: { date: string; weight: number; e1rm: number; reps: number }[] = [];
  for (const w of [...history].reverse()) {
    const item = w.exercises.find((e) => e.exerciseId === exerciseId);
    if (!item) continue;
    const working = item.sets.filter((s) => s.completed && !s.warmup);
    if (!working.length) continue;
    const top = working.reduce((a, s) => {
      const ae = epley1RM(a.weight, a.reps);
      const se = epley1RM(s.weight, s.reps);
      if (s.weight === 0 && a.weight === 0) return s.reps > a.reps ? s : a;
      return se > ae ? s : a;
    });
    points.push({
      date: w.date,
      weight: top.weight,
      reps: top.reps,
      e1rm: Math.round(epley1RM(top.weight, top.reps)),
    });
  }
  return points;
}

export function trainedExerciseIds(history: WorkoutSession[]): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const w of history) {
    for (const e of w.exercises) {
      if (seen.has(e.exerciseId)) continue;
      if (!e.sets.some((s) => s.completed && !s.warmup)) continue;
      seen.add(e.exerciseId);
      ids.push(e.exerciseId);
    }
  }
  return ids;
}

export function weeklyTargetMet(history: WorkoutSession[], profile: Profile, now = new Date()): boolean {
  return workoutsThisWeek(history, now) >= profile.workoutsPerWeek;
}

export { parseISODate };
