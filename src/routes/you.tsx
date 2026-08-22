import { createFileRoute } from "@tanstack/react-router";
import { YouView } from "@/components/you-view";

export const Route = createFileRoute("/you")({ component: YouPage });

function YouPage() {
  return <YouView />;
}
