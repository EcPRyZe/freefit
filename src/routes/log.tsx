import { createFileRoute } from "@tanstack/react-router";
import { LogView } from "@/components/log-view";

export const Route = createFileRoute("/log")({ component: LogPage });

function LogPage() {
  return <LogView />;
}
