import { useState } from "react";
import { cn } from "@/lib/cn";
import { recoveryColor, recoveryLabel, type RecoveryMap } from "@/lib/recovery";
import { MUSCLE_LABEL, type Muscle } from "@/lib/types";

type View = "front" | "back";

interface Region {
  id: Muscle;
  d?: string;
  ellipses?: { cx: number; cy: number; rx: number; ry: number; rot?: number }[];
  rects?: { x: number; y: number; w: number; h: number; rx?: number }[];
}

const FRONT: Region[] = [
  { id: "neck", rects: [{ x: 90, y: 46, w: 20, h: 18, rx: 6 }] },
  {
    id: "frontDelts",
    ellipses: [
      { cx: 68, cy: 76, rx: 22, ry: 16 },
      { cx: 132, cy: 76, rx: 22, ry: 16 },
    ],
  },
  {
    id: "sideDelts",
    ellipses: [
      { cx: 48, cy: 80, rx: 10, ry: 14 },
      { cx: 152, cy: 80, rx: 10, ry: 14 },
    ],
  },
  {
    id: "chest",
    d: "M100 70c-18 2-32 14-34 34-1 12 8 24 22 28 8 2 12-4 12-12V70zm0 0c18 2 32 14 34 34 1 12-8 24-22 28-8 2-12-4-12-12V70z",
  },
  {
    id: "biceps",
    ellipses: [
      { cx: 46, cy: 118, rx: 13, ry: 24, rot: 8 },
      { cx: 154, cy: 118, rx: 13, ry: 24, rot: -8 },
    ],
  },
  {
    id: "forearms",
    ellipses: [
      { cx: 38, cy: 172, rx: 11, ry: 28, rot: 10 },
      { cx: 162, cy: 172, rx: 11, ry: 28, rot: -10 },
    ],
  },
  {
    id: "abs",
    rects: [
      { x: 88, y: 122, w: 11, h: 16, rx: 3 },
      { x: 101, y: 122, w: 11, h: 16, rx: 3 },
      { x: 88, y: 140, w: 11, h: 16, rx: 3 },
      { x: 101, y: 140, w: 11, h: 16, rx: 3 },
      { x: 88, y: 158, w: 11, h: 15, rx: 3 },
      { x: 101, y: 158, w: 11, h: 15, rx: 3 },
      { x: 89, y: 175, w: 22, h: 14, rx: 3 },
    ],
  },
  {
    id: "obliques",
    d: "M78 124c-6 18-4 40 0 58 8-6 12-24 12-40 0-10-4-18-12-18zm44 0c6 18 4 40 0 58-8-6-12-24-12-40 0-10 4-18 12-18z",
  },
  {
    id: "quads",
    ellipses: [
      { cx: 78, cy: 268, rx: 22, ry: 58 },
      { cx: 122, cy: 268, rx: 22, ry: 58 },
    ],
  },
  {
    id: "adductors",
    ellipses: [
      { cx: 94, cy: 268, rx: 8, ry: 42 },
      { cx: 106, cy: 268, rx: 8, ry: 42 },
    ],
  },
  {
    id: "calves",
    ellipses: [
      { cx: 78, cy: 372, rx: 14, ry: 38 },
      { cx: 122, cy: 372, rx: 14, ry: 38 },
    ],
  },
];

const BACK: Region[] = [
  { id: "neck", rects: [{ x: 90, y: 46, w: 20, h: 16, rx: 6 }] },
  {
    id: "traps",
    d: "M100 58c-24 6-42 18-50 32 16 4 34 0 50-10 16 10 34 14 50 10-8-14-26-26-50-32z",
  },
  {
    id: "rearDelts",
    ellipses: [
      { cx: 62, cy: 84, rx: 18, ry: 14 },
      { cx: 138, cy: 84, rx: 18, ry: 14 },
    ],
  },
  {
    id: "triceps",
    ellipses: [
      { cx: 46, cy: 122, rx: 12, ry: 26, rot: 8 },
      { cx: 154, cy: 122, rx: 12, ry: 26, rot: -8 },
    ],
  },
  {
    id: "upperBack",
    d: "M100 92c-16 4-30 14-34 28 12 8 24 8 34 4 10 4 22 4 34-4-4-14-18-24-34-28z",
  },
  {
    id: "lats",
    d: "M100 112c-20 10-42 24-48 48-4 16 4 36 16 42 6-18 18-44 32-64zm0 0c20 10 42 24 48 48 4 16-4 36-16 42-6-18-18-44-32-64z",
  },
  {
    id: "lowerBack",
    d: "M88 168c-4 14-2 30 4 42h16c6-12 8-28 4-42-8 2-16 2-24 0z",
  },
  {
    id: "forearms",
    ellipses: [
      { cx: 38, cy: 176, rx: 11, ry: 28, rot: 10 },
      { cx: 162, cy: 176, rx: 11, ry: 28, rot: -10 },
    ],
  },
  {
    id: "glutes",
    ellipses: [
      { cx: 82, cy: 228, rx: 22, ry: 20 },
      { cx: 118, cy: 228, rx: 22, ry: 20 },
    ],
  },
  {
    id: "hamstrings",
    ellipses: [
      { cx: 78, cy: 292, rx: 20, ry: 52 },
      { cx: 122, cy: 292, rx: 20, ry: 52 },
    ],
  },
  {
    id: "calves",
    ellipses: [
      { cx: 78, cy: 372, rx: 14, ry: 38 },
      { cx: 122, cy: 372, rx: 14, ry: 38 },
    ],
  },
];

