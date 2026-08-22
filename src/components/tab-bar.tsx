import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Dumbbell, Library, TrendingUp, User } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { to: "/", label: "Workout", icon: Dumbbell },
  { to: "/log", label: "Log", icon: CalendarDays },
  { to: "/stats", label: "Stats", icon: TrendingUp },
  { to: "/exercises", label: "Exercises", icon: Library },
  { to: "/you", label: "You", icon: User },
] as const;

export function TabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
      aria-label="Main"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 lg:max-w-5xl">
        {TABS.map((tab) => {
          const active =
            tab.to === "/"
              ? pathname === "/"
              : pathname === tab.to || pathname.startsWith(tab.to + "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors duration-150",
                active ? "text-primary" : "text-muted",
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
