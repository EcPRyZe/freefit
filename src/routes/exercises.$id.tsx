import { createFileRoute } from "@tanstack/react-router";
import { ExerciseDetail } from "@/components/exercise-detail";

export const Route = createFileRoute("/exercises/$id")({ component: DetailPage });

function DetailPage() {
  const { id } = Route.useParams();
  return <ExerciseDetail id={id} />;
}
