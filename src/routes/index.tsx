import { createFileRoute } from "@tanstack/react-router";
import { SessionView } from "@/components/session-view";
import { TodayView } from "@/components/today-view";
import { useGym } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const active = useGym((s) => s.active);
  if (active) return <SessionView />;
  return <TodayView />;
}
