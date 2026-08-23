import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { bindCustomExercises, getExercise } from "./exercises";
import { todayISO, uid } from "./format";
import { alternatives, generateWorkout, isPersonalRecord, prescribeExercise, prescribeSession } from "./generator";
import { resetHrSession, snapshotHr } from "./heart-rate";
import { parseBackup, BACKUP_APP, BACKUP_VERSION, type GymBackup } from "./backup";
import { createSeedHistory, DEFAULT_PROFILE, normalizeProfile } from "./seed";
import type {
  Exercise,
  Focus,
  Integrations,
  LoggedSet,
  Profile,
  SetStyle,
  StravaAccount,
  WorkoutSession,
} from "./types";
import { FULL_GYM } from "./types";

function withSetStyle(session: WorkoutSession | null | undefined): WorkoutSession | null {
  if (!session) return null;
  return {
    ...session,
    exercises: session.exercises.map((ex) => ({
      ...ex,
      setStyle: (ex.setStyle ?? "normal") as SetStyle,
    })),
  };
}

export interface RestState {
  remaining: number;
  total: number;
  instanceId: string;
}

interface GymState {
  hydrated: boolean;
  onboardingComplete: boolean;
  profile: Profile;
  history: WorkoutSession[];
  planned: WorkoutSession | null;
  active: WorkoutSession | null;
  rest: RestState | null;
  nonce: number;
  lastPR: { name: string; weight: number; reps: number } | null;
  planMode: "auto" | Focus;
  customExercises: Exercise[];
  shareSession: WorkoutSession | null;
  integrations: Integrations;

  setHydrated: () => void;
  completeOnboarding: (profile: Profile) => void;
  loadDemo: () => void;
  updateProfile: (patch: Partial<Profile>) => void;
  regenerate: (focus?: Focus) => void;
  startWorkout: () => void;
  updateSet: (instanceId: string, setIndex: number, patch: Partial<LoggedSet>) => void;
  toggleSet: (instanceId: string, setIndex: number) => void;
  skipRest: () => void;
  addRest: (sec: number) => void;
  tickRest: () => void;
  swapExercise: (instanceId: string, newExerciseId: string) => void;
  skipExercise: (instanceId: string) => void;
  addExercise: (exerciseId: string) => string | undefined;
  addSet: (instanceId: string) => void;
  removeSet: (instanceId: string) => void;
  finishWorkout: () => void;
  discardWorkout: () => void;
  resetAll: () => void;
  suggestionsFor: (instanceId: string) => Exercise[];
  setExerciseBias: (exerciseId: string, value: number) => void;
  setPlanMode: (mode: "auto" | Focus) => void;
  addCustomExercise: (ex: Omit<Exercise, "id" | "isCustom">) => string;
  deleteCustomExercise: (id: string) => void;
  setExerciseStyle: (instanceId: string, style: SetStyle) => void;
  dismissShare: () => void;
  openShare: (session: WorkoutSession) => void;
  setAutoStrava: (on: boolean) => void;
  setAutoHealth: (on: boolean) => void;
  connectStrava: (account: StravaAccount) => void;
  disconnectStrava: () => void;
  patchStravaTokens: (patch: Partial<Pick<StravaAccount, "accessToken" | "refreshToken" | "expiresAt">>) => void;
  setStravaApp: (app: { clientId: string; clientSecret: string } | null) => void;
  importSessions: (sessions: WorkoutSession[]) => number;
  ingestImport: (payload: { sessions: WorkoutSession[]; customs: Exercise[] }) => {
    sessions: number;
    exercises: number;
  };
  exportBackup: () => GymBackup;
  importBackup: (raw: unknown) => { sessions: number; exercises: number };
}

function applySet(
  session: WorkoutSession,
  instanceId: string,
  setIndex: number,
  patch: Partial<LoggedSet>,
): WorkoutSession {
  return {
    ...session,
    exercises: session.exercises.map((ex) =>
      ex.instanceId !== instanceId
        ? ex
        : {
            ...ex,
            sets: ex.sets.map((s, i) => (i === setIndex ? { ...s, ...patch } : s)),
          },
    ),
  };
}

