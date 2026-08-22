import { todayISO } from "./format";
import type { WorkoutSession } from "./types";

const TITLE: Record<string, string> = {
  HKWorkoutActivityTypeTraditionalStrengthTraining: "Strength Training",
  HKWorkoutActivityTypeFunctionalStrengthTraining: "Functional Strength",
  HKWorkoutActivityTypeCoreTraining: "Core Training",
  HKWorkoutActivityTypeHighIntensityIntervalTraining: "HIIT",
  HKWorkoutActivityTypeRunning: "Run",
  HKWorkoutActivityTypeWalking: "Walk",
  HKWorkoutActivityTypeCycling: "Ride",
  HKWorkoutActivityTypeYoga: "Yoga",
  HKWorkoutActivityTypeFlexibility: "Mobility",
  HKWorkoutActivityTypeElliptical: "Elliptical",
  HKWorkoutActivityTypeStairClimbing: "Stairs",
  HKWorkoutActivityTypeSwim: "Swim",
  HKWorkoutActivityTypeSwimming: "Swim",
};

function attr(tag: string, name: string): string {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m?.[1] ?? "";
}

function toMs(raw: string): number {
  const t = Date.parse(raw.replace(" +0000", "Z"));
  return Number.isFinite(t) ? t : Date.now();
}

export function parseHealthWorkouts(xml: string): WorkoutSession[] {
  const blocks = xml.match(/<Workout\b[^>]*>/g) ?? [];
  const out: WorkoutSession[] = [];
  for (const tag of blocks) {
    const type = attr(tag, "workoutActivityType");
    const startRaw = attr(tag, "startDate");
    const endRaw = attr(tag, "endDate");
    const duration = Number(attr(tag, "duration") || 0);
    const unit = attr(tag, "durationUnit");
    const start = toMs(startRaw);
    const end = endRaw ? toMs(endRaw) : start;
    let durationSec = Math.max(1, Math.round((end - start) / 1000));
    if (duration > 0) {
      durationSec =
        unit === "hr" || unit === "hour" || unit === "hours"
          ? Math.round(duration * 3600)
          : unit === "sec" || unit === "s"
            ? Math.round(duration)
            : Math.round(duration * 60);
    }
    const date = todayISO(new Date(start));
    const title = TITLE[type] ?? type.replace("HKWorkoutActivityType", "") ?? "Workout";
    out.push({
      id: `health-${start}`,
      title,
      focus: type.includes("Strength") ? "full" : "full",
      date,
      exercises: [],
      startedAt: start,
      finishedAt: end,
      durationSec,
      source: "health",
      externalId: `health:${start}`,
    });
  }
  return out;
}

export async function readHealthFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xml") || file.type.includes("xml") || file.type.includes("text")) {
    return file.text();
  }
  throw new Error("Pick export.xml from an Apple Health export (unzip first).");
}
