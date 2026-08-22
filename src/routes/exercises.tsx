import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { ExercisesView } from "@/components/exercises-view";

export const Route = createFileRoute("/exercises")({ component: ExercisesPage });

function ExercisesPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/exercises") return <Outlet />;
  return <ExercisesView />;
}