function defaultSetsFor(
  exerciseId: string,
  profile: Profile,
  history: WorkoutSession[],
  prior: WorkoutSession["exercises"] = [],
) {
  return prescribeExercise(profile, history, exerciseId, prior);
}

export const useGym = create<GymState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      onboardingComplete: false,
      profile: normalizeProfile({ ...DEFAULT_PROFILE, name: "" }),
      history: [],
      planned: null,
      active: null,
      rest: null,
      nonce: 1,
      lastPR: null,
      planMode: "auto" as const,
      customExercises: [],
      shareSession: null,
      integrations: { strava: null, stravaApp: null, autoStrava: false, autoHealth: true },

      setHydrated: () => {
        bindCustomExercises(get().customExercises);
        const s = get();
        const profile = normalizeProfile(s.profile);
        set({
          hydrated: true,
          profile,
          planned:
            s.planned && s.onboardingComplete
              ? prescribeSession(s.planned, profile, s.history)
              : s.planned,
        });
      },

      completeOnboarding: (profile) => {
        const next = normalizeProfile({ ...profile, isDemo: false });
        set({
          onboardingComplete: true,
          profile: next,
          history: [],
          planned: generateWorkout(next, []),
          active: null,
          rest: null,
          nonce: 1,
          planMode: "auto",
        });
      },

      loadDemo: () => {
        const history = createSeedHistory();
        const profile = { ...DEFAULT_PROFILE, isDemo: true };
        set({
          onboardingComplete: true,
          profile,
          history,
          planned: generateWorkout(profile, history),
          active: null,
          rest: null,
          nonce: 1,
          lastPR: null,
          planMode: "auto",
          customExercises: [],
          shareSession: null,
        });
        bindCustomExercises([]);
      },

      updateProfile: (patch) => {
        const profile = normalizeProfile({ ...get().profile, ...patch });
        set({ profile });
      },

      regenerate: (focus) => {
        const { history, nonce, active, planMode } = get();
        const profile = normalizeProfile(get().profile);
        if (active) return;
        const next = nonce + 1;
        const resolved = focus ?? (planMode === "auto" ? undefined : planMode);
        set({
          profile,
          nonce: next,
          planned: generateWorkout(profile, history, { focus: resolved, nonce: next }),
        });
      },

      setPlanMode: (mode) => {
        const { history, nonce, active } = get();
        const profile = normalizeProfile(get().profile);
        if (active) {
          set({ planMode: mode });
          return;
        }
        const next = nonce + 1;
        const focus = mode === "auto" ? undefined : mode;
        set({
          planMode: mode,
          profile,
          nonce: next,
          planned: generateWorkout(profile, history, { focus, nonce: next }),
        });
      },

      startWorkout: () => {
        const { planned, profile, history } = get();
        const session = planned ?? generateWorkout(profile, history);
        resetHrSession();
        set({
          active: {
            ...prescribeSession(session, profile, history),
            startedAt: Date.now(),
            date: todayISO(),
          },
          rest: null,
        });
      },

      updateSet: (instanceId, setIndex, patch) => {
        const { active } = get();
        if (!active) return;
        set({
          active: {
            ...active,
            exercises: active.exercises.map((ex) => {
              if (ex.instanceId !== instanceId) return ex;
              const source = ex.sets[setIndex];
              if (!source) return ex;
              return {
                ...ex,
                sets: ex.sets.map((s, i) => {
                  if (i === setIndex) return { ...s, ...patch };
                  const cascade =
                    i > setIndex &&
                    !s.completed &&
                    s.warmup === source.warmup &&
                    (patch.weight != null || patch.reps != null);
                  if (!cascade) return s;
                  return {
                    ...s,
                    ...(patch.weight != null ? { weight: patch.weight } : {}),
                    ...(patch.reps != null ? { reps: patch.reps } : {}),
                  };
                }),
              };
            }),
          },
        });
      },

      toggleSet: (instanceId, setIndex) => {
        const { active, profile, history, rest } = get();
        if (!active) return;
        const item = active.exercises.find((e) => e.instanceId === instanceId);
        if (!item) return;
        const current = item.sets[setIndex];
        if (!current) return;
        const completing = !current.completed;
        const next = applySet(active, instanceId, setIndex, { completed: completing });

        let lastPR = get().lastPR;
        if (completing && !current.warmup) {
          const ex = getExercise(item.exerciseId);
          if (isPersonalRecord(history, item.exerciseId, current.weight, current.reps)) {
            lastPR = { name: ex.name, weight: current.weight, reps: current.reps };
          }
        }

        const hasMore = item.sets.slice(setIndex + 1).some((s) => !s.completed);
        const shouldRest = completing && profile.restTimerEnabled && hasMore;

        set({
          active: next,
          lastPR,
          rest: shouldRest
            ? { remaining: item.restSec, total: item.restSec, instanceId }
            : rest?.instanceId === instanceId && !completing
              ? null
              : rest,
        });
      },

      skipRest: () => set({ rest: null }),

      addRest: (sec) => {
        const { rest } = get();
        if (!rest) return;
        const remaining = Math.max(0, rest.remaining + sec);
        set({ rest: { ...rest, remaining, total: Math.max(rest.total, remaining) } });
      },

      tickRest: () => {
        const { rest } = get();
        if (!rest) return;
        const remaining = rest.remaining - 1;
        set({ rest: remaining <= 0 ? null : { ...rest, remaining } });
      },

      swapExercise: (instanceId, newExerciseId) => {
        const { active, profile, history } = get();
        if (!active) return;
        const prior = active.exercises.filter((item) => item.instanceId !== instanceId);
        const built = defaultSetsFor(newExerciseId, profile, history, prior);
        set({
          active: {
            ...active,
            exercises: active.exercises.map((item) =>
              item.instanceId !== instanceId
                ? item
                : {
                    instanceId: uid(),
                    exerciseId: newExerciseId,
                    sets: built.sets,
                    restSec: built.restSec,
                    notes: "",
                    setStyle: "normal" as const,
                  },
            ),
          },
          rest: null,
        });
      },

      skipExercise: (instanceId) => {
        const { active, planned } = get();
        if (active) {
          set({
            active: {
              ...active,
              exercises: active.exercises.filter((e) => e.instanceId !== instanceId),
            },
            rest: null,
          });
          return;
        }
        if (planned) {
          set({
            planned: {
              ...planned,
              exercises: planned.exercises.filter((e) => e.instanceId !== instanceId),
            },
          });
        }
      },

      addExercise: (exerciseId) => {
        const { active, planned, profile, history } = get();
        const target = active ?? planned;
        if (!target) return undefined;
        const built = defaultSetsFor(exerciseId, profile, history, target.exercises);
        const instanceId = uid();
        const next = {
          ...target,
          exercises: [
            ...target.exercises,
            {
              instanceId,
              exerciseId,
              sets: built.sets,
              restSec: built.restSec,
              notes: "",
              setStyle: "normal" as const,
            },
          ],
        };
        if (active) set({ active: next });
        else set({ planned: next });
        return instanceId;
      },

      addSet: (instanceId) => {
        const { active } = get();
        if (!active) return;
        set({
          active: {
            ...active,
            exercises: active.exercises.map((ex) => {
              if (ex.instanceId !== instanceId) return ex;
              const last = [...ex.sets].reverse().find((s) => !s.warmup) ?? ex.sets[ex.sets.length - 1];
              const copy: LoggedSet = last
                ? { ...last, completed: false, warmup: false }
                : { weight: 0, reps: 10, completed: false, warmup: false };
              return { ...ex, sets: [...ex.sets, copy] };
            }),
          },
        });
      },

      removeSet: (instanceId) => {
        const { active } = get();
        if (!active) return;
        set({
          active: {
            ...active,
            exercises: active.exercises.map((ex) => {
              if (ex.instanceId !== instanceId) return ex;
              const working = ex.sets.filter((s) => !s.warmup);
              if (working.length <= 1) return ex;
              const lastWork = [...ex.sets]
                .map((s, i) => ({ s, i }))
                .reverse()
                .find((x) => !x.s.warmup);
              if (!lastWork) return ex;
              return { ...ex, sets: ex.sets.filter((_, i) => i !== lastWork.i) };
            }),
          },
        });
      },

      finishWorkout: () => {
        const { active, history } = get();
        const profile = normalizeProfile(get().profile);
        if (!active) return;
        const hr = snapshotHr();
        const finished: WorkoutSession = {
          ...active,
          finishedAt: Date.now(),
          durationSec: active.startedAt
            ? Math.round((Date.now() - active.startedAt) / 1000)
            : 0,
          avgHr: hr.avg ?? undefined,
          maxHr: hr.max ?? undefined,
          hrSource: hr.source ?? undefined,
          exercises: active.exercises
            .map((ex) => ({
              ...ex,
              sets: ex.sets.filter((s) => s.completed),
            }))
            .filter((ex) => ex.sets.length > 0),
        };
        const nextHistory = [finished, ...history];
        const planMode = get().planMode;
        const focus = planMode === "auto" ? undefined : planMode;
        set({
          history: nextHistory,
          active: null,
          rest: null,
          planned: generateWorkout(profile, nextHistory, { focus }),
          shareSession: finished,
        });
      },

      discardWorkout: () => set({ active: null, rest: null }),

      resetAll: () =>
        set({
          onboardingComplete: false,
          profile: normalizeProfile({ ...DEFAULT_PROFILE, name: "", equipment: [...FULL_GYM] }),
          history: [],
          planned: null,
          active: null,
          rest: null,
          nonce: 1,
          lastPR: null,
          planMode: "auto",
          shareSession: null,
          integrations: { strava: null, stravaApp: null, autoStrava: false, autoHealth: true },
        }),

      suggestionsFor: (instanceId) => {
        const { active, history } = get();
        const profile = normalizeProfile(get().profile);
        if (!active) return [];
        const item = active.exercises.find((e) => e.instanceId === instanceId);
        if (!item) return [];
        return alternatives(profile, item.exerciseId, history);
      },

      setExerciseBias: (exerciseId, value) => {
        const profile = normalizeProfile(get().profile);
        const next = Math.max(-2, Math.min(2, Math.round(value)));
        const exerciseBias = { ...profile.exerciseBias };
        if (next === 0) delete exerciseBias[exerciseId];
        else exerciseBias[exerciseId] = next;
        const updated = { ...profile, exerciseBias };
        const { planned, history, nonce, active, planMode } = get();
        const focus = planMode === "auto" ? planned?.focus : planMode;
        set({
          profile: updated,
          planned:
            active || !planned
              ? planned
              : generateWorkout(updated, history, { focus, nonce }),
        });
      },

      addCustomExercise: (ex) => {
        const id = `custom-${uid()}`;
        const full: Exercise = { ...ex, id, isCustom: true };
        const customExercises = [...get().customExercises, full];
        bindCustomExercises(customExercises);
        const { history, nonce, active, planMode } = get();
        const profile = normalizeProfile(get().profile);
        const next = nonce + 1;
        const focus = planMode === "auto" ? undefined : planMode;
        set({
          customExercises,
          nonce: next,
          planned: active
            ? get().planned
            : generateWorkout(profile, history, { focus, nonce: next }),
        });
        return id;
      },

      deleteCustomExercise: (id) => {
        const customExercises = get().customExercises.filter((e) => e.id !== id);
        bindCustomExercises(customExercises);
        set({ customExercises });
      },

      setExerciseStyle: (instanceId, style) => {
        const patch = (session: WorkoutSession | null) =>
          session
            ? {
                ...session,
                exercises: session.exercises.map((ex) =>
                  ex.instanceId === instanceId ? { ...ex, setStyle: style } : ex,
                ),
              }
            : session;
        const { active, planned } = get();
        if (active?.exercises.some((e) => e.instanceId === instanceId)) {
          set({ active: patch(active) });
          return;
        }
        if (planned?.exercises.some((e) => e.instanceId === instanceId)) {
          set({ planned: patch(planned) });
        }
      },

      dismissShare: () => set({ shareSession: null }),
      openShare: (session) => set({ shareSession: session }),

      setAutoStrava: (on) =>
        set({ integrations: { ...get().integrations, autoStrava: on } }),

      setAutoHealth: (on) =>
        set({ integrations: { ...get().integrations, autoHealth: on } }),

      connectStrava: (account) =>
        set({ integrations: { ...get().integrations, strava: account } }),

      disconnectStrava: () =>
        set({ integrations: { ...get().integrations, strava: null, autoStrava: false } }),

      patchStravaTokens: (patch) => {
        const strava = get().integrations.strava;
        if (!strava) return;
        set({ integrations: { ...get().integrations, strava: { ...strava, ...patch } } });
      },

      setStravaApp: (app) =>
        set({ integrations: { ...get().integrations, stravaApp: app } }),

      importSessions: (sessions) => {
        const history = get().history;
        const seenExt = new Set(history.map((h) => h.externalId).filter(Boolean));
        const seenId = new Set(history.map((h) => h.id));
        const extra = sessions.filter((s) => {
          if (s.externalId && seenExt.has(s.externalId)) return false;
          if (seenId.has(s.id)) return false;
          return true;
        });
        if (!extra.length) return 0;
        const historyNext = [...extra, ...history].sort(
          (a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0),
        );
        set({ history: historyNext });
        return extra.length;
      },

      ingestImport: ({ sessions, customs }) => {
        const had = new Set(get().customExercises.map((e) => e.id));
        const existing = new Map(get().customExercises.map((e) => [e.id, e]));
        for (const ex of customs) {
          if (!existing.has(ex.id)) existing.set(ex.id, ex);
        }
        const customExercises = [...existing.values()];
        bindCustomExercises(customExercises);
        const added = get().importSessions(sessions);
        const profile = normalizeProfile(get().profile);
        const planMode = get().planMode;
        const focus = planMode === "auto" ? undefined : planMode;
        const history = get().history;
        set({
          customExercises,
          planned: get().active ? get().planned : generateWorkout(profile, history, { focus }),
        });
        return {
          sessions: added,
          exercises: customs.filter((c) => !had.has(c.id)).length,
        };
      },

      exportBackup: () => {
        const s = get();
        const backup: GymBackup = {
          app: BACKUP_APP,
          version: BACKUP_VERSION,
          exportedAt: new Date().toISOString(),
          onboardingComplete: s.onboardingComplete,
          profile: s.profile,
          history: s.history,
          planned: s.planned,
          active: s.active,
          nonce: s.nonce,
          planMode: s.planMode,
          customExercises: s.customExercises,
          integrations: {
            autoStrava: s.integrations.autoStrava,
            autoHealth: s.integrations.autoHealth,
          },
        };
        return backup;
      },

      importBackup: (raw) => {
        const data = parseBackup(raw);
        const customExercises = data.customExercises.map((e) => ({ ...e, isCustom: true as const }));
        bindCustomExercises(customExercises);
        const profile = normalizeProfile(data.profile);
        const history = data.history.map((s) => withSetStyle(s)!);
        const planMode = data.planMode;
        const focus = planMode === "auto" ? undefined : planMode;
        set({
          onboardingComplete: data.onboardingComplete,
          profile,
          history,
          customExercises,
          nonce: data.nonce,
          planMode,
          active: withSetStyle(data.active),
          planned:
            withSetStyle(data.planned) ??
            generateWorkout(profile, history, { focus }),
          integrations: {
            ...get().integrations,
            autoStrava: data.integrations.autoStrava,
            autoHealth: data.integrations.autoHealth,
          },
        });
        return { sessions: history.length, exercises: customExercises.length };
      },
    }),
    {
      name: "forge-v1",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
          : localStorage,
      ),
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GymState>;
        const customExercises = p.customExercises ?? [];
        bindCustomExercises(customExercises);
        return {
          ...current,
          ...p,
          profile: normalizeProfile(p.profile),
          hydrated: false,
          planMode: p.planMode ?? current.planMode ?? "auto",
          customExercises,
          planned: withSetStyle(p.planned ?? current.planned),
          active: withSetStyle(p.active ?? current.active),
          history: (p.history ?? current.history).map((s) => withSetStyle(s)!),
          shareSession: null,
          integrations: {
            strava: p.integrations?.strava ?? null,
            stravaApp: p.integrations?.stravaApp ?? null,
            autoStrava: p.integrations?.autoStrava ?? false,
            autoHealth: p.integrations?.autoHealth ?? true,
          },
        };
      },
      partialize: (s) => ({
        onboardingComplete: s.onboardingComplete,
        profile: s.profile,
        history: s.history,
        planned: s.planned,
        active: s.active,
        nonce: s.nonce,
        planMode: s.planMode,
        customExercises: s.customExercises,
        integrations: s.integrations,
      }),
    },
  ),
);
