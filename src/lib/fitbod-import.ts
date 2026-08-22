import { catalog } from "./exercises";
import { kgToLb, roundTo, todayISO, uid } from "./format";
import { FOCUS_LABEL, FOCUS_MUSCLES, type Equipment, type Exercise, type Focus, type Muscle, type WorkoutSession } from "./types";

const CARDIO = new Set([
  "hiking",
  "elliptical",
  "running",
  "walking",
  "stair stepper",
  "running treadmill",
]);

/** Fitbod names → FreeFit catalog ids. Only exact-same movements. */
const ALIAS: Record<string, string> = {
  "barbell bench press": "bb-bench",
  "barbell incline bench press": "inc-bb-bench",
  "dumbbell bench press": "db-bench",
  "dumbbell incline bench press": "inc-db-press",
  "incline dumbbell press": "inc-db-press",
  "dumbbell fly": "db-fly",
  "cable crossover fly": "cable-crossover",
  "cable fly": "cable-fly",
  "machine fly": "pec-deck",
  "smith machine bench press": "smith-bench",
  "hammerstrength chest press": "chest-press-machine",
  "hammerstrength incline chest press": "chest-press-machine",
  "dip": "chest-dip",
  "lat pulldown": "lat-pd",
  "wide grip lat pulldown": "wide-pulldown",
  "cable row": "seated-row",
  "machine row": "machine-row",
  "dumbbell row": "db-row",
  "pull up": "pull-up",
  "neutral grip pull up": "neutral-pullup",
  "hammerstrength high row": "hs-high-row",
  "hammerstrength iso row": "chest-supported-row",
  "hammerstrength iso lateral wide pulldown": "wide-pulldown",
  "shotgun row": "shotgun-row",
  "cable face pull": "face-pull",
  "dumbbell shoulder press": "db-ohp",
  "machine shoulder press": "machine-shoulder",
  "hammerstrength shoulder press": "machine-shoulder",
  "cable lateral raise": "cable-lat-raise",
  "dumbbell lateral raise": "lat-raise",
  "dumbbell rear delt raise": "rear-delt-fly",
  "upright row": "upright-row",
  "back squat": "bb-squat",
  "hack squat": "hack-squat",
  "leg press": "leg-press",
  "machine leg press": "leg-press",
  "leg extension": "leg-ext",
  "seated leg curl": "seated-curl",
  "lying hamstrings curl": "leg-curl",
  "romanian deadlift": "rdl",
  "glute kickback machine": "glute-kick-machine",
  "dumbbell lunge": "reverse-lunge",
  "dumbbell squat": "goblet-squat",
  "machine hip adductor": "adductor-machine",
  "seated machine calf press": "seated-machine-calf",
  "barbell curl": "bb-curl",
  "ez bar curl": "ez-curl",
  "dumbbell bicep curl": "db-curl",
  "seated dumbbell curl": "db-curl",
  "incline dumbbell curl": "incline-curl",
  "hammer curls": "hammer-curl",
  "cable bicep curl": "cable-curl",
  "behind the back cable bicep curl": "behind-cable-curl",
  "barbell bicep drag curl": "drag-curl",
  "machine bicep curl": "machine-bi-curl",
  "machine preacher curl": "preacher-curl",
  "cable wood chop": "cable-woodchop",
  "cable wood chop low to high": "cable-woodchop-low",
  "standing cable core twist": "cable-core-twist",
  "back extensions": "back-extension",
  "seated back extension": "seated-back-ext",
  "ab crunch machine": "ab-crunch-machine",
  "v up": "v-up",
  "crunches": "crunch",
  "exercise ball crunch": "ball-crunch",
  "machine hip abductor": "hip-abductor",
  "reverse barbell curl": "reverse-curl",
  "cable tricep pushdown": "pushdown",
  "cable rope tricep extension": "rope-pushdown",
  "cable underhand tricep pushdown": "underhand-pushdown",
  "cable one arm tricep side extension": "one-arm-tri-side",
  "machine tricep extension": "machine-tri-ext",
  "machine tricep dip": "machine-tri-dip",
  "jm press": "jm-press",
  "jm press bench": "jm-press",
  "close grip bench press": "cg-bench",
  "dumbbell skullcrusher": "skull-crusher",
  "skullcrusher": "skull-crusher",
  "barbell shrug": "bb-shrug",
  "dumbbell shrug": "db-shrug",
  "cable crunch": "cable-crunch",
  "vertical leg raise": "hanging-leg-raise",
  "hanging leg raise": "hanging-leg-raise",
  "vertical knee raise": "hanging-knee-raise",
  "plank": "plank",
  "side bridge": "plank",
};

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function slug(s: string): string {
  return norm(s).replace(/\s+/g, "-") || "movement";
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (q) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else q = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') q = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") cell += ch;
  }
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((c) => c.trim())) rows.push(row);
  }
  return rows;
}

