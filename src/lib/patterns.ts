import type { Exercise, Muscle } from "./types";

/**
 * Movement patterns used to build sessions (NSCA / ACSM programming:
 * train the pattern, not just the muscle, and don't stack redundant planes).
 */
export type Pattern =
  | "hPress"
  | "vPress"
  | "fly"
  | "hPull"
  | "vPull"
  | "latIso"
  | "hinge"
  | "squat"
  | "lunge"
  | "raise"
  | "frontRaise"
  | "rearDelt"
  | "elbowFlex"
  | "elbowExt"
  | "kneeExt"
  | "kneeFlex"
  | "plantarf"
  | "hipExt"
  | "hipAdd"
  | "shrug"
  | "carry"
  | "antiExt"
  | "antiRot"
  | "trunkFlx"
  | "other";

export type PressAngle = "incline" | "flat" | "decline";

const STAPLES = new Set([
  "bb-bench",
  "inc-bb-bench",
  "db-bench",
  "inc-db-press",
  "ohp",
  "db-ohp",
  "pull-up",
  "chin-up",
  "lat-pd",
  "bb-row",
  "seated-row",
  "db-row",
  "bb-squat",
  "front-squat",
  "rdl",
  "hip-thrust",
  "lat-raise",
  "face-pull",
  "pushdown",
  "bb-curl",
  "ab-wheel",
  "pallof",
  "hanging-leg-raise",
  "plank",
  "leg-curl",
  "walking-lunge",
  "bulg-split",
]);

export function patternOf(ex: Exercise): Pattern {
  const n = `${ex.id} ${ex.name}`.toLowerCase();

  if (/face.?pull|rear delt|reverse fly|pec deck reverse/.test(n)) return "rearDelt";
  if (/pallof|wood.?chop|side plank|anti.?rot|core twist|windshield/.test(n)) return "antiRot";
  if (/ab.?wheel|rollout|plank|dead.?bug|hollow|bird.?dog|l-sit|l sit/.test(n)) return "antiExt";
  if (/crunch|sit.?up|v-up|v up|leg raise|toes to bar|knee raise|flutter/.test(n)) return "trunkFlx";

  if (/front raise|plate raise/.test(n)) return "frontRaise";
  if (/lateral raise|lat raise|side raise/.test(n)) return "raise";

  if (/fly|crossover|pec deck/.test(n) && ex.primary === "chest") return "fly";
  if (/pullover/.test(n)) return "latIso";

  if (
    /ohp|overhead press|shoulder press|arnold|push press|landmine press|pike push|handstand push|military/.test(
      n,
    )
  ) {
    return "vPress";
  }
  if (
    /bench|chest press|push-up|pushup|dip|floor press|svend|squeeze press/.test(n) &&
    (ex.primary === "chest" || ex.primary === "triceps")
  ) {
    if (ex.primary === "triceps" && /close|cg-|diamond|tricep dip/.test(n)) return "elbowExt";
    return "hPress";
  }

  if (/pulldown|pull-up|pullup|chin-up|chinup|muscle-up/.test(n)) return "vPull";
  if (/straight.?arm|lat iso/.test(n)) return "latIso";
  if (/row|face/.test(n)) return "hPull";

  if (/deadlift|rdl|good morning|hip hinge|kettlebell swing/.test(n)) return "hinge";
  if (/hip thrust|glute bridge|kickback|hyperextension|back extension/.test(n)) return "hipExt";
  if (
    /split squat|lunge|step.?up|step-up|pistol|bulgarian/.test(n)
  ) {
    return "lunge";
  }
  if (/squat|leg press|hack|wall sit/.test(n)) return "squat";
  if (/leg ext|leg extension/.test(n)) return "kneeExt";
  if (/leg curl|hamstring curl/.test(n)) return "kneeFlex";
  if (/calf/.test(n)) return "plantarf";
  if (/adductor/.test(n)) return "hipAdd";

  if (/pushdown|skull|tricep|overhead ext|tate press/.test(n)) return "elbowExt";
  if (/curl/.test(n)) return "elbowFlex";
  if (/shrug/.test(n)) return "shrug";
  if (/farmer|carry/.test(n)) return "carry";

  return fromPrimary(ex.primary);
}

function fromPrimary(m: Muscle): Pattern {
  switch (m) {
    case "chest":
      return "hPress";
    case "frontDelts":
      return "vPress";
    case "sideDelts":
      return "raise";
    case "rearDelts":
      return "rearDelt";
    case "lats":
      return "vPull";
    case "upperBack":
      return "hPull";
    case "lowerBack":
      return "hinge";
    case "biceps":
      return "elbowFlex";
    case "triceps":
      return "elbowExt";
    case "quads":
      return "squat";
    case "hamstrings":
      return "hinge";
    case "glutes":
      return "hipExt";
    case "calves":
      return "plantarf";
    case "adductors":
      return "hipAdd";
    case "abs":
      return "antiExt";
    case "obliques":
      return "antiRot";
    case "traps":
      return "shrug";
    default:
      return "other";
  }
}

export function pressAngle(ex: Exercise): PressAngle {
  const n = `${ex.id} ${ex.name}`.toLowerCase();
  if (/incline|inc-/.test(n)) return "incline";
  if (/decline/.test(n)) return "decline";
  return "flat";
}

export function isCorePattern(p: Pattern): boolean {
  return p === "antiExt" || p === "antiRot" || p === "trunkFlx";
}

export function qualityScore(ex: Exercise): number {
  let s = 0;
  if (STAPLES.has(ex.id)) s += 28;
  const n = `${ex.id} ${ex.name}`.toLowerCase();
  if (/decline/.test(n) && ex.primary === "chest") s -= 16;
  if (/wall sit/.test(n)) s -= 22;
  if (/behind the neck|behind-the-neck/.test(n)) s -= 18;
  if (/sit.?up|crunch/.test(n) && !/cable crunch|hanging/.test(n)) s -= 10;
  if (/muscle-up|battle rope/.test(n)) s -= 14;
  if (/front raise/.test(n)) s -= 20;
  if (ex.mechanic === "compound") s += 8;
  return s;
}

/** Axial-loading hinges + squats. Don't stack two heavy ones in one session. */
export function isSpinalLoad(ex: Exercise): boolean {
  const p = patternOf(ex);
  if (p !== "hinge" && p !== "squat") return false;
  return ex.equipment.includes("barbell") || ex.id.includes("deadlift");
}
