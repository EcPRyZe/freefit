export const MUSCLES = [
  "chest",
  "frontDelts",
  "sideDelts",
  "rearDelts",
  "biceps",
  "triceps",
  "forearms",
  "traps",
  "lats",
  "upperBack",
  "lowerBack",
  "abs",
  "obliques",
  "quads",
  "hamstrings",
  "glutes",
  "adductors",
  "calves",
  "neck",
] as const;

export type Muscle = (typeof MUSCLES)[number];

export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: "Chest",
  frontDelts: "Front Delts",
  sideDelts: "Side Delts",
  rearDelts: "Rear Delts",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  traps: "Traps",
  lats: "Lats",
  upperBack: "Upper Back",
  lowerBack: "Lower Back",
  abs: "Abs",
  obliques: "Obliques",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  adductors: "Adductors",
  calves: "Calves",
  neck: "Neck",
};

export const EQUIPMENT = [
  "barbell",
  "dumbbell",
  "cable",
  "machine",
  "smith",
  "kettlebell",
  "bodyweight",
  "bands",
  "ezBar",
  "trapBar",
  "bench",
  "pullupBar",
  "dipStation",
] as const;

export type Equipment = (typeof EQUIPMENT)[number];

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  cable: "Cable",
  machine: "Machine",
  smith: "Smith Machine",
  kettlebell: "Kettlebell",
  bodyweight: "Bodyweight",
  bands: "Bands",
  ezBar: "EZ Bar",
  trapBar: "Trap Bar",
  bench: "Bench",
  pullupBar: "Pull-up Bar",
  dipStation: "Dip Station",
};

export const GOALS = ["strength", "muscle", "general", "power"] as const;
export type Goal = (typeof GOALS)[number];

export const GOAL_LABEL: Record<Goal, string> = {
  strength: "Build Strength",
  muscle: "Build Muscle",
  general: "General Fitness",
  power: "Power",
};

export const GOAL_BLURB: Record<Goal, string> = {
  strength: "Heavy compounds, low reps, long rest.",
  muscle: "Hypertrophy volume in the 8–12 range.",
  general: "Balanced training you can stick with.",
  power: "Explosive work at low reps.",
};

export const EXPERIENCE = ["beginner", "intermediate", "advanced"] as const;
export type Experience = (typeof EXPERIENCE)[number];

export const EXPERIENCE_LABEL: Record<Experience, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const DURATIONS = [30, 45, 60, 75, 90] as const;
export type DurationMin = (typeof DURATIONS)[number];

export const FOCUSES = ["push", "pull", "legs", "upper", "full"] as const;
export type Focus = (typeof FOCUSES)[number];

export const FOCUS_LABEL: Record<Focus, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Lower",
  upper: "Upper",
  full: "Full body",
};

export const FOCUS_MUSCLES: Record<Focus, Muscle[]> = {
  push: ["chest", "frontDelts", "sideDelts", "triceps"],
  pull: ["lats", "upperBack", "traps", "rearDelts", "biceps", "lowerBack"],
  legs: ["quads", "hamstrings", "glutes", "adductors", "calves"],
  upper: [
    "chest",
    "frontDelts",
    "sideDelts",
    "rearDelts",
    "lats",
    "upperBack",
    "biceps",
    "triceps",
    "traps",
  ],
  full: [
    "chest",
    "lats",
    "quads",
    "hamstrings",
    "glutes",
    "frontDelts",
    "upperBack",
    "triceps",
    "biceps",
  ],
};

export const SEXES = ["male", "female"] as const;
export type Sex = (typeof SEXES)[number];

export const SEX_LABEL: Record<Sex, string> = {
  male: "Male",
  female: "Female",
};


export interface Exercise {
  id: string;
  name: string;
  primary: Muscle;
  secondary: Muscle[];
  equipment: Equipment[];
  mechanic: "compound" | "isolation";
  defaultWeightLb: number;
  incrementLb: number;
  instructions: string[];
  bodyweight?: boolean;
  isCustom?: boolean;
  /** Compendium MET. Used for calorie estimates. */
  met?: number;
}

export interface LoggedSet {
  weight: number;
  reps: number;
  completed: boolean;
  warmup: boolean;
}

export const SET_STYLES = [
  "normal",
  "pause",
  "longPause",
  "eccentricSlow",
  "restPause",
  "drop",
] as const;
export type SetStyle = (typeof SET_STYLES)[number];

export const SET_STYLE_LABEL: Record<SetStyle, string> = {
  normal: "Standard",
  pause: "Pause",
  longPause: "Long Pause",
  eccentricSlow: "Eccentric Slow",
  restPause: "Rest-Pause",
  drop: "Drop Set",
};

export const SET_STYLE_HINT: Record<SetStyle, string> = {
  normal: "Straight sets",
  pause: "Pause in the stretch",
  longPause: "3+ second pause",
  eccentricSlow: "Slow negative",
  restPause: "Mini-rest, then more reps",
  drop: "Strip weight and keep going",
};

export interface SessionExercise {
  instanceId: string;
  exerciseId: string;
  sets: LoggedSet[];
  restSec: number;
  notes: string;
  setStyle: SetStyle;
}

export interface WorkoutSession {
  id: string;
  title: string;
  focus: Focus;
  date: string;
  exercises: SessionExercise[];
  startedAt: number | null;
  finishedAt: number | null;
  durationSec: number;
  source?: "freefit" | "strava" | "health" | "fitbod";
  externalId?: string;
  avgHr?: number;
  maxHr?: number;
  hrSource?: "ble" | "watch" | "airpods" | "healthkit";
}

export interface Profile {
  name: string;
  goal: Goal;
  experience: Experience;
  durationMin: DurationMin;
  units: "lb" | "kg";
  equipment: Equipment[];
  excludedExerciseIds: string[];
  workoutsPerWeek: number;
  restTimerEnabled: boolean;
  showWarmups: boolean;
  sex: Sex;
  age: number;
  bodyweightLb: number;
  heightIn: number;
  exerciseBias: Record<string, number>;
  isDemo?: boolean;
}

export interface StravaAccount {
  athleteId: number;
  athleteName: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface StravaApp {
  clientId: string;
  clientSecret: string;
}

export interface Integrations {
  strava: StravaAccount | null;
  stravaApp: StravaApp | null;
  autoStrava: boolean;
  autoHealth: boolean;
}

export const FULL_GYM: Equipment[] = [...EQUIPMENT];

export const HOME_GYM: Equipment[] = [
  "barbell",
  "dumbbell",
  "kettlebell",
  "bodyweight",
  "bands",
  "ezBar",
  "trapBar",
  "bench",
  "pullupBar",
  "dipStation",
];

export const BODYWEIGHT_KIT: Equipment[] = [
  "bodyweight",
  "bands",
  "pullupBar",
  "dipStation",
];
