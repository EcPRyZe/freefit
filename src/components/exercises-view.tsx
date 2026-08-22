import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Plus, Search } from "lucide-react";
import { CreateExerciseModal } from "@/components/create-exercise-modal";
import { catalog, searchExercises } from "@/lib/exercises";
import { MUSCLE_LABEL, MUSCLES, type Muscle } from "@/lib/types";
import { EQUIPMENT_LABEL } from "@/lib/types";
import { useGym } from "@/lib/store";

export function ExercisesView() {
  const custom = useGym((s) => s.customExercises);
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState<Muscle | "custom" | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const all = catalog();
  const counts = useMemo(() => {
    const c: Partial<Record<Muscle | "custom", number>> = {};
    for (const ex of all) {
      if (ex.isCustom) c.custom = (c.custom ?? 0) + 1;
      c[ex.primary] = (c[ex.primary] ?? 0) + 1;
    }
    return c;
  }, [all, custom]);

  const list = useMemo(() => {
    if (folder === "custom") {
      return custom.filter((ex) => {
        if (!q.trim()) return true;
        return ex.name.toLowerCase().includes(q.trim().toLowerCase());
      });
    }
    return searchExercises(q, folder ?? "all");
  }, [q, folder, custom]);

  return (
    <main className="px-5 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <h1 className="text-3xl font-semibold tracking-tight">Exercises</h1>

      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-primary/10 text-sm font-semibold text-primary"
      >
        <Plus className="size-4" />
        Create New Exercise
      </button>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search movements"
          className="h-12 w-full rounded-2xl bg-surface pl-10 pr-4 text-sm text-fg shadow-border outline-none placeholder:text-faint focus:shadow-[0_0_0_1px_var(--color-primary)]"
        />
      </div>

      {!folder && !q && (
        <div className="mt-4 space-y-2">
          {(counts.custom ?? 0) > 0 && (
            <FolderRow
              title="Custom"
              count={counts.custom ?? 0}
              onClick={() => setFolder("custom")}
            />
          )}
          {MUSCLES.filter((m) => (counts[m] ?? 0) > 0).map((m) => (
            <FolderRow
              key={m}
              title={MUSCLE_LABEL[m]}
              count={counts[m] ?? 0}
              onClick={() => setFolder(m)}
            />
          ))}
        </div>
      )}

      {(folder || q) && (
        <>
          {folder && (
            <button
              type="button"
              onClick={() => setFolder(null)}
              className="mt-4 text-sm font-medium text-primary"
            >
              ← All categories
            </button>
          )}
          {folder && !q && (
            <h2 className="mt-2 text-xl font-semibold">
              {folder === "custom" ? "Custom" : MUSCLE_LABEL[folder]}
            </h2>
          )}
          <ul className="mt-3 space-y-2">
            {list.map((ex) => (
              <li key={ex.id}>
                <Link
                  to="/exercises/$id"
                  params={{ id: ex.id }}
                  className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-border"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {ex.name}
                      {ex.isCustom ? (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-primary">
                          Custom
                        </span>
                      ) : null}
                    </p>
                    <p className="text-sm text-muted">
                      {MUSCLE_LABEL[ex.primary]} · {ex.equipment.map((e) => EQUIPMENT_LABEL[e]).join(" · ")}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-faint" />
                </Link>
              </li>
            ))}
            {list.length === 0 && (
              <p className="py-10 text-center text-sm text-muted">No exercises match that filter.</p>
            )}
          </ul>
        </>
      )}

      {showCreate && <CreateExerciseModal onClose={() => setShowCreate(false)} />}
    </main>
  );
}

function FolderRow({
  title,
  count,
  onClick,
}: {
  title: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl bg-surface px-4 py-4 text-left shadow-border"
    >
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted">
          {count} exercise{count === 1 ? "" : "s"}
        </p>
      </div>
      <ChevronRight className="size-4 text-faint" />
    </button>
  );
}
