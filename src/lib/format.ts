import type { Profile } from "./types";

export function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function todayISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysAgoISO(n: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return todayISO(d);
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatLongDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function formatShortDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatWeekday(iso: string): string {
  return parseISODate(iso).toLocaleDateString(undefined, { weekday: "short" });
}

export function lbToKg(lb: number): number {
  return lb / 2.2046226218;
}

export function kgToLb(kg: number): number {
  return kg * 2.2046226218;
}

export function roundTo(value: number, increment: number): number {
  if (increment <= 0) return Math.round(value);
  return Math.round(value / increment) * increment;
}

export function displayWeight(lb: number, units: Profile["units"], incrementLb = 5): number {
  if (units === "kg") return roundTo(lbToKg(lb), incrementLb >= 5 ? 2.5 : 1);
  return roundTo(lb, incrementLb);
}

export function storeWeight(display: number, units: Profile["units"]): number {
  if (units === "kg") return kgToLb(display);
  return display;
}

export function formatWeight(lb: number, units: Profile["units"], incrementLb = 5): string {
  if (lb === 0) return "BW";
  const n = displayWeight(lb, units, incrementLb);
  const shown = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return `${shown} ${units}`;
}

export function formatWeightShort(lb: number, units: Profile["units"], incrementLb = 5): string {
  if (lb === 0) return "BW";
  const n = displayWeight(lb, units, incrementLb);
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}:${String(m % 60).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function formatRest(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function epley1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return weight * (1 + reps / 30);
}

export function volumeOf(weight: number, reps: number): number {
  return weight * reps;
}

export function formatHeight(inches: number, units: Profile["units"]): string {
  if (units === "kg") {
    const cm = Math.round(inches * 2.54);
    return `${cm} cm`;
  }
  const ft = Math.floor(inches / 12);
  const inn = Math.round(inches % 12);
  return `${ft}'${inn}"`;
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function biasLabel(bias: number): string | null {
  if (bias >= 2) return "Favorite";
  if (bias === 1) return "More often";
  if (bias === -1) return "Less often";
  if (bias <= -2) return "Hidden";
  return null;
}
