import { createFileRoute } from "@tanstack/react-router";
import { TodayView } from "@/components/today-view";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <TodayView />;
}
