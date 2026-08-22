import { cn } from "@/lib/cn";
import { SET_STYLE_HINT, SET_STYLE_LABEL, SET_STYLES, type SetStyle } from "@/lib/types";

export function SetStylePicker({
  value,
  onChange,
}: {
  value: SetStyle;
  onChange: (style: SetStyle) => void;
}) {
  const current = value ?? "normal";
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-faint">Set style</p>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {SET_STYLES.map((style) => (
          <button
            key={style}
            type="button"
            title={SET_STYLE_HINT[style]}
            onClick={() => onChange(style)}
            className={cn(
              "h-8 shrink-0 rounded-full px-3 text-xs font-medium transition-colors duration-150",
              current === style ? "bg-fg text-bg" : "bg-raised text-muted",
            )}
          >
            {SET_STYLE_LABEL[style]}
          </button>
        ))}
      </div>
    </div>
  );
}
