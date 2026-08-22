import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { StatsView } from "@/components/stats-view";

export const Route = createFileRoute("/stats")({ component: StatsPage });

function StatsPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/stats") return <Outlet />;
  return <StatsView />;
}
