import { useEffect, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { useGym } from "@/lib/store";
import { todayISO } from "@/lib/format";
import { ActiveWorkoutBar } from "@/components/active-workout-bar";
import { Onboarding } from "@/components/onboarding";
import { RestTimer } from "@/components/rest-timer";
import { Splash } from "@/components/splash";
import { TabBar } from "@/components/tab-bar";
import { ShareWorkoutSheet } from "@/components/share-workout";

export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useGym((s) => s.hydrated);
  const onboardingComplete = useGym((s) => s.onboardingComplete);
  const active = useGym((s) => s.active);
  const shareSession = useGym((s) => s.shareSession);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onSession = pathname === "/" || pathname === "";
  const showBar = Boolean(active) && !onSession;

  useEffect(() => {
    const done = () => {
      useGym.getState().setHydrated();
      const state = useGym.getState();
      if (
        state.onboardingComplete &&
        !state.active &&
        state.planned &&
        state.planned.date !== todayISO()
      ) {
        state.regenerate();
      }
    };
    const result = useGym.persist.rehydrate();
    if (result && typeof result.then === "function") {
      void result.then(done);
    } else {
      done();
    }
  }, []);

  if (!hydrated) return <Splash />;
  if (!onboardingComplete) return <Onboarding />;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className={`mx-auto min-h-dvh w-full max-w-lg lg:max-w-5xl ${showBar ? "pb-16" : ""}`}>
        {children}
      </div>
      {active && <RestTimer lift={showBar} />}
      {showBar && <ActiveWorkoutBar />}
      <TabBar />
      {shareSession && <ShareWorkoutSheet session={shareSession} />}
      <Toaster theme="dark" position="top-center" />
    </div>
  );
}
