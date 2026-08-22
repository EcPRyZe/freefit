import { normalizeProfile } from "./seed";
import type { Exercise, Focus, Integrations, Profile, WorkoutSession } from "./types";

export const BACKUP_VERSION = 1;
export const BACKUP_APP = "freefit";

export interface GymBackup {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  onboardingComplete: boolean;
  profile: Profile;
  history: WorkoutSession[];
  planned: WorkoutSession | null;
  active: WorkoutSession | null;
  nonce: number;
  planMode: "auto" | Focus;
  customExercises: Exercise[];
  integrations: Pick<Integrations, "autoStrava" | "autoHealth">;
}

function isSession(x: unknown): x is WorkoutSession {
  if (!x || typeof x !== "object") return false;
  const s = x as WorkoutSession;
  return typeof s.id === "string" && Array.isArray(s.exercises);
}

export function parseBackup(raw: unknown): GymBackup {
  if (!raw || typeof raw !== "object") throw new Error("Not a FreeFit backup.");
  const o = raw as Record<string, unknown>;
  if (o.app !== BACKUP_APP) throw new Error("This file isn't a FreeFit backup.");
  if (o.version !== 1) throw new Error(`Unsupported backup version (${String(o.version)}).`);
  if (!o.profile || typeof o.profile !== "object") throw new Error("Backup is missing a profile.");
  const history = Array.isArray(o.history) ? o.history.filter(isSession) : [];
  const customs = Array.isArray(o.customExercises) ? (o.customExercises as Exercise[]) : [];
  const integ = (o.integrations ?? {}) as Partial<Integrations>;
  const planMode = o.planMode === "auto" || o.planMode === "push" || o.planMode === "pull" || o.planMode === "legs" || o.planMode === "upper" || o.planMode === "full"
    ? o.planMode
    : "auto";
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: typeof o.exportedAt === "string" ? o.exportedAt : new Date().toISOString(),
    onboardingComplete: Boolean(o.onboardingComplete),
    profile: normalizeProfile(o.profile as Profile),
    history,
    planned: isSession(o.planned) ? o.planned : null,
    active: isSession(o.active) ? o.active : null,
    nonce: typeof o.nonce === "number" ? o.nonce : 1,
    planMode,
    customExercises: customs.filter((e) => e && typeof e.id === "string" && typeof e.name === "string"),
    integrations: {
      autoStrava: Boolean(integ.autoStrava),
      autoHealth: integ.autoHealth !== false,
    },
  };
}

export function publicUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const trimmed = path.replace(/^\//, "");
  return `${base}${trimmed}`.replace(/([^:]\/)\/+/g, "$1");
}
