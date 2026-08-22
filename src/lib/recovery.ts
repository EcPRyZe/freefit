import { getExercise } from "./exercises";
import { parseISODate } from "./format";
import {
  MUSCLES,
  type Focus,
  type Muscle,
  type WorkoutSession,
} from "./types";

const BASE_HOURS: Record<Muscle, number> = {
  chest: 72,
  frontDelts: 60,
  sideDelts: 48,
  rearDelts: 48,
  biceps: 48,
  triceps: 48,
  forearms: 36,
  traps: 48,
  lats: 72,
  upperBack: 60,
  lowerBack: 72,
  abs: 36,
  obliques: 36,
  quads: 72,
  hamstrings: 72,
  glutes: 60,
  adductors: 48,
  calves: 36,
  neck: 36,
};

export type RecoveryMap = Record<Muscle, number>;

export function computeRecovery(
  history: WorkoutSession[],
  now = new Date(),
): RecoveryMap {
  const lastHit = {} as Record<Muscle, { at: number; load: number }>;
  for (const m of MUSCLES) lastHit[m] = { at: 0, load: 0 };

  for (const session of history) {
    if (!session.finishedAt) continue;
    const when = session.finishedAt;
    for (const item of session.exercises) {
      const ex = getExercise(item.exerciseId);
      const working = item.sets.filter((s) => s.completed && !s.warmup);
      if (working.length === 0) continue;
      const load = working.reduce((a, s) => a + s.reps, 0);
      const targets: Muscle[] = [ex.primary, ...ex.secondary];
      targets.forEach((m, i) => {
        const impact = i === 0 ? load : load * 0.45;
        const prev = lastHit[m];
        if (!prev.at || when > prev.at) {
          lastHit[m] = { at: when, load: impact };
        } else if (when === prev.at) {
          prev.load += impact;
        }
      });
    }
  }

  const out = {} as RecoveryMap;
  const nowMs = now.getTime();
  for (const m of MUSCLES) {
    const hit = lastHit[m];
    if (!hit.at) {
      out[m] = 100;
      continue;
    }
    const hours = (nowMs - hit.at) / 3_600_000;
    const volumeFactor = Math.min(1.35, 0.75 + hit.load / 80);
    const need = BASE_HOURS[m] * volumeFactor;
    out[m] = Math.max(0, Math.min(100, (hours / need) * 100));
  }
  return out;
}

export function averageRecovery(map: RecoveryMap, muscles: Muscle[]): number {
  if (muscles.length === 0) return 100;
  return muscles.reduce((a, m) => a + map[m], 0) / muscles.length;
}

export function daysSinceFocus(
  history: WorkoutSession[],
  focus: Focus,
  now = new Date(),
): number {
  const latest = history.find((s) => s.finishedAt && s.focus === focus);
  if (!latest) return 14;
  const then = parseISODate(latest.date).getTime();
  return Math.max(0, (now.getTime() - then) / 86_400_000);
}

/** Interpolate sore → mid → fresh. */
export function recoveryColor(pct: number): string {
  const t = Math.max(0, Math.min(1, pct / 100));
  if (t < 0.45) {
    return mix("#e5484d", "#f5a524", t / 0.45);
  }
  return mix("#f5a524", "#3ddc97", (t - 0.45) / 0.55);
}

function mix(a: string, b: string, t: number): string {
  const ca = hex(a);
  const cb = hex(b);
  const u = Math.max(0, Math.min(1, t));
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * u);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * u);
  const bch = Math.round(ca[2] + (cb[2] - ca[2]) * u);
  return `rgb(${r} ${g} ${bch})`;
}

function hex(h: string): [number, number, number] {
  const n = h.replace("#", "");
  return [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16),
  ];
}

export function recoveryLabel(pct: number): string {
  if (pct >= 85) return "Fresh";
  if (pct >= 65) return "Ready";
  if (pct >= 40) return "Recovering";
  return "Sore";
}