function MuscleShape({
  region,
  fill,
  active,
  onSelect,
}: {
  region: Region;
  fill: string;
  active: boolean;
  onSelect: () => void;
}) {
  const stroke = active ? "#f3f3f4" : "#070708";
  const sw = active ? 2 : 1.5;
  const common = {
    fill,
    stroke,
    strokeWidth: sw,
    onClick: onSelect,
    className: "cursor-pointer transition-[filter] duration-150",
    style: active ? { filter: "brightness(1.12)" } : undefined,
  };

  return (
    <g>
      {region.d && <path d={region.d} {...common} />}
      {region.ellipses?.map((e, i) => (
        <ellipse
          key={i}
          cx={e.cx}
          cy={e.cy}
          rx={e.rx}
          ry={e.ry}
          transform={e.rot ? `rotate(${e.rot} ${e.cx} ${e.cy})` : undefined}
          {...common}
        />
      ))}
      {region.rects?.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx ?? 4} {...common} />
      ))}
    </g>
  );
}

function levelFill(value: number): string {
  if (value < 0) return "var(--color-raised)";
  return recoveryColor(value);
}

function Figure({
  view,
  recovery,
  selected,
  onSelect,
  mode,
}: {
  view: View;
  recovery: RecoveryMap;
  selected: Muscle | null;
  onSelect: (m: Muscle) => void;
  mode: "recovery" | "strength";
}) {
  const parts = view === "front" ? FRONT : BACK;
  const kind = mode === "strength" ? "strength" : "recovery";
  return (
    <svg
      viewBox="0 0 200 430"
      className="mx-auto block h-[min(48vh,380px)] w-auto max-w-full"
      role="img"
      aria-label={view === "front" ? `Front muscle ${kind}` : `Back muscle ${kind}`}
    >
      <ellipse cx="100" cy="28" rx="16" ry="18" fill="#2a2a30" />
      <ellipse cx="100" cy="214" rx="26" ry="14" fill="#2a2a30" />
      <circle cx="78" cy="332" r="7" fill="#2a2a30" />
      <circle cx="122" cy="332" r="7" fill="#2a2a30" />
      {view === "front" ? (
        <>
          <ellipse cx="32" cy="204" rx="8" ry="6" fill="#2a2a30" />
          <ellipse cx="168" cy="204" rx="8" ry="6" fill="#2a2a30" />
          <ellipse cx="78" cy="418" rx="12" ry="6" fill="#2a2a30" />
          <ellipse cx="122" cy="418" rx="12" ry="6" fill="#2a2a30" />
        </>
      ) : (
        <>
          <ellipse cx="32" cy="208" rx="8" ry="6" fill="#2a2a30" />
          <ellipse cx="168" cy="208" rx="8" ry="6" fill="#2a2a30" />
          <ellipse cx="78" cy="418" rx="12" ry="6" fill="#2a2a30" />
          <ellipse cx="122" cy="418" rx="12" ry="6" fill="#2a2a30" />
        </>
      )}
      {parts.map((p) => (
        <MuscleShape
          key={p.id + view}
          region={p}
          fill={levelFill(recovery[p.id])}
          active={selected === p.id}
          onSelect={() => onSelect(p.id)}
        />
      ))}
    </svg>
  );
}

export function BodyMap({
  recovery,
  selected,
  onSelect,
  mode = "recovery",
}: {
  recovery: RecoveryMap;
  selected: Muscle | null;
  onSelect: (m: Muscle | null) => void;
  mode?: "recovery" | "strength";
}) {
  const [view, setView] = useState<View>("front");
  const ranked = (Object.entries(recovery) as [Muscle, number][])
    .filter(([, v]) => (mode === "strength" ? v >= 0 : true))
    .sort((a, b) => a[1] - b[1])
    .slice(0, 4);

  return (
    <div>
      <div className="mb-2 flex items-center justify-center">
        <div className="inline-flex rounded-full bg-raised p-1 shadow-border">
          {(["front", "back"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "h-8 min-w-20 rounded-full px-4 text-sm font-medium capitalize transition-colors duration-150",
                view === v ? "bg-fg text-bg" : "text-muted hover:text-fg",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <Figure
        view={view}
        recovery={recovery}
        selected={selected}
        onSelect={(m) => onSelect(selected === m ? null : m)}
        mode={mode}
      />
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted">
        {mode === "strength" ? (
          <>
            <LegendDot color="var(--color-danger)" label="Developing" />
            <LegendDot color="var(--color-warn)" label="Intermediate" />
            <LegendDot color="var(--color-fresh)" label="Elite" />
          </>
        ) : (
          <>
            <LegendDot color="var(--color-danger)" label="Sore" />
            <LegendDot color="var(--color-warn)" label="Recovering" />
            <LegendDot color="var(--color-fresh)" label="Fresh" />
          </>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {ranked.map(([m, pct]) => (
          <button
            key={m}
            type="button"
            onClick={() => onSelect(selected === m ? null : m)}
            className={cn(
              "flex items-center justify-between rounded-xl bg-raised px-3 py-2 text-left text-xs",
              selected === m && "shadow-[0_0_0_1px_var(--color-fg)]",
            )}
          >
            <span>{MUSCLE_LABEL[m]}</span>
            <span className="font-medium tabular" style={{ color: levelFill(pct) }}>
              {mode === "strength"
                ? `${Math.round(pct)} · ${strengthChip(pct)}`
                : `${Math.round(pct)}% ${recoveryLabel(pct)}`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function strengthChip(score: number): string {
  if (score < 30) return "Dev";
  if (score < 50) return "Novice";
  if (score < 70) return "Int";
  if (score < 88) return "Adv";
  return "Elite";
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
