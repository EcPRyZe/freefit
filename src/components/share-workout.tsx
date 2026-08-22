import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { estimateKcal, healthSummary, sessionDescription, sessionToTcx, shareWorkoutFiles, downloadText } from "@/lib/workout-export";
import { sessionSets } from "@/lib/stats";
import { stravaCreateActivity } from "@/lib/strava";
import { useGym } from "@/lib/store";
import type { WorkoutSession } from "@/lib/types";

export function ShareWorkoutSheet({ session }: { session: WorkoutSession }) {
  const profile = useGym((s) => s.profile);
  const integrations = useGym((s) => s.integrations);
  const dismiss = useGym((s) => s.dismissShare);
  const patchStrava = useGym((s) => s.patchStravaTokens);
  const [busy, setBusy] = useState<"strava" | "health" | null>(null);

  const kcal = estimateKcal(session, profile);
  const min = Math.max(1, Math.round(session.durationSec / 60));

  useEffect(() => {
    if (integrations.autoStrava && integrations.strava) void sendStrava(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendHealth(manual: boolean) {
    setBusy("health");
    try {
      const result = await shareWorkoutFiles(session, profile);
      if (manual) {
        toast.success(
          result === "shared"
            ? "Shared — pick Health if it appears"
            : result === "copied"
              ? "Copied + downloaded TCX"
              : "TCX downloaded",
        );
      }
    } finally {
      setBusy(null);
    }
  }

  async function sendStrava(manual: boolean) {
    const account = integrations.strava;
    if (!account) {
      const tcx = sessionToTcx(session, profile);
      downloadText(`freefit-${session.date}.tcx`, tcx, "application/xml");
      window.open("https://www.strava.com/upload/select", "_blank", "noopener");
      toast("TCX downloaded — upload it in Strava");
      return;
    }
    setBusy("strava");
    try {
      const start = new Date(session.startedAt ?? session.finishedAt ?? Date.now());
      const local = new Date(start.getTime() - start.getTimezoneOffset() * 60000)
        .toISOString()
        .replace("Z", "");
      const res = await stravaCreateActivity({
        data: {
          accessToken: account.accessToken,
          refreshToken: account.refreshToken,
          expiresAt: account.expiresAt,
          name: session.title,
          elapsedSec: session.durationSec,
          description: sessionDescription(session),
          startDate: local,
          clientId: integrations.stravaApp?.clientId,
          clientSecret: integrations.stravaApp?.clientSecret,
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (res.account) patchStrava(res.account);
      toast.success("Posted to Strava");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Strava upload failed");
      if (manual) {
        const tcx = sessionToTcx(session, profile);
        downloadText(`freefit-${session.date}.tcx`, tcx, "application/xml");
        window.open("https://www.strava.com/upload/select", "_blank", "noopener");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" className="absolute inset-0 bg-bg/70" aria-label="Close" onClick={dismiss} />
      <div className="relative w-full max-w-lg rounded-t-3xl bg-surface p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-border">
        <p className="text-xs font-medium uppercase tracking-wider text-faint">Share session</p>
        <h2 className="mt-1 text-xl font-semibold">{session.title}</h2>
        <p className="mt-1 text-sm text-muted">
          {min} min · {sessionSets(session)} sets · {kcal} kcal
        </p>

        <div className="mt-5 grid gap-2">
          <Button
            size="lg"
            className="w-full"
            disabled={busy !== null}
            onClick={() => void sendStrava(true)}
          >
            {integrations.strava ? "Send to Strava" : "Upload TCX to Strava"}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            disabled={busy !== null}
            onClick={() => void sendHealth(true)}
          >
            Add to Apple Health
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={() => {
              window.location.href = "x-apple-health://";
            }}
          >
            Open Health app
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={async () => {
              await navigator.clipboard.writeText(healthSummary(session, profile));
              toast.success("Workout copied");
            }}
          >
            Copy Health summary
          </Button>
          <Button variant="ghost" size="lg" className="w-full" onClick={dismiss}>
            Not now
          </Button>
        </div>
        <p className="mt-3 text-xs text-faint">
          Safari can share into Health. Websites cannot write to HealthKit directly — the summary +
          TCX is the supported path.
        </p>
      </div>
    </div>
  );
}
