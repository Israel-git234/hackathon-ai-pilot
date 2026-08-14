import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, initials } from "@/components/app/AppShell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { getProject } from "@/lib/projects.functions";
import { createTask, deleteTask, listTasks, updateTask } from "@/lib/tasks.functions";
import type { TaskStatus } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/projects/$projectId/board")({
  head: () => ({
    meta: [
      { title: "Task Board — HackPilot" },
      { name: "description", content: "Kanban board for your hackathon team's tasks." },
      { property: "og:title", content: "Task Board — HackPilot" },
      { property: "og:description", content: "Track tasks from backlog to done." },
    ],
  }),
  component: Board,
});

const UNASSIGNED = "__unassigned__";

function Board() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();
  const tasksFn = useServerFn(listTasks);
  const projectFn = useServerFn(getProject);
  const createFn = useServerFn(createTask);
  const updateFn = useServerFn(updateTask);
  const deleteFn = useServerFn(deleteTask);

  const { data: tasks } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => tasksFn({ data: { projectId } }),
  });
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectFn({ data: { projectId } }),
  });

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState("medium");
  const [assignee, setAssignee] = useState(UNASSIGNED);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          projectId,
          title,
          description: description || null,
          status,
          priority: priority as "low" | "medium" | "high" | "urgent",
          labels: [],
          assignee_id: assignee === UNASSIGNED ? null : assignee,
        },
      }),
    onSuccess: () => {
      setOpen(false);
      setTitle("");
      setDescription("");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const move = useMutation({
    mutationFn: (vars: { id: string; status: TaskStatus }) =>
      updateFn({ data: { id: vars.id, status: vars.status } }),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: invalidate,
  });

  return (
    <AppShell
      title="Task Board"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="mr-1">
              <Plus className="mr-1 h-4 w-4" />
              Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New task</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUSES.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Assignee</Label>
                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                    {(project?.members ?? []).map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.profile?.display_name ?? "Teammate"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={() => create.mutate()}
                disabled={!title.trim() || create.isPending}
              >
                {create.isPending ? "Adding…" : "Add task"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="overflow-x-auto px-4 py-6 sm:px-6">
        <div className="flex min-w-max gap-4 pb-4">
          {TASK_STATUSES.map((column) => {
            const columnTasks = (tasks ?? []).filter((t) => t.status === column.id);
            return (
              <div
                key={column.id}
                className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-card/40 p-3"
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", COLUMN_DOT[column.id])} />
                    <p className="text-sm font-semibold">{column.label}</p>
                  </div>
                  <span className="rounded-md bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {columnTasks.map((t) => (
                    <Card
                      key={t.id}
                      className="group border-border bg-card p-3 transition-colors hover:border-primary/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm leading-snug font-medium">{t.title}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                          aria-label="Delete task"
                          onClick={() => remove.mutate(t.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {t.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {t.description}
                        </p>
                      ) : null}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "rounded-md border px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase",
                            PRIORITY_STYLE[t.priority] ?? PRIORITY_STYLE["medium"],
                          )}
                        >
                          {t.priority}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {t.assignee ? (
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-primary/15 text-[10px] text-primary">
                                {initials(t.assignee.display_name)}
                              </AvatarFallback>
                            </Avatar>
                          ) : null}
                          <Select
                            value={t.status}
                            onValueChange={(v) =>
                              move.mutate({ id: t.id, status: v as TaskStatus })
                            }
                          >
                            <SelectTrigger
                              className="h-7 w-auto gap-1 border-none bg-transparent px-1.5 text-xs text-muted-foreground hover:text-foreground"
                              aria-label="Move task"
                            >
                              <MoveRight className="h-3.5 w-3.5" />
                            </SelectTrigger>
                            <SelectContent>
                              {TASK_STATUSES.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  Move to {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {columnTasks.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
                      Nothing here
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </AppShell>
  );
}