function parseStamp(raw: string): number {
  const m = raw.trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/);
  if (m) {
    const t = Date.parse(`${m[1]}T${m[2]}Z`);
    if (Number.isFinite(t)) return t;
  }
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : Date.now();
}

function guessMuscle(name: string): Muscle {
  const n = norm(name);
  if (/hamstring|leg curl|nordic/.test(n)) return "hamstrings";
  if (/calf/.test(n)) return "calves";
  if (/adduct/.test(n)) return "adductors";
  if (/abduct|glute|hip thrust|kickback/.test(n)) return "glutes";
  if (/squat|lunge|leg press|leg ext|hack squat|step up/.test(n)) return "quads";
  if (/deadlift|rdl|good morning/.test(n)) return "hamstrings";
  if (/back ext/.test(n)) return "lowerBack";
  if (/tricep|pushdown|skull|jm press|close grip|kickback/.test(n)) return "triceps";
  if (/bicep|curl|preacher|hammer curl/.test(n)) return "biceps";
  if (/rear delt|face pull/.test(n)) return "rearDelts";
  if (/lateral raise/.test(n)) return "sideDelts";
  if (/shoulder press|overhead press|ohp|front raise/.test(n)) return "frontDelts";
  if (/shrug|upright/.test(n)) return "traps";
  if (/chop|twist|oblique/.test(n)) return "obliques";
  if (/crunch|plank|v up|ab |leg raise|knee raise|core/.test(n)) return "abs";
  if (/row|pulldown|pull up|chin|lat /.test(n)) return "lats";
  if (/bench|chest|fly|crossover|pec|dip/.test(n)) return "chest";
  return "upperBack";
}

function guessEquipment(name: string): Equipment[] {
  const n = norm(name);
  if (/smith/.test(n)) return ["smith"];
  if (/cable/.test(n)) return ["cable"];
  if (/dumbbell|db /.test(n)) return ["dumbbell"];
  if (/ez/.test(n)) return ["ezBar"];
  if (/machine|hammerstrength/.test(n)) return ["machine"];
  if (/barbell/.test(n)) return ["barbell"];
  if (/pull up|chin|dip|plank|raise|crunch|v up/.test(n)) return ["bodyweight"];
  return ["machine"];
}

function resolve(
  rawName: string,
  byName: Map<string, Exercise>,
  customs: Map<string, Exercise>,
): { id: string; custom?: Exercise } | "cardio" {
  const n = norm(rawName);
  if (CARDIO.has(n)) return "cardio";
  const aliased = ALIAS[n];
  if (aliased) return { id: aliased };
  const exact = byName.get(n);
  if (exact) return { id: exact.id };
  const id = `fitbod-${slug(rawName)}`;
  const existing = customs.get(id);
  if (existing) return { id, custom: existing };
  const custom: Exercise = {
    id,
    name: rawName.trim(),
    primary: guessMuscle(rawName),
    secondary: [],
    equipment: guessEquipment(rawName),
    mechanic: /press|squat|deadlift|row|pull|lunge|dip/.test(n) ? "compound" : "isolation",
    defaultWeightLb: 20,
    incrementLb: 5,
    instructions: [],
    isCustom: true,
    bodyweight: guessEquipment(rawName)[0] === "bodyweight",
  };
  customs.set(id, custom);
  return { id, custom };
}

function inferFocus(exerciseIds: string[], extra: Exercise[]): Focus {
  const lib = new Map([...catalog(), ...extra].map((e) => [e.id, e]));
  const counts: Record<"push" | "pull" | "legs", number> = { push: 0, pull: 0, legs: 0 };
  for (const id of exerciseIds) {
    const ex = lib.get(id);
    if (!ex) continue;
    if (FOCUS_MUSCLES.push.includes(ex.primary)) counts.push += 1;
    if (FOCUS_MUSCLES.pull.includes(ex.primary)) counts.pull += 1;
    if (FOCUS_MUSCLES.legs.includes(ex.primary)) counts.legs += 1;
  }
  const ranked: Array<"push" | "pull" | "legs"> = ["push", "pull", "legs"];
  ranked.sort((a, b) => counts[b] - counts[a]);
  const top = ranked[0];
  const second = ranked[1];
  if (counts[top] === 0) return "full";
  if (counts[second] >= counts[top]) {
    if (counts.legs === 0) return "upper";
    return "full";
  }
  return top;
}

