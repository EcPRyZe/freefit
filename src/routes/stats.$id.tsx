import { createFileRoute } from "@tanstack/react-router";
import { ExerciseStats } from "@/components/exercise-stats";

export const Route = createFileRoute("/stats/$id")({ component: ExerciseStatsPage });

function ExerciseStatsPage() {
  const { id } = Route.useParams();
  return <ExerciseStats id={id} />;
}
