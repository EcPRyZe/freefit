import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { exchangeStravaCode } from "@/lib/strava";
import { useGym } from "@/lib/store";

export const Route = createFileRoute("/strava/callback")({
  validateSearch: (s: Record<string, unknown>) => ({
    code: typeof s.code === "string" ? s.code : "",
    error: typeof s.error === "string" ? s.error : "",
  }),
  component: StravaCallback,
});

function StravaCallback() {
  const { code, error } = Route.useSearch();
  const connect = useGym((s) => s.connectStrava);
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Connecting Strava…");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (error || !code) {
        setMsg(error ? "Strava access was denied." : "Missing auth code.");
        window.setTimeout(() => navigate({ to: "/you" }), 1600);
        return;
      }
      const redirectUri = `${window.location.origin}/strava/callback`;
      const app = useGym.getState().integrations.stravaApp;
      const res = await exchangeStravaCode({
        data: {
          code,
          redirectUri,
          clientId: app?.clientId,
          clientSecret: app?.clientSecret,
        },
      });
      if (cancelled) return;
      if (!res.ok) {
        setMsg(res.error);
        window.setTimeout(() => navigate({ to: "/you" }), 2000);
        return;
      }
      connect(res.account);
      setMsg("Strava connected.");
      window.setTimeout(() => navigate({ to: "/you" }), 800);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [code, error, connect, navigate]);

  return (
    <main className="px-5 pt-[max(3rem,env(safe-area-inset-top))]">
      <p className="text-lg font-medium">{msg}</p>
      <p className="mt-2 text-sm text-muted">You’ll return to You in a moment.</p>
    </main>
  );
}
