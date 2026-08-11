import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app/AppShell";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TASK_STATUSES } from "@/lib/constants";
import { listTasks } from "@/lib/tasks.functions";

export const Route = createFileRoute("/_authenticated/projects/$projectId/progress")({
  head: () => ({
    meta: [
      { title: "Progress — HackPilot" },
      { name: "description", content: "See how your hackathon project is tracking." },
      { property: "og:title", content: "Progress — HackPilot" },
      { property: "og:description", content: "Task completion and workload at a glance." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { projectId } = Route.useParams();
  const tasksFn = useServerFn(listTasks);
  const { data: tasks } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => tasksFn({ data: { projectId } }),
  });

  const all = tasks ?? [];
  const done = all.filter((t) => t.status === "done").length;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;

  return (
    <AppShell title="Progress">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        <Card className="border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Overall completion</p>
          <p className="font-display text-3xl font-bold">{pct}%</p>
          <Progress value={pct} className="mt-3" />
          <p className="mt-2 text-xs text-muted-foreground">
            {done} of {all.length} tasks done
          </p>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TASK_STATUSES.map((s) => (
            <Card key={s.id} className="border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="font-display text-2xl font-bold">
                {all.filter((t) => t.status === s.id).length}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
