import type { Exercise, Muscle } from "./types";
import { EXTRA_EXERCISES } from "./exercises-extra";

function e(
  id: string,
  name: string,
  primary: Muscle,
  equipment: Exercise["equipment"],
  extra: Partial<Exercise> = {},
): Exercise {
  return {
    id,
    name,
    primary,
    secondary: [],
    equipment,
    mechanic: "isolation",
    defaultWeightLb: 20,
    incrementLb: 5,
    instructions: [],
    ...extra,
  };
}

export const EXERCISES: Exercise[] = [
  e("bb-bench", "Barbell Bench Press", "chest", ["barbell", "bench"], {
    secondary: ["frontDelts", "triceps"],
    mechanic: "compound",
    defaultWeightLb: 135,
    incrementLb: 5,
    instructions: [
      "Plant feet, unrack over mid-chest.",
      "Lower with elbows ~45° until the bar touches.",
      "Drive the bar back over the shoulders.",
    ],
  }),
  e("inc-bb-bench", "Incline Barbell Bench", "chest", ["barbell", "bench"], {
    secondary: ["frontDelts", "triceps"],
    mechanic: "compound",
    defaultWeightLb: 115,
    incrementLb: 5,
    instructions: [
      "Set the bench 15–30°.",
      "Lower to the upper chest, pause, press.",
    ],
  }),
  e("db-bench", "Dumbbell Bench Press", "chest", ["dumbbell", "bench"], {
    secondary: ["frontDelts", "triceps"],
    mechanic: "compound",
    defaultWeightLb: 55,
    incrementLb: 5,
    instructions: [
      "Dumbbells over mid-chest, wrists stacked.",
      "Lower until elbows are just below the bench.",
    ],
  }),
  e("inc-db-press", "Incline Dumbbell Press", "chest", ["dumbbell", "bench"], {
    secondary: ["frontDelts", "triceps"],
    mechanic: "compound",
    defaultWeightLb: 50,
    incrementLb: 5,
    instructions: ["Bench 30°. Press in a slight arc, don't bang the bells."],
  }),
  e("db-fly", "Dumbbell Fly", "chest", ["dumbbell", "bench"], {
    defaultWeightLb: 25,
    incrementLb: 2.5,
    instructions: ["Soft elbows. Open until a stretch, hug the bells together."],
  }),
  e("cable-fly", "Cable Fly", "chest", ["cable"], {
    defaultWeightLb: 25,
    incrementLb: 5,
    instructions: ["Step forward, slight lean. Sweep hands together at chest height."],
  }),
  e("push-up", "Push-Up", "chest", ["bodyweight"], {
    secondary: ["frontDelts", "triceps"],
    mechanic: "compound",
    defaultWeightLb: 0,
    incrementLb: 5,
    bodyweight: true,
    instructions: ["Body in a line. Chest to a fist off the floor, lock out."],
  }),
  e("chest-press-machine", "Machine Chest Press", "chest", ["machine"], {
    secondary: ["frontDelts", "triceps"],
    mechanic: "compound",
    defaultWeightLb: 90,
    instructions: ["Handles at mid-chest. Press without shrugging."],
  }),
  e("chest-dip", "Chest Dip", "chest", ["dipStation"], {
    secondary: ["triceps", "frontDelts"],
    mechanic: "compound",
    defaultWeightLb: 0,
    incrementLb: 5,
    bodyweight: true,
    instructions: ["Lean forward, elbows out. Descend until shoulders are stretched."],
  }),
  e("smith-bench", "Smith Machine Bench", "chest", ["smith", "bench"], {
    secondary: ["frontDelts", "triceps"],
    mechanic: "compound",
    defaultWeightLb: 135,
  }),

  e("deadlift", "Conventional Deadlift", "lats", ["barbell"], {
    secondary: ["hamstrings", "glutes", "lowerBack", "traps", "forearms"],
    mechanic: "compound",
    defaultWeightLb: 185,
    incrementLb: 10,
    primary: "lowerBack",
    instructions: [
      "Bar over mid-foot, shins close.",
      "Brace, push the floor away, lock hips and knees together.",
      "Lower under control — don't bounce.",
    ],
  }),
  e("trap-bar-dl", "Trap Bar Deadlift", "quads", ["trapBar"], {
    secondary: ["glutes", "hamstrings", "traps", "lowerBack"],
    mechanic: "compound",
    defaultWeightLb: 185,
    incrementLb: 10,
    instructions: ["Stand centered. Drive through the floor, stand tall."],
  }),
  e("bb-row", "Barbell Row", "upperBack", ["barbell"], {
    secondary: ["lats", "biceps", "rearDelts"],
    mechanic: "compound",
    defaultWeightLb: 135,
    instructions: ["Hinge to ~45°. Pull the bar to the lower ribs, squeeze."],
  }),
  e("pendlay-row", "Pendlay Row", "upperBack", ["barbell"], {
    secondary: ["lats", "biceps"],
    mechanic: "compound",
    defaultWeightLb: 135,
    instructions: ["Dead-stop each rep from the floor. Explosive pull to the waist."],
  }),
  e("lat-pd", "Lat Pulldown", "lats", ["cable"], {
    secondary: ["biceps", "upperBack"],
    mechanic: "compound",
    defaultWeightLb: 120,
    instructions: ["Depress the scapulae first, pull the bar to the upper chest."],
  }),
  e("pull-up", "Pull-Up", "lats", ["pullupBar"], {
    secondary: ["biceps", "upperBack"],
    mechanic: "compound",
    defaultWeightLb: 0,
    incrementLb: 5,
    bodyweight: true,
    instructions: ["Dead hang, pull elbows to hips, chin over the bar."],
  }),
  e("chin-up", "Chin-Up", "lats", ["pullupBar"], {
    secondary: ["biceps", "upperBack"],
    mechanic: "compound",
    defaultWeightLb: 0,
    incrementLb: 5,
    bodyweight: true,
    instructions: ["Supinated grip. Pull until the chest meets the bar."],
  }),
  e("seated-row", "Seated Cable Row", "upperBack", ["cable"], {
    secondary: ["lats", "biceps"],
    mechanic: "compound",
    defaultWeightLb: 120,
    instructions: ["Sit tall. Pull to the navel, don't rock the torso."],
  }),
  e("db-row", "Dumbbell Row", "lats", ["dumbbell", "bench"], {
    secondary: ["upperBack", "biceps"],
    mechanic: "compound",
    defaultWeightLb: 55,
    instructions: ["Hand and knee on bench. Pull the bell to the hip."],
  }),
  e("face-pull", "Face Pull", "rearDelts", ["cable"], {
    secondary: ["upperBack", "traps"],
    defaultWeightLb: 30,
    incrementLb: 5,
    instructions: ["Rope to face height. Externally rotate as you pull apart."],
  }),
  e("straight-arm-pd", "Straight-Arm Pulldown", "lats", ["cable"], {
    defaultWeightLb: 40,
    instructions: ["Soft elbows. Sweep the bar to the thighs, feel the lats."],
  }),
  e("t-bar-row", "T-Bar Row", "upperBack", ["barbell"], {
    secondary: ["lats", "biceps"],
    mechanic: "compound",
    defaultWeightLb: 90,
  }),
  e("machine-row", "Machine Row", "upperBack", ["machine"], {
    secondary: ["lats", "biceps"],
    mechanic: "compound",
    defaultWeightLb: 100,
  }),

  e("ohp", "Barbell Overhead Press", "frontDelts", ["barbell"], {
    secondary: ["sideDelts", "triceps", "traps"],
    mechanic: "compound",
    defaultWeightLb: 95,
    instructions: [
      "Bar on the front delts, glutes tight.",
      "Press up and slightly back, head through at the top.",
    ],
  }),
  e("db-ohp", "Dumbbell Shoulder Press", "frontDelts", ["dumbbell"], {
    secondary: ["sideDelts", "triceps"],
    mechanic: "compound",
    defaultWeightLb: 40,
    instructions: ["Seated or standing. Press until biceps by the ears."],
  }),
  e("arnold-press", "Arnold Press", "frontDelts", ["dumbbell"], {
    secondary: ["sideDelts", "triceps"],
    mechanic: "compound",
    defaultWeightLb: 35,
    instructions: ["Start palms in. Rotate out as you press.",]
  }),
  e("lat-raise", "Dumbbell Lateral Raise", "sideDelts", ["dumbbell"], {
    defaultWeightLb: 15,
    incrementLb: 2.5,
    instructions: ["Soft elbows. Lead with the elbows to shoulder height."],
  }),
  e("cable-lat-raise", "Cable Lateral Raise", "sideDelts", ["cable"], {
    defaultWeightLb: 10,
    incrementLb: 5,
    instructions: ["Cable behind the body. Raise in the scapular plane."],
  }),
  e("rear-delt-fly", "Rear Delt Fly", "rearDelts", ["dumbbell"], {
    defaultWeightLb: 15,
    incrementLb: 2.5,
    instructions: ["Hinge, thumbs slightly in. Sweep out, not back."],
  }),
  e("front-raise", "Front Raise", "frontDelts", ["dumbbell"], {
    defaultWeightLb: 15,
    incrementLb: 2.5,
  }),
  e("machine-shoulder", "Machine Shoulder Press", "frontDelts", ["machine"], {
    secondary: ["sideDelts", "triceps"],
    mechanic: "compound",
    defaultWeightLb: 70,
  }),

  e("bb-squat", "Back Squat", "quads", ["barbell"], {
    secondary: ["glutes", "adductors", "lowerBack"],
    mechanic: "compound",
    defaultWeightLb: 185,
    incrementLb: 10,
    instructions: [
      "Bar on the upper traps, brace the trunk.",
      "Sit between the hips, knees track over toes.",
      "Drive up without shooting the hips first.",
    ],
  }),
  e("front-squat", "Front Squat", "quads", ["barbell"], {
    secondary: ["glutes", "abs"],
    mechanic: "compound",
    defaultWeightLb: 135,
    instructions: ["Elbows high. Sit down, keep the torso vertical."],
  }),
  e("goblet-squat", "Goblet Squat", "quads", ["dumbbell"], {
    secondary: ["glutes"],
    mechanic: "compound",
    defaultWeightLb: 50,
    instructions: ["Bell at the sternum. Elbows inside the knees at the bottom."],
  }),
  e("leg-press", "Leg Press", "quads", ["machine"], {
    secondary: ["glutes"],
    mechanic: "compound",
    defaultWeightLb: 270,
    incrementLb: 25,
    instructions: ["Feet mid-platform. Don't lock out harshly. Control the descent."],
  }),
  e("hack-squat", "Hack Squat", "quads", ["machine"], {
    secondary: ["glutes"],
    mechanic: "compound",
    defaultWeightLb: 180,
    incrementLb: 10,
  }),
  e("rdl", "Romanian Deadlift", "hamstrings", ["barbell"], {
    secondary: ["glutes", "lowerBack"],
    mechanic: "compound",
    defaultWeightLb: 135,
    instructions: ["Soft knees. Push the hips back until a hamstring stretch."],
  }),
  e("db-rdl", "Dumbbell RDL", "hamstrings", ["dumbbell"], {
    secondary: ["glutes"],
    mechanic: "compound",
    defaultWeightLb: 50,
  }),
  e("leg-ext", "Leg Extension", "quads", ["machine"], {
    defaultWeightLb: 70,
    instructions: ["Pad on the shins. Extend fully, squeeze, lower slow."],
  }),
  e("leg-curl", "Lying Leg Curl", "hamstrings", ["machine"], {
    defaultWeightLb: 70,
    instructions: ["Hips glued down. Curl the pad to the glutes."],
  }),
  e("seated-curl", "Seated Leg Curl", "hamstrings", ["machine"], {
    defaultWeightLb: 70,
  }),
  e("walking-lunge", "Walking Lunge", "quads", ["dumbbell"], {
    secondary: ["glutes"],
    mechanic: "compound",
    defaultWeightLb: 40,
    instructions: ["Long step, back knee close to the floor, torso tall."],
  }),
  e("bulg-split", "Bulgarian Split Squat", "quads", ["dumbbell", "bench"], {
    secondary: ["glutes"],
    mechanic: "compound",
    defaultWeightLb: 40,
    instructions: ["Rear foot on a bench. Front shin vertical at the bottom."],
  }),
  e("hip-thrust", "Barbell Hip Thrust", "glutes", ["barbell", "bench"], {
    secondary: ["hamstrings"],
    mechanic: "compound",
    defaultWeightLb: 185,
    incrementLb: 10,
    instructions: ["Upper back on the bench. Chin tucked, lock out the hips."],
  }),
  e("calf-raise", "Standing Calf Raise", "calves", ["machine"], {
    defaultWeightLb: 135,
    instructions: ["Full stretch at the bottom, pause at the top."],
  }),
  e("seated-calf", "Seated Calf Raise", "calves", ["machine"], {
    defaultWeightLb: 90,
  }),
  e("db-calf", "Dumbbell Calf Raise", "calves", ["dumbbell"], {
    defaultWeightLb: 40,
  }),
  e("good-morning", "Good Morning", "hamstrings", ["barbell"], {
    secondary: ["lowerBack", "glutes"],
    mechanic: "compound",
    defaultWeightLb: 95,
  }),
  e("adductor-machine", "Adductor Machine", "adductors", ["machine"], {
    defaultWeightLb: 80,
  }),

  e("bb-curl", "Barbell Curl", "biceps", ["barbell"], {
    defaultWeightLb: 65,
    instructions: ["Elbows pinned. Don't swing. Squeeze at the top."],
  }),
  e("ez-curl", "EZ-Bar Curl", "biceps", ["ezBar"], {
    defaultWeightLb: 60,
  }),
  e("db-curl", "Dumbbell Curl", "biceps", ["dumbbell"], {
    defaultWeightLb: 30,
    incrementLb: 2.5,
  }),
  e("hammer-curl", "Hammer Curl", "biceps", ["dumbbell"], {
    secondary: ["forearms"],
    defaultWeightLb: 30,
    incrementLb: 2.5,
    instructions: ["Neutral grip. Elbows still, bells to the shoulders."],
  }),
  e("cable-curl", "Cable Curl", "biceps", ["cable"], {
    defaultWeightLb: 40,
  }),
  e("preacher-curl", "Preacher Curl", "biceps", ["ezBar"], {
    defaultWeightLb: 50,
  }),
  e("skull-crusher", "Skull Crusher", "triceps", ["ezBar", "bench"], {
    defaultWeightLb: 50,
    instructions: ["Elbows up. Lower to the forehead, extend without flaring."],
  }),
  e("pushdown", "Cable Pushdown", "triceps", ["cable"], {
    defaultWeightLb: 40,
    instructions: ["Elbows glued to the ribs. Full lockout, control up."],
  }),
  e("oh-ext", "Overhead Tricep Extension", "triceps", ["dumbbell"], {
    defaultWeightLb: 40,
  }),
  e("cg-bench", "Close-Grip Bench", "triceps", ["barbell", "bench"], {
    secondary: ["chest"],
    mechanic: "compound",
    defaultWeightLb: 115,
    instructions: ["Hands just inside shoulder width. Elbows tucked."],
  }),
  e("tricep-dip", "Tricep Dip", "triceps", ["dipStation"], {
    secondary: ["chest"],
    mechanic: "compound",
    defaultWeightLb: 0,
    incrementLb: 5,
    bodyweight: true,
    instructions: ["Torso upright. Lower until the upper arms are parallel."],
  }),
  e("diamond-pushup", "Diamond Push-Up", "triceps", ["bodyweight"], {
    secondary: ["chest"],
    mechanic: "compound",
    defaultWeightLb: 0,
    bodyweight: true,
  }),

  e("bb-shrug", "Barbell Shrug", "traps", ["barbell"], {
    defaultWeightLb: 185,
    incrementLb: 10,
    instructions: ["Shrug straight up. Pause, lower slow. No rolling."],
  }),
  e("db-shrug", "Dumbbell Shrug", "traps", ["dumbbell"], {
    defaultWeightLb: 50,
  }),
  e("farmer-carry", "Farmer Carry", "traps", ["dumbbell"], {
    secondary: ["forearms", "abs", "obliques"],
    mechanic: "compound",
    defaultWeightLb: 70,
    instructions: ["Walk tall, ribs down. Even steps, don't lean."],
  }),

  e("hanging-leg-raise", "Hanging Leg Raise", "abs", ["pullupBar"], {
    secondary: ["obliques"],
    defaultWeightLb: 0,
    bodyweight: true,
    instructions: ["Posterior tilt first. Raise toes to hip height without swinging."],
  }),
  e("cable-crunch", "Cable Crunch", "abs", ["cable"], {
    defaultWeightLb: 50,
    instructions: ["Round the spine, hips quiet. Crunch the ribcage to the pelvis."],
  }),
  e("plank", "Plank", "abs", ["bodyweight"], {
    secondary: ["obliques"],
    defaultWeightLb: 0,
    bodyweight: true,
    instructions: ["Elbows under shoulders, glutes tight. Breathe into the brace."],
  }),
  e("ab-wheel", "Ab Wheel Rollout", "abs", ["bodyweight"], {
    secondary: ["lats"],
    defaultWeightLb: 0,
    bodyweight: true,
    instructions: ["Roll out until you can still hold the brace, then pull back."],
  }),
  e("pallof", "Pallof Press", "obliques", ["cable"], {
    secondary: ["abs"],
    defaultWeightLb: 20,
    instructions: ["Press the handle out, resist rotation. Pause, return."],
  }),
  e("dead-bug", "Dead Bug", "abs", ["bodyweight"], {
    defaultWeightLb: 0,
    bodyweight: true,
  }),
  e("kb-swing", "Kettlebell Swing", "glutes", ["kettlebell"], {
    secondary: ["hamstrings", "abs"],
    mechanic: "compound",
    defaultWeightLb: 53,
    incrementLb: 9,
    instructions: ["Hinge, snap the hips. The bell floats — don't squat the swing."],
  }),
  e("band-pull-apart", "Band Pull-Apart", "rearDelts", ["bands"], {
    secondary: ["upperBack"],
    defaultWeightLb: 0,
    bodyweight: true,
  }),
  e("band-row", "Band Row", "upperBack", ["bands"], {
    secondary: ["lats", "biceps"],
    mechanic: "compound",
    defaultWeightLb: 0,
    bodyweight: true,
  }),
  e("push-up-band", "Band-Resisted Push-Up", "chest", ["bands", "bodyweight"], {
    secondary: ["triceps", "frontDelts"],
    mechanic: "compound",
    defaultWeightLb: 0,
    bodyweight: true,
  }),
  e("decline-bench", "Decline Barbell Bench", "chest", ["barbell", "bench"], {
    secondary: ["triceps"],
    mechanic: "compound",
    defaultWeightLb: 155,
  }),
  e("pec-deck", "Pec Deck", "chest", ["machine"], {
    defaultWeightLb: 70,
  }),
  e("cable-crossover", "Cable Crossover", "chest", ["cable"], {
    defaultWeightLb: 20,
  }),
  e("chest-supported-row", "Chest-Supported Row", "upperBack", ["machine"], {
    secondary: ["biceps", "lats"],
    mechanic: "compound",
    defaultWeightLb: 90,
  }),
  e("meadows-row", "Meadows Row", "lats", ["barbell"], {
    secondary: ["upperBack", "biceps"],
    mechanic: "compound",
    defaultWeightLb: 70,
  }),
  e("wide-pulldown", "Wide-Grip Pulldown", "lats", ["cable"], {
    secondary: ["biceps"],
    mechanic: "compound",
    defaultWeightLb: 110,
  }),
  e("neutral-pullup", "Neutral-Grip Pull-Up", "lats", ["pullupBar"], {
    secondary: ["biceps"],
    mechanic: "compound",
    defaultWeightLb: 0,
    bodyweight: true,
  }),
  e("upright-row", "Upright Row", "sideDelts", ["barbell"], {
    secondary: ["traps"],
    defaultWeightLb: 65,
  }),
  e("machine-lat-raise", "Machine Lateral Raise", "sideDelts", ["machine"], {
    defaultWeightLb: 40,
  }),
  e("incline-curl", "Incline Dumbbell Curl", "biceps", ["dumbbell", "bench"], {
    defaultWeightLb: 25,
  }),
  e("concentration-curl", "Concentration Curl", "biceps", ["dumbbell"], {
    defaultWeightLb: 25,
  }),
  e("jm-press", "JM Press", "triceps", ["barbell", "bench"], {
    secondary: ["chest"],
    mechanic: "compound",
    defaultWeightLb: 95,
  }),
  e("kickback", "Triceps Kickback", "triceps", ["dumbbell"], {
    defaultWeightLb: 15,
  }),
  e("step-up", "Dumbbell Step-Up", "quads", ["dumbbell"], {
    secondary: ["glutes"],
    mechanic: "compound",
    defaultWeightLb: 40,
  }),
  e("nordic-curl", "Nordic Curl", "hamstrings", ["bodyweight"], {
    mechanic: "isolation",
    defaultWeightLb: 0,
    bodyweight: true,
  }),
  e("glute-bridge", "Glute Bridge", "glutes", ["bodyweight"], {
    secondary: ["hamstrings"],
    defaultWeightLb: 0,
    bodyweight: true,
  }),
  e("cable-kickback", "Cable Glute Kickback", "glutes", ["cable"], {
    defaultWeightLb: 20,
  }),
  e("sumo-dl", "Sumo Deadlift", "glutes", ["barbell"], {
    secondary: ["quads", "hamstrings", "upperBack"],
    mechanic: "compound",
    defaultWeightLb: 185,
    incrementLb: 10,
  }),
  e("leg-press-calf", "Leg Press Calf Raise", "calves", ["machine"], {
    defaultWeightLb: 180,
  }),
  e("donkey-calf", "Donkey Calf Raise", "calves", ["machine"], {
    defaultWeightLb: 90,
  }),
  e("russian-twist", "Russian Twist", "obliques", ["bodyweight"], {
    secondary: ["abs"],
    defaultWeightLb: 0,
    bodyweight: true,
  }),
  e("hanging-knee-raise", "Hanging Knee Raise", "abs", ["pullupBar"], {
    defaultWeightLb: 0,
    bodyweight: true,
  }),
  e("power-clean", "Power Clean", "traps", ["barbell"], {
    secondary: ["quads", "glutes", "frontDelts"],
    mechanic: "compound",
    defaultWeightLb: 95,
  }),
  e("thruster", "Barbell Thruster", "quads", ["barbell"], {
    secondary: ["frontDelts", "abs"],
    mechanic: "compound",
    defaultWeightLb: 75,
  }),
];

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(
  [...EXERCISES, ...EXTRA_EXERCISES].map((x) => [x.id, x]),
);

let customExercises: Exercise[] = [];

export function bindCustomExercises(list: Exercise[]) {
  customExercises = list;
}

export function catalog(): Exercise[] {
  return [...EXERCISES, ...EXTRA_EXERCISES, ...customExercises];
}

export function getExercise(id: string): Exercise {
  const found = EXERCISE_BY_ID[id] ?? customExercises.find((x) => x.id === id);
  if (!found) {
    return {
      id,
      name: "Unknown movement",
      primary: "chest",
      secondary: [],
      equipment: ["bodyweight"],
      mechanic: "isolation",
      defaultWeightLb: 0,
      incrementLb: 5,
      instructions: [],
    };
  }
  return found;
}

export function searchExercises(query: string, muscle?: Muscle | "all"): Exercise[] {
  const q = query.trim().toLowerCase();
  return catalog().filter((ex) => {
    if (muscle && muscle !== "all") {
      if (ex.primary !== muscle && !ex.secondary.includes(muscle)) return false;
    }
    if (!q) return true;
    return (
      ex.name.toLowerCase().includes(q) ||
      ex.primary.includes(q) ||
      ex.secondary.some((m) => m.includes(q))
    );
  });
}
