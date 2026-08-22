import { cn } from "@/lib/cn";
import { biasLabel } from "@/lib/format";
import { useGym } from "@/lib/store";

export function BiasControls({
  exerciseId,
  size = "md",
}: {
  exerciseId: string;
  size?: "sm" | "md";
}) {
  const bias = useGym((s) => s.profile.exerciseBias[exerciseId] ?? 0);
  const setBias = useGym((s) => s.setExerciseBias);
  const compact = size === "sm";
  const label = biasLabel(bias);

  return (
    <div className={cn("flex items-center gap-2", compact && "flex-wrap")}>
      <button
        type="button"
        onClick={() => setBias(exerciseId, bias > 0 ? 0 : 2)}
        aria-pressed={bias > 0}
        className={cn(
          "rounded-full font-medium transition-colors duration-150",
          compact ? "h-9 px-3 text-xs" : "h-10 px-4 text-sm",
          bias > 0 ? "bg-fg text-bg" : "bg-raised text-muted",
        )}
      >
        More often
      </button>
      <button
        type="button"
        onClick={() => setBias(exerciseId, bias < 0 ? 0 : -1)}
        aria-pressed={bias < 0}
        className={cn(
          "rounded-full font-medium transition-colors duration-150",
          compact ? "h-9 px-3 text-xs" : "h-10 px-4 text-sm",
          bias < 0 ? "bg-fg text-bg" : "bg-raised text-muted",
        )}
      >
        Less often
      </button>
      {label && !compact && <span className="text-xs text-muted">{label}</span>}
    </div>
  );
}
