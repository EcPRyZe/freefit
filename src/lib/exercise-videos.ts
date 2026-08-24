import { getExercise } from "./exercises";
import { patternOf, type Pattern } from "./patterns";

/** Curated ≤60s form clips from coaches with a real track record, not random gymfluencers. */
export interface FormClip {
  videoId: string;
  channel: string;
  title: string;
  seconds: number;
}

const NIPPARD = "Jeff Nippard";
const SQUAT_U = "Squat University";
const ETHIER = "Jeremy Ethier";

const BY_ID: Record<string, FormClip> = {
  "bb-squat": {
    videoId: "PPmvh7gBTi0",
    channel: NIPPARD,
    title: "Squat checklist",
    seconds: 53,
  },
  "bb-bench": {
    videoId: "hWbUlkb5Ms4",
    channel: NIPPARD,
    title: "Bench press in 5 steps",
    seconds: 51,
  },
  "inc-bb-bench": {
    videoId: "xGMqmmn5Z7Q",
    channel: NIPPARD,
    title: "Incline bench angle",
    seconds: 57,
  },
  deadlift: {
    videoId: "OXOQEIOGOdo",
    channel: SQUAT_U,
    title: "Deadlift with perfect form",
    seconds: 53,
  },
  rdl: {
    videoId: "d-hn_0sEpRQ",
    channel: SQUAT_U,
    title: "RDL without back pain",
    seconds: 58,
  },
  "lat-raise": {
    videoId: "f_OGBg2KxgY",
    channel: NIPPARD,
    title: "Lateral raise fixes",
    seconds: 58,
  },
  "face-pull": {
    videoId: "zEuseRjS7vg",
    channel: NIPPARD,
    title: "Best rear delt work",
    seconds: 55,
  },
  "pull-up": {
    videoId: "ZPG8OsHKXLw",
    channel: ETHIER,
    title: "The perfect pull-up",
    seconds: 58,
  },
};

const ALIAS: Record<string, string> = {
  "front-squat": "bb-squat",
  "goblet-squat": "bb-squat",
  "smith-squat": "bb-squat",
  "box-squat": "bb-squat",
  "hack-squat": "bb-squat",
  "air-squat": "bb-squat",
  zercher: "bb-squat",
  "db-bench": "bb-bench",
  "smith-bench": "bb-bench",
  "pause-bench": "bb-bench",
  "chest-press-machine": "bb-bench",
  "floor-press": "bb-bench",
  "db-floor-press": "bb-bench",
  "reverse-grip-bench": "bb-bench",
  "inc-db-press": "inc-bb-bench",
  "trap-bar-dl": "deadlift",
  "db-rdl": "rdl",
  "good-morning": "rdl",
  "cable-rdl": "rdl",
  "chin-up": "pull-up",
  "neutral-pull-up": "pull-up",
  "cable-lat-raise": "lat-raise",
  "behind-cable-lat-raise": "lat-raise",
  "reverse-fly": "face-pull",
  "rear-delt-fly": "face-pull",
  "pec-deck-reverse": "face-pull",
};

const BY_PATTERN: Partial<Record<Pattern, string>> = {
  squat: "bb-squat",
  hPress: "bb-bench",
  hinge: "rdl",
  raise: "lat-raise",
  rearDelt: "face-pull",
  vPull: "pull-up",
};

export function formClipFor(exerciseId: string): FormClip | null {
  const direct = BY_ID[exerciseId] ?? BY_ID[ALIAS[exerciseId]];
  if (direct) return direct;
  try {
    const pattern = patternOf(getExercise(exerciseId));
    const fallback = BY_PATTERN[pattern];
    if (fallback) return BY_ID[fallback] ?? null;
  } catch {
    return null;
  }
  return null;
}

export function youtubeFormSearch(name: string): string {
  const q = `${name} proper form short`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

export function youtubeEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
