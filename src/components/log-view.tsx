import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { estimateKcal, exerciseKcal } from "@/lib/calories";
import { getExercise } from "@/lib/exercises";
import { formatDuration, formatShortDate, formatWeight } from "@/lib/format";
import {
  currentStreak,
  historyByDate,
  monthDays,
  sessionSets,
  sessionVolume,
  volumeThisWeek,
  weeklyVolumeSeries,
  workoutsThisWeek,
} from "@/lib/stats";
import { useGym } from "@/lib/store";
import { parseFitbodCsv } from "@/lib/fitbod-import";
import { toast } from "sonner";
import { FOCUS_LABEL, SET_STYLE_LABEL } from "@/lib/types";
import { cn } from "@/lib/cn";

export function LogView() {
  const history = useGym((s) => s.history);
  const profile = useGym((s) => s.profile);
  const openShare = useGym((s) => s.openShare);
  const ingestImport = useGym((s) => s.ingestImport);
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [openId, setOpenId] = useState<string | null>(null);

  const byDate = useMemo(() => historyByDate(history), [history]);
  const days = monthDays(cursor.y, cursor.m);
  const weekVol = volumeThisWeek(history);
  const weekVolDisplay = profile.units === "kg" ? weekVol / 2.2046226218 : weekVol;
  const series = useMemo(() => weeklyVolumeSeries(history), [history]);
  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="px-5 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Log</h1>
        <label className="shrink-0">
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              void file.text().then((text) => {
                try {
                  const parsed = parseFitbodCsv(text);
                  const result = ingestImport({
                    sessions: parsed.sessions,
                    customs: parsed.customs,
                  });
                  toast.success(
                    result.sessions
                      ? `Imported ${result.sessions} sessions`
                      : "Already up to date",
                  );
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not read CSV");
                }
              });
            }}
          />
          <span className="inline-flex h-10 cursor-pointer items-center rounded-xl bg-raised px-3 text-sm font-medium text-muted">
            Import CSV
          </span>
        </label>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <Stat label="This week" value={String(workoutsThisWeek(history))} unit="sessions" />
        <Stat
          label="Volume"
          value={(weekVolDisplay / 1000).toFixed(1)}
          unit={profile.units === "kg" ? "k kg" : "k lb"}
        />
        <Stat label="Streak" value={String(currentStreak(history))} unit="days" />
      </div>

      <section className="mt-6 rounded-3xl bg-surface p-4 shadow-border">
        <p className="text-sm font-medium text-muted">Weekly volume</p>
        <div className="mt-2 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} barSize={16}>
              <XAxis dataKey="label" tick={{ fill: "var(--color-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "color-mix(in oklab, var(--color-fg) 4%, transparent)" }}
                contentStyle={{
                  background: "var(--color-raised)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v) => [
                  `${Number(v).toLocaleString()} ${profile.units}`,
                  "Volume",
                ]}
              />
              <Bar dataKey="volume" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">{monthLabel}</h2>
          <div className="flex gap-1">
            <button
              type="button"
              className="size-10 rounded-lg text-muted hover:bg-raised"
              onClick={() =>
                setCursor((c) => {
                  const d = new Date(c.y, c.m - 1, 1);
                  return { y: d.getFullYear(), m: d.getMonth() };
                })
              }
              aria-label="Previous month"
            >
              ‹
            </button>
            <button
              type="button"
              className="size-10 rounded-lg text-muted hover:bg-raised"
              onClick={() =>
                setCursor((c) => {
                  const d = new Date(c.y, c.m + 1, 1);
                  return { y: d.getFullYear(), m: d.getMonth() };
                })
              }
              aria-label="Next month"
            >
              ›
            </button>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-faint">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={d + i}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((d) => {
            const hits = byDate.get(d.iso)?.length ?? 0;
            return (
              <div
                key={d.iso}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-lg text-xs tabular",
                  d.inMonth ? "text-fg" : "text-faint/60",
                  hits > 0 && "bg-primary/20 text-primary font-medium",
                )}
              >
                {Number(d.iso.slice(-2))}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="font-medium">History</h2>
        {history.length === 0 && (
          <p className="rounded-2xl bg-surface px-4 py-8 text-center text-sm text-muted shadow-border">
            Finished workouts land here.
          </p>
        )}
        {history.map((w) => {
          const open = openId === w.id;
          const kcal = estimateKcal(w, profile);
          return (
            <article key={w.id} className="overflow-hidden rounded-2xl bg-surface shadow-border">
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
                onClick={() => setOpenId(open ? null : w.id)}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {w.title}
                    {w.source && w.source !== "freefit" ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-faint">
                        {w.source === "strava" ? "Strava" : w.source === "health" ? "Health" : "Fitbod"}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted">
                    {formatShortDate(w.date)} · {FOCUS_LABEL[w.focus]} · {formatDuration(w.durationSec)} ·{" "}
                    {sessionSets(w)} sets
                    {w.avgHr ? ` · ${w.avgHr} bpm` : ""}
                  </p>
                </div>
                <span className="text-right">
                  <span className="block text-sm font-medium tabular">{kcal} kcal</span>
                  <span className="text-xs tabular text-faint">{(sessionVolume(w) / 1000).toFixed(1)}k vol</span>
                </span>
              </button>
              {open && (
                <ul className="border-t border-border px-4 py-3 text-sm">
                  {w.exercises.map((item) => {
                    const ex = getExercise(item.exerciseId);
                    const top = item.sets.filter((s) => !s.warmup && s.completed).sort((a, b) => b.weight - a.weight)[0];
                    const piece = exerciseKcal(item, profile, w);
                    return (
                      <li key={item.instanceId} className="flex justify-between gap-3 py-1.5">
                        <span className="min-w-0 text-muted">
                          {ex.name}
                          {(item.setStyle ?? "normal") !== "normal"
                            ? ` · ${SET_STYLE_LABEL[item.setStyle]}`
                            : ""}
                        </span>
                        <span className="shrink-0 tabular text-right">
                          {item.sets.filter((s) => s.completed && !s.warmup).length} × {top?.reps ?? 0}
                          {top && top.weight > 0
                            ? ` @ ${formatWeight(top.weight, profile.units, ex.incrementLb)}`
                            : ""}
                          <span className="ml-2 text-faint">{piece} kcal</span>
                        </span>
                      </li>
                    );
                  })}
                  <li className="pt-2 text-xs text-faint">
                    {w.avgHr
                      ? `Calories from Keytel (avg ${w.avgHr} bpm) using age, sex, and weight.`
                      : "Calories: ACSM METs × duration (sets + rest) × your BMR. Connect HR for the wearable estimate."}
                  </li>
                  <li className="pt-2">
                    <button
                      type="button"
                      className="text-sm font-medium text-primary"
                      onClick={() => openShare(w)}
                    >
                      Share to Strava / Health
                    </button>
                  </li>
                </ul>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl bg-surface px-3 py-4 shadow-border">
      <p className="text-[11px] font-medium uppercase tracking-wider text-faint">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold tabular leading-none">{value}</p>
      <p className="mt-1 text-xs text-muted">{unit}</p>
    </div>
  );
}
