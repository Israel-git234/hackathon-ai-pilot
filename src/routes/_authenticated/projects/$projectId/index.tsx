import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { format, formatDistanceToNowStrict, isPast, parseISO } from "date-fns";
import { CalendarClock, Check, Copy, Plus, Sparkles, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell, initials } from "@/components/app/AppShell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createMilestone,
  deleteMilestone,
  getProject,
  updateMilestone,
} from "@/lib/projects.functions";
import { listTasks } from "@/lib/tasks.functions";

export const Route = createFileRoute("/_authenticated/projects/$projectId/")({
  head: () => ({
    meta: [
      { title: "Project overview — HackPilot" },
      {
        name: "description",
        content: "Project overview: team, milestones, deadline, and progress at a glance.",
      },
      { property: "og:title", content: "Project overview — HackPilot" },
      { property: "og:description", content: "Your hackathon project's command centre." },
    ],
  }),
  component: ProjectOverview,
});

function ProjectOverview() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();
  const projectFn = useServerFn(getProject);
  const tasksFn = useServerFn(listTasks);
  const addMilestone = useServerFn(createMilestone);
  const patchMilestone = useServerFn(updateMilestone);
  const removeMilestone = useServerFn(deleteMilestone);

  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectFn({ data: { projectId } }),
  });
  const { data: tasks } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => tasksFn({ data: { projectId } }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["project", projectId] });

  const create = useMutation({
    mutationFn: () => addMilestone({ data: { projectId, title: milestoneTitle } }),
    onSuccess: () => {
      setMilestoneTitle("");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const toggle = useMutation({
    mutationFn: (vars: { id: string; done: boolean }) =>
      patchMilestone({ data: { id: vars.id, done: vars.done } }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeMilestone({ data: { id } }),
    onSuccess: invalidate,
  });

  if (isLoading || !data) {
    return (
      <AppShell title="Project">
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </AppShell>
    );
  }

  const total = tasks?.length ?? 0;
  const done = tasks?.filter((t) => t.status === "done").length ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const inviteUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/join/${data.project.invite_code}`;

  return (
    <AppShell title={data.project.name}>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        <Card className="border-border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-bold tracking-tight">
                {data.project.name}
              </h2>
              {data.project.hackathon_name ? (
                <p className="mt-1 text-sm text-primary">{data.project.hackathon_name}</p>
              ) : null}
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {data.project.description || data.project.idea || "No description yet."}
              </p>
            </div>
            <Button asChild size="sm">
              <Link to="/projects/$projectId/planner" params={{ projectId }}>
                <Sparkles className="mr-1 h-4 w-4" />
                AI Planner
              </Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Task progress</p>
              <p className="mt-1 font-display text-xl font-bold">{pct}%</p>
              <Progress value={pct} className="mt-2 h-1.5" />
              <p className="mt-1 text-xs text-muted-foreground">
                {done} of {total} tasks done
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className="mt-1 flex items-center gap-1.5 font-display text-xl font-bold">
                <CalendarClock className="h-4 w-4 text-primary" />
                {data.project.deadline
                  ? isPast(parseISO(data.project.deadline))
                    ? "Passed"
                    : formatDistanceToNowStrict(parseISO(data.project.deadline))
                  : "Not set"}
              </p>
              {data.project.deadline ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {format(parseISO(data.project.deadline), "PPp")}
                </p>
              ) : null}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Team</p>
              <p className="mt-1 flex items-center gap-1.5 font-display text-xl font-bold">
                <Users className="h-4 w-4 text-blue" />
                {data.members.length}
              </p>
              <div className="mt-2 flex -space-x-2">
                {data.members.slice(0, 6).map((m) => (
                  <Avatar key={m.id} className="h-7 w-7 border border-background">
                    <AvatarFallback className="bg-primary/15 text-[10px] text-primary">
                      {initials(m.profile?.display_name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="border-border bg-card p-6">
            <h3 className="font-display text-base font-semibold">Milestones</h3>
            <div className="mt-4 space-y-2">
              {data.milestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  <button
                    type="button"
                    aria-label={m.done ? "Mark not done" : "Mark done"}
                    onClick={() => toggle.mutate({ id: m.id, done: !m.done })}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      m.done ? "border-primary bg-primary" : "border-border"
                    }`}
                  >
                    {m.done ? <Check className="h-3 w-3 text-primary-foreground" /> : null}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium ${m.done ? "text-muted-foreground line-through" : ""}`}
                    >
                      {m.title}
                    </p>
                    {m.description ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{m.description}</p>
                    ) : null}
                    {m.due_date ? (
                      <Badge variant="secondary" className="mt-2 font-normal">
                        Due {format(parseISO(m.due_date), "MMM d")}
                      </Badge>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete milestone"
                    onClick={() => remove.mutate(m.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {data.milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No milestones yet. Add one or generate a plan with AI.
                </p>
              ) : null}
            </div>
            <div className="mt-4 flex gap-2">
              <Input
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                placeholder="Add a milestone…"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && milestoneTitle.trim()) create.mutate();
                }}
              />
              <Button
                onClick={() => create.mutate()}
                disabled={!milestoneTitle.trim() || create.isPending}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <Card className="border-border bg-card p-6">
            <h3 className="font-display text-base font-semibold">Invite your team</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Anyone with this link can join the project.
            </p>
            <div className="mt-4 flex gap-2">
              <Input readOnly value={inviteUrl} className="font-mono text-xs" />
              <Button
                variant="outline"
                size="icon"
                aria-label="Copy invite link"
                onClick={async () => {
                  await navigator.clipboard.writeText(inviteUrl);
                  setCopied(true);
                  toast.success("Invite link copied");
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <h4 className="mt-6 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Members
            </h4>
            <div className="mt-3 space-y-3">
              {data.members.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/15 text-xs text-primary">
                      {initials(m.profile?.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {m.profile?.display_name ?? "Teammate"}
                  </span>
                  <Badge variant={m.member_role === "leader" ? "default" : "secondary"}>
                    {m.member_role}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
