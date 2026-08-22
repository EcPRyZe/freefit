import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useGym } from "@/lib/store";
import {
  EQUIPMENT,
  EQUIPMENT_LABEL,
  MUSCLE_LABEL,
  MUSCLES,
  type Equipment,
  type Muscle,
} from "@/lib/types";

export function CreateExerciseModal({ onClose }: { onClose: () => void }) {
  const add = useGym((s) => s.addCustomExercise);
  const [name, setName] = useState("");
  const [primary, setPrimary] = useState<Muscle>("chest");
  const [secondary, setSecondary] = useState<Muscle[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>(["dumbbell"]);
  const [bodyweight, setBodyweight] = useState(false);

  function toggleEq(eq: Equipment) {
    setEquipment((cur) => {
      if (cur.includes(eq)) return cur.length === 1 ? cur : cur.filter((x) => x !== eq);
      return [...cur, eq];
    });
    if (eq === "bodyweight") setBodyweight(true);
  }

  function toggleSec(m: Muscle) {
    setSecondary((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));
  }

  function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    add({
      name: trimmed,
      primary,
      secondary: secondary.filter((m) => m !== primary),
      equipment,
      mechanic: "isolation",
      defaultWeightLb: bodyweight ? 0 : 20,
      incrementLb: 5,
      instructions: [],
      bodyweight,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/70 sm:items-center">
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
          <h2 className="text-lg font-semibold">New exercise</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-11 items-center justify-center rounded-xl text-muted hover:bg-raised"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-5 p-4 pb-10">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Landmine Press"
              className="h-12 w-full rounded-2xl bg-raised px-4 text-sm text-fg outline-none placeholder:text-faint focus:shadow-[0_0_0_1px_var(--color-primary)]"
            />
          </label>

          <div>
            <p className="mb-2 text-xs font-medium text-muted">Primary muscle</p>
            <div className="flex flex-wrap gap-2">
              {MUSCLES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPrimary(m)}
                  className={cn(
                    "h-9 rounded-full px-3 text-sm font-medium",
                    primary === m ? "bg-fg text-bg" : "bg-raised text-muted",
                  )}
                >
                  {MUSCLE_LABEL[m]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted">Secondary (optional)</p>
            <div className="flex flex-wrap gap-2">
              {MUSCLES.filter((m) => m !== primary).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleSec(m)}
                  className={cn(
                    "h-9 rounded-full px-3 text-sm",
                    secondary.includes(m) ? "bg-primary/20 text-primary" : "bg-raised text-muted",
                  )}
                >
                  {MUSCLE_LABEL[m]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted">Equipment</p>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => toggleEq(eq)}
                  className={cn(
                    "h-9 rounded-full px-3 text-sm font-medium",
                    equipment.includes(eq) ? "bg-fg text-bg" : "bg-raised text-muted",
                  )}
                >
                  {EQUIPMENT_LABEL[eq]}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={bodyweight}
              onChange={(e) => setBodyweight(e.target.checked)}
              className="size-4 accent-current"
            />
            Bodyweight — track reps, not load
          </label>

          <Button size="xl" className="w-full" disabled={!name.trim()} onClick={save}>
            Save exercise
          </Button>
        </div>
      </div>
    </div>
  );
}
