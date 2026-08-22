import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { parseHealthWorkouts, readHealthFile } from "@/lib/health-import";
import { parseFitbodCsv } from "@/lib/fitbod-import";
import { todayISO } from "@/lib/format";
import { getStravaConfig, stravaListActivities } from "@/lib/strava";
import { bleHrSupported, connectBleHr, nativeHrAvailable } from "@/lib/heart-rate";
import { useGym } from "@/lib/store";
import { cn } from "@/lib/cn";
import type { WorkoutSession } from "@/lib/types";

export function IntegrationsCard() {
  const integrations = useGym((s) => s.integrations);
  const setAutoStrava = useGym((s) => s.setAutoStrava);
  const setAutoHealth = useGym((s) => s.setAutoHealth);
  const disconnect = useGym((s) => s.disconnectStrava);
  const setStravaApp = useGym((s) => s.setStravaApp);
  const ingestImport = useGym((s) => s.ingestImport);
  const importSessions = useGym((s) => s.importSessions);
  const patchStrava = useGym((s) => s.patchStravaTokens);
  const [oauth, setOauth] = useState<{ enabled: boolean; clientId: string } | null>(null);
  const [clientId, setClientId] = useState(integrations.stravaApp?.clientId ?? "");
  const [clientSecret, setClientSecret] = useState(integrations.stravaApp?.clientSecret ?? "");
  const [callback, setCallback] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getStravaConfig().then((c) => setOauth({ enabled: c.enabled, clientId: c.clientId }));
    setCallback(`${window.location.origin}/strava/callback`);
  }, []);

  const effectiveId = clientId.trim() || oauth?.clientId || "";
  const canOauth = Boolean(effectiveId && (clientSecret.trim() || oauth?.enabled));

  function saveKeys() {
    const id = clientId.trim();
    const secret = clientSecret.trim();
    setStravaApp(id && secret ? { clientId: id, clientSecret: secret } : null);
    toast.success(id && secret ? "Strava API keys saved on this device" : "Keys cleared");
  }

  function connectStrava() {
    if (!canOauth || !effectiveId) {
      toast.error("Paste your Strava Client ID and Secret first.");
      return;
    }
    saveKeys();
    const redirect = `${window.location.origin}/strava/callback`;
    const url = new URL("https://www.strava.com/oauth/authorize");
    url.searchParams.set("client_id", effectiveId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", redirect);
    url.searchParams.set("approval_prompt", "auto");
    url.searchParams.set("scope", "activity:write,activity:read_all,read");
    window.location.assign(url.toString());
  }

  async function importStrava() {
    const account = integrations.strava;
    if (!account) return;
    setBusy(true);
    try {
      const res = await stravaListActivities({
        data: {
          accessToken: account.accessToken,
          refreshToken: account.refreshToken,
          expiresAt: account.expiresAt,
          clientId: integrations.stravaApp?.clientId,
          clientSecret: integrations.stravaApp?.clientSecret,
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (res.account) patchStrava(res.account);
      const sessions: WorkoutSession[] = res.activities.map((a) => {
        const start = Date.parse(a.start);
        const when = Number.isFinite(start) ? new Date(start) : new Date();
        return {
          id: `strava-${a.id}`,
          title: a.name || a.sport,
          focus: "full",
          date: todayISO(when),
          exercises: [],
          startedAt: when.getTime(),
          finishedAt: when.getTime() + a.elapsedSec * 1000,
          durationSec: a.elapsedSec,
          source: "strava",
          externalId: `strava:${a.id}`,
        };
      });
      const n = importSessions(sessions);
      toast.success(n ? `Imported ${n} Strava activities` : "Already up to date");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  async function importFitbod(file: File) {
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = parseFitbodCsv(text);
      const result = ingestImport({ sessions: parsed.sessions, customs: parsed.customs });
      toast.success(
        result.sessions
          ? `Imported ${result.sessions} sessions` +
              (result.exercises ? ` · ${result.exercises} custom movements` : "")
          : "Already up to date",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read CSV");
    } finally {
      setBusy(false);
    }
  }

  async function importHealth(file: File) {
    setBusy(true);
    try {
      const xml = await readHealthFile(file);
      const n = importSessions(parseHealthWorkouts(xml));
      toast.success(n ? `Imported ${n} Health workouts` : "No new Health workouts found");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read export");
    } finally {
      setBusy(false);
    }
  }

  const stravaOn = Boolean(integrations.strava);

  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium text-muted">Integrations</h2>
      <p className="mt-1 text-xs text-faint">
        Strava OAuth, Apple Health import/export, and heart rate. Watch and AirPods Pro 3 stream
        through HealthKit on a native iOS build; BLE straps work in this web app on Chrome.
      </p>

      <div className="mt-3 space-y-2">
        <div className="rounded-2xl bg-surface px-4 py-4 shadow-border">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">Strava</p>
              <p className="mt-0.5 text-xs text-muted">
                {stravaOn
                  ? `Connected as ${integrations.strava?.athleteName || "athlete"}`
                  : "Connect to post Weight Training and pull your activity log"}
              </p>
            </div>
            {stravaOn ? (
              <Button variant="ghost" size="sm" onClick={disconnect}>
                Disconnect
              </Button>
            ) : (
              <Button size="sm" onClick={connectStrava}>
                Connect
              </Button>
            )}
          </div>

          {!stravaOn && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-faint">
                Create an API app at{" "}
                <a
                  className="text-primary"
                  href="https://www.strava.com/settings/api"
                  target="_blank"
                  rel="noreferrer"
                >
                  strava.com/settings/api
                </a>
                . Authorization Callback Domain can be this host; paste the full callback URL below
                into your app notes.
              </p>
              <label className="block text-xs text-muted">
                Client ID
                <input
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  inputMode="numeric"
                  className="mt-1 h-11 w-full rounded-xl bg-raised px-3 text-sm text-fg outline-none"
                />
              </label>
              <label className="block text-xs text-muted">
                Client Secret
                <input
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  type="password"
                  className="mt-1 h-11 w-full rounded-xl bg-raised px-3 text-sm text-fg outline-none"
                />
              </label>
              <button type="button" onClick={saveKeys} className="text-xs font-medium text-primary">
                Save keys on this device
              </button>
              {callback && (
                <p className="break-all text-[11px] text-faint">Callback: {callback}</p>
              )}
            </div>
          )}

          <label className="mt-3 flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">Auto-send after workout</span>
            <Toggle on={integrations.autoStrava} disabled={!stravaOn} onChange={setAutoStrava} />
          </label>
          {stravaOn && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-3 w-full"
              disabled={busy}
              onClick={() => void importStrava()}
            >
              Import from Strava
            </Button>
          )}
        </div>

        <div className="rounded-2xl bg-surface px-4 py-4 shadow-border">
          <p className="font-medium">Apple Health</p>
          <p className="mt-0.5 text-xs text-muted">
            After a session, share the TCX into Health (or add Strength Training manually). Import
            your Health export to bring past workouts into Log.
          </p>
          <label className="mt-3 flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">Prompt after each workout</span>
            <Toggle on={integrations.autoHealth} onChange={setAutoHealth} />
          </label>
          <label className="mt-3 block">
            <span className="sr-only">Import Apple Health export.xml</span>
            <input
              type="file"
              accept=".xml,text/xml,application/xml"
              className="hidden"
              id="health-xml"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void importHealth(file);
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              disabled={busy}
              onClick={() => document.getElementById("health-xml")?.click()}
            >
              Import Health export.xml
            </Button>
          </label>
        </div>

        <div className="rounded-2xl bg-surface px-4 py-4 shadow-border">
          <p className="font-medium">Fitbod CSV</p>
          <p className="mt-0.5 text-xs text-muted">
            Upload WorkoutExport.csv. Sessions land in Log, previous weights drive today’s
            suggestions, and unknown lifts become custom exercises. Demo data is left alone.
          </p>
          <label className="mt-3 block">
            <span className="sr-only">Import Fitbod CSV</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              id="fitbod-csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void importFitbod(file);
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              disabled={busy}
              onClick={() => document.getElementById("fitbod-csv")?.click()}
            >
              Import WorkoutExport.csv
            </Button>
          </label>
        </div>

        <div className="rounded-2xl bg-surface px-4 py-4 shadow-border">
          <p className="font-medium">Heart rate</p>
          <p className="mt-0.5 text-xs text-muted">
            {nativeHrAvailable()
              ? "This iOS build can read Apple Watch and AirPods Pro 3 via HealthKit during a workout."
              : bleHrSupported()
                ? "Connect a Bluetooth chest strap or arm band. Apple Watch and AirPods Pro 3 only stream HR through HealthKit in the native iOS app."
                : "Safari can't read Watch, AirPods, or BLE straps. Pair a Polar/Wahoo strap in Chrome, or wrap FreeFit with Capacitor for HealthKit (Watch + AirPods Pro 3)."}
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3 w-full"
            disabled={busy || (!bleHrSupported() && !nativeHrAvailable())}
            onClick={() => {
              void connectBleHr()
                .then((s) => toast.success(`Connected · ${s.deviceName || "sensor"}`))
                .catch((err) => {
                  const msg = err instanceof Error ? err.message : "";
                  if (/cancelled|canceled/i.test(msg)) return;
                  toast.error(msg || "No heart-rate sensor found");
                });
            }}
          >
            Pair Bluetooth HR strap
          </Button>
        </div>
      </div>
    </section>
  );
}

function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-7 w-11 shrink-0 rounded-full transition-colors duration-150 disabled:opacity-40",
        on ? "bg-primary" : "bg-raised shadow-border",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-6 rounded-full bg-fg transition-transform duration-150",
          on ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
