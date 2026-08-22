import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatShortDate } from "@/lib/format";
import type { Profile } from "@/lib/types";

export interface ChartPoint {
  date: string;
  weight: number;
  e1rm: number;
  reps: number;
}

export function ExerciseChart({
  points,
  units,
  height = 176,
}: {
  points: ChartPoint[];
  units: Profile["units"];
  height?: number;
}) {
  const bodyweight = points.length > 0 && points.every((p) => p.weight === 0);
  const data = points.map((p) => ({
    ...p,
    label: formatShortDate(p.date),
    display: bodyweight
      ? p.reps
      : units === "kg"
        ? Math.round((p.weight / 2.2046) * 10) / 10
        : p.weight,
  }));
  const key = "display";
  const unitLabel = bodyweight ? "reps" : units;

  if (points.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        Log this lift twice to unlock the chart.
      </p>
    );
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-muted)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--color-muted)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={36}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-raised)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(v) => [`${v} ${unitLabel}`, bodyweight ? "Reps" : "Top set"]}
          />
          <Line
            type="monotone"
            dataKey={key}
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-primary)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
