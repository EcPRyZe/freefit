import type { Exercise, Profile } from "./types";

const LB_PLATES = [45, 35, 25, 10, 5, 2.5];
const KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

function barWeightLb(ex: Exercise): number | null {
  const kit = ex.equipment;
  if (kit.includes("trapBar")) return 55;
  if (kit.includes("ezBar")) return 25;
  if (kit.includes("barbell")) return 45;
  return null;
}

function greedy(perSide: number, plates: number[]): { plate: number; count: number }[] {
  const out: { plate: number; count: number }[] = [];
  let left = Math.round(perSide * 4) / 4;
  for (const p of plates) {
    const n = Math.floor((left + 1e-6) / p);
    if (n <= 0) continue;
    out.push({ plate: p, count: n });
    left = Math.round((left - n * p) * 4) / 4;
  }
  return out;
}

function formatStack(parts: { plate: number; count: number }[], units: Profile["units"]): string {
  return parts
    .map((p) => {
      const n = Number.isInteger(p.plate) ? String(p.plate) : p.plate.toFixed(1);
      return p.count > 1 ? `${p.count}×${n}` : n;
    })
    .join(" + ");
}

/** Per-side plate math for barbell / EZ / trap. Null for machines, cables, DBs. */
export function plateMath(
  totalLb: number,
  units: Profile["units"],
  ex: Exercise,
): string | null {
  if (ex.bodyweight || totalLb <= 0) return null;
  const barLb = barWeightLb(ex);
  if (barLb == null) return null;
  if (totalLb + 0.05 < barLb) return null;

  if (units === "kg") {
    const barKg = barLb === 45 ? 20 : barLb === 55 ? 25 : 10;
    const totalKg = totalLb / 2.2046226218;
    const perSide = (totalKg - barKg) / 2;
    if (perSide < 1.2) return `Bar ${barKg} kg`;
    const parts = greedy(perSide, KG_PLATES);
    if (!parts.length) return `Bar ${barKg} kg`;
    return `Bar ${barKg} · ${formatStack(parts, "kg")} / side`;
  }

  const perSide = (totalLb - barLb) / 2;
  if (perSide < 2.4) return `Bar ${barLb}`;
  const parts = greedy(perSide, LB_PLATES);
  if (!parts.length) return `Bar ${barLb}`;
  return `Bar ${barLb} · ${formatStack(parts, "lb")} / side`;
}
