import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { todayISO } from "@/lib/format";
import { useGym } from "@/lib/store";

export function BackupCard() {
  const exportBackup = useGym((s) => s.exportBackup);
  const importBackup = useGym((s) => s.importBackup);

  function download() {
    const data = exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `freefit-backup-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Backup saved");
  }

  async function restore(file: File) {
    try {
      const text = await file.text();
      const raw = JSON.parse(text) as unknown;
      const result = importBackup(raw);
      toast.success(
        `Restored ${result.sessions} sessions` +
          (result.exercises ? ` · ${result.exercises} custom movements` : ""),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read backup");
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium text-muted">Backup</h2>
      <p className="mt-1 text-xs text-faint">
        GitHub Pages only serves the app. Your gym lives in this browser. Export a JSON file
        to keep it, or to move to another phone.
      </p>
      <div className="mt-3 rounded-2xl bg-surface px-4 py-4 shadow-border">
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={download}>
            Export backup
          </Button>
          <label className="flex-1">
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void restore(file);
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={(ev) => {
                const input = (ev.currentTarget.parentElement as HTMLLabelElement).querySelector("input");
                input?.click();
              }}
            >
              Import backup
            </Button>
          </label>
        </div>
      </div>
    </section>
  );
}
