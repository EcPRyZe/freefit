import { Plus, Search, X } from "lucide-react";
import { catalog } from "@/lib/exercises";
import { EQUIPMENT_LABEL, MUSCLE_LABEL } from "@/lib/types";

export function AddExerciseSheet({
  usedIds,
  equipment,
  query,
  onQuery,
  onClose,
  onPick,
}: {
  usedIds: Set<string>;
  equipment: string[];
  query: string;
  onQuery: (q: string) => void;
  onClose: () => void;
  onPick: (id: string) => void;
}) {
  const kit = new Set(equipment);
  const q = query.trim().toLowerCase();
  const list = catalog()
    .filter((ex) => !usedIds.has(ex.id))
    .filter((ex) => ex.equipment.every((eq) => kit.has(eq)))
    .filter((ex) => {
      if (!q) return true;
      return (
        ex.name.toLowerCase().includes(q) ||
        MUSCLE_LABEL[ex.primary].toLowerCase().includes(q)
      );
    })
    .slice(0, 50);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" className="absolute inset-0 bg-bg/70" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-3xl bg-surface p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-border">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add exercise</h2>
          <button
            type="button"
            onClick={onClose}
            className="size-10 rounded-lg text-muted hover:bg-raised"
            aria-label="Close"
          >
            <X className="mx-auto size-4" />
          </button>
        </div>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search the library"
            autoFocus
            className="h-11 w-full rounded-xl bg-raised pl-10 pr-3 text-sm text-fg outline-none placeholder:text-faint"
          />
        </div>
        <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
          {list.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-2xl bg-raised px-4 py-3 text-left"
                onClick={() => onPick(ex.id)}
              >
                <span>
                  <span className="block font-medium">{ex.name}</span>
                  <span className="text-sm text-muted">
                    {MUSCLE_LABEL[ex.primary]} · {ex.equipment.map((e) => EQUIPMENT_LABEL[e]).join(", ")}
                  </span>
                </span>
                <Plus className="size-4 text-primary" />
              </button>
            </li>
          ))}
          {list.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">Nothing matches that search.</p>
          )}
        </ul>
      </div>
    </div>
  );
}