export interface FitbodImport {
  sessions: WorkoutSession[];
  customs: Exercise[];
  rows: number;
  unmatched: string[];
}

export function isFitbodCsv(text: string): boolean {
  const header = text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? "";
  return /exercise/i.test(header) && /weight/i.test(header) && /warmup/i.test(header);
}

export function parseFitbodCsv(text: string): FitbodImport {
  if (!isFitbodCsv(text)) {
    throw new Error("Not a Fitbod WorkoutExport.csv — need Date, Exercise, Reps, Weight(kg), isWarmup.");
  }
  const rows = parseCsv(text);
  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => header.findIndex((h) => h.toLowerCase() === name.toLowerCase());
  const iDate = idx("Date");
  const iEx = idx("Exercise");
  const iReps = idx("Reps");
  const iKg = header.findIndex((h) => /weight/i.test(h));
  const iDur = idx("Duration(s)") >= 0 ? idx("Duration(s)") : header.findIndex((h) => /duration/i.test(h));
  const iWarm = idx("isWarmup");
  const iNote = idx("Note");
  if (iDate < 0 || iEx < 0 || iReps < 0 || iKg < 0) {
    throw new Error("CSV is missing Date, Exercise, Reps, or Weight.");
  }

  const byName = new Map(catalog().map((e) => [norm(e.name), e]));
  const customs = new Map<string, Exercise>();
  const unmatched: string[] = [];

  type Acc = {
    stamp: string;
    start: number;
    duration: number;
    notes: string;
    order: string[];
    byId: Map<string, { exerciseId: string; sets: WorkoutSession["exercises"][0]["sets"]; notes: string }>;
  };
  const groups = new Map<string, Acc>();

  for (const row of rows.slice(1)) {
    const date = (row[iDate] ?? "").trim();
    const name = (row[iEx] ?? "").trim();
    if (!date || !name) continue;
    const resolved = resolve(name, byName, customs);
    const start = parseStamp(date);
    const acc =
      groups.get(date) ??
      (() => {
        const fresh: Acc = {
          stamp: date,
          start,
          duration: 0,
          notes: "",
          order: [],
          byId: new Map(),
        };
        groups.set(date, fresh);
        return fresh;
      })();
    const dur = iDur >= 0 ? Number(row[iDur] || 0) : 0;
    if (dur > acc.duration) acc.duration = dur;
    if (resolved === "cardio") continue;
    if (resolved.custom && !byName.has(norm(name))) unmatched.push(name);
    let bucket = acc.byId.get(resolved.id);
    if (!bucket) {
      bucket = { exerciseId: resolved.id, sets: [], notes: (row[iNote] ?? "").trim() };
      acc.byId.set(resolved.id, bucket);
      acc.order.push(resolved.id);
    }
    const kg = Number(row[iKg] || 0);
    const reps = Math.round(Number(row[iReps] || 0));
    const warmup = String(row[iWarm] ?? "").trim().toLowerCase() === "true";
    bucket.sets.push({
      weight: roundTo(kgToLb(kg), 0.5),
      reps: Math.max(0, reps),
      completed: true,
      warmup,
    });
  }

  const sessions: WorkoutSession[] = [];
  for (const acc of groups.values()) {
    const exercises = acc.order.map((id) => {
      const b = acc.byId.get(id)!;
      return {
        instanceId: uid(),
        exerciseId: id,
        sets: b.sets,
        restSec: 90,
        notes: b.notes,
        setStyle: "normal" as const,
      };
    });
    const working = exercises.reduce((n, e) => n + e.sets.filter((s) => !s.warmup).length, 0);
    const durationSec =
      acc.duration > 0
        ? Math.round(acc.duration)
        : Math.max(24 * 60, Math.round(working * 130 + Math.max(0, exercises.length - 1) * 40));
    const focus = inferFocus(
      exercises.map((e) => e.exerciseId),
      [...customs.values()],
    );
    const when = new Date(acc.start);
    sessions.push({
      id: `fitbod-${acc.start}`,
      title: exercises.length ? `${FOCUS_LABEL[focus]} · imported` : "Cardio · imported",
      focus,
      date: todayISO(when),
      exercises,
      startedAt: acc.start,
      finishedAt: acc.start + durationSec * 1000,
      durationSec,
      source: "fitbod",
      externalId: `fitbod:${acc.stamp}`,
    });
  }

  sessions.sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
  return {
    sessions,
    customs: [...customs.values()],
    rows: rows.length - 1,
    unmatched: [...new Set(unmatched)],
  };
}
