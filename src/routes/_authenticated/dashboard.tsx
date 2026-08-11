import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Plus, Users } from "lucide-react";
import { formatDistanceToNowStrict, isPast, parseISO } from "date-fns";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { listMyProjects } from "@/lib/projects.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — HackPilot" },
      { name: "description", content: "All your hackathon projects, progress, and deadlines." },
      { property: "og:title", content: "Dashboard — HackPilot" },
      {
        property: "og:description",
        content: "Track every hackathon project you're part of in one dashboard.",
      },
    ],
  }),
  component: Dashboard,
});

function deadlineLabel(deadline: string | null) {
  if (!deadline) return null;
  const date = parseISO(deadline);
  if (isPast(date)) return "Deadline passed";
  return `${formatDistanceToNowStrict(date)} left`;
}

function Dashboard() {
  const fetchProjects = useServerFn(listMyProjects);
  const { data: projects, isLoading } = useQuery({
    queryKey: ["my-projects"],
    queryFn: () => fetchProjects(),
  });

  return (
    <AppShell
      title="Dashboard"
      actions={
        <Button asChild size="sm" className="mr-1">
          <Link to="/projects/new">
            <Plus className="mr-1 h-4 w-4" />
            New project
          </Link>
        </Button>
      }
    >
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold tracking-tight">Your projects</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every hackathon you're building for, with live progress.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const pct = p.total_tasks ? Math.round((p.done_tasks / p.total_tasks) * 100) : 0;
              const label = deadlineLabel(p.deadline);
              return (
                <Link key={p.id} to="/projects/$projectId" params={{ projectId: p.id }}>
                  <Card className="h-full border-border bg-card p-5 transition-colors hover:border-primary/50">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-base font-semibold">{p.name}</h3>
                      <Badge variant={p.my_role === "leader" ? "default" : "secondary"}>
                        {p.my_role}
                      </Badge>
                    </div>
                    {p.hackathon_name ? (
                      <p className="mt-1 text-xs text-primary">{p.hackathon_name}</p>
                    ) : null}
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {p.description || p.idea || "No description yet."}
                    </p>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {p.done_tasks}/{p.total_tasks} tasks
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <Progress value={pct} className="mt-1.5 h-1.5" />
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {p.member_count}
                      </span>
                      {label ? (
                        <span className="flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {label}
                        </span>
                      ) : null}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed border-border bg-card p-12 text-center">
            <h3 className="font-display text-lg font-semibold">No projects yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Create your first hackathon project and let the AI planner turn your idea into a
              plan.
            </p>
            <Button asChild className="mt-6">
              <Link to="/projects/new">
                <Plus className="mr-1 h-4 w-4" />
                Create project
              </Link>
            </Button>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
