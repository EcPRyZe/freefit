import { estimateKcal } from "./calories";
import { getExercise } from "./exercises";
import { sessionSets, sessionVolume } from "./stats";
import type { Profile, WorkoutSession } from "./types";
import { SET_STYLE_LABEL } from "./types";

export { estimateKcal };

export function sessionDescription(session: WorkoutSession): string {
  const lines = session.exercises.map((item) => {
    const ex = getExercise(item.exerciseId);
    const sets = item.sets.filter((s) => s.completed && !s.warmup);
    const bits = sets.map((s) =>
      s.weight > 0 ? `${s.weight}lb×${s.reps}` : `${s.reps} reps`,
    );
    const style =
      item.setStyle && item.setStyle !== "normal" ? ` (${SET_STYLE_LABEL[item.setStyle]})` : "";
    return `• ${ex.name}${style}: ${bits.join(", ") || "logged"}`;
  });
  return lines.join("\n");
}

export function healthSummary(session: WorkoutSession, profile: Profile): string {
  const kcal = estimateKcal(session, profile);
  const min = Math.max(1, Math.round(session.durationSec / 60));
  const start = new Date(session.startedAt ?? session.finishedAt ?? Date.now());
  return [
    "FreeFit — Traditional Strength Training",
    `Title: ${session.title}`,
    `Start: ${start.toLocaleString()}`,
    `Duration: ${min} min`,
    `Energy: ${kcal} kcal`,
    `Sets: ${sessionSets(session)} · Volume: ${Math.round(sessionVolume(session))} lb`,
    "",
    sessionDescription(session),
    "",
    "Add in Apple Health: Browse → Activity → Workouts → Add Data → Strength Training.",
  ].join("\n");
}

function xmlEscape(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function sessionToTcx(session: WorkoutSession, profile: Profile): string {
  const start = new Date(session.startedAt ?? session.finishedAt ?? Date.now());
  const iso = start.toISOString();
  const kcal = estimateKcal(session, profile);
  const notes = xmlEscape(`${session.title}\n${sessionDescription(session)}`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Activities>
    <Activity Sport="Other">
      <Id>${iso}</Id>
      <Lap StartTime="${iso}">
        <TotalTimeSeconds>${Math.max(1, session.durationSec)}</TotalTimeSeconds>
        <DistanceMeters>0</DistanceMeters>
        <Calories>${kcal}</Calories>
        <Intensity>Active</Intensity>
        <TriggerMethod>Manual</TriggerMethod>
      </Lap>
      <Notes>${notes}</Notes>
    </Activity>
  </Activities>
</TrainingCenterDatabase>
`;
}

export function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  return blob;
}

export async function shareWorkoutFiles(
  session: WorkoutSession,
  profile: Profile,
): Promise<"shared" | "copied" | "downloaded"> {
  const tcx = sessionToTcx(session, profile);
  const text = healthSummary(session, profile);
  const name = `freefit-${session.date}.tcx`;
  const file = new File([tcx], name, { type: "application/vnd.garmin.tcx+xml" });

  const nav = navigator as Navigator & {
    share?: (data: ShareData & { files?: File[] }) => Promise<void>;
    canShare?: (data: { files?: File[] }) => boolean;
  };

  if (nav.share) {
    try {
      if (!nav.canShare || nav.canShare({ files: [file] })) {
        await nav.share({
          title: session.title,
          text,
          files: [file],
        });
        return "shared";
      }
      await nav.share({ title: session.title, text });
      return "shared";
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return "shared";
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    downloadText(name, tcx, "application/xml");
    return "copied";
  } catch {
    downloadText(name, tcx, "application/xml");
    return "downloaded";
  }
}
