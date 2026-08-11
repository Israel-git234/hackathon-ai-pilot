import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { applyPlan, generatePlan } from "@/lib/ai.functions";
import type { ProjectPlan } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/projects/$projectId/planner")({
  head: () => ({
    meta: [
      { title: "AI Planner — HackPilot" },
      {
        name: "description",
        content: "Turn your hackathon idea into phases, milestones, and tasks with AI.",
      },
      { property: "og:title", content: "AI Planner — HackPilot" },
      {
        property: "og:description",
        content: "Generate a realistic hackathon execution plan in seconds.",
      },
    ],
  }),
  component: Planner,
});

function Planner() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const generateFn = useServerFn(generatePlan);
  const applyFn = useServerFn(applyPlan);

  const [idea, setIdea] = useState("");
  const [plan, setPlan] = useState<ProjectPlan | null>(null);

  const generate = useMutation({
    mutationFn: () => generateFn({ data: { projectId, idea } }),
    onSuccess: (result) => setPlan(result),
    onError: (error) => toast.error(error.message),
  });

  const apply = useMutation({
    mutationFn: () => applyFn({ data: { projectId, plan: plan as ProjectPlan } }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success(`Added ${result.milestones} milestones and ${result.tasks} tasks`);
      navigate({ to: "/projects/$projectId/board", params: { projectId } });
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <AppShell title="AI Planner">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        <Card className="border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold">Describe your idea</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            The planner scopes it for a 24–72 hour hackathon: phases, milestones, and concrete
            tasks.
          </p>
          <Textarea
            className="mt-4"
            rows={6}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="An AI triage assistant that helps rural clinics prioritise walk-in patients using voice input…"
          />
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => generate.mutate()}
              disabled={idea.trim().length < 10 || generate.isPending}
            >
              <Wand2 className="mr-1 h-4 w-4" />
              {generate.isPending ? "Planning…" : "Generate plan"}
            </Button>
          </div>
        </Card>

        {plan ? (
          <Card className="border-border bg-card p-6">
            <h3 className="font-display text-lg font-bold">Proposed plan</h3>
            <p className="mt-2 text-sm text-muted-foreground">{plan.summary}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {plan.tech_stack.map((t) => (
                <Badge key={t} variant="secondary" className="font-normal">
                  {t}
                </Badge>
              ))}
            </div>

            <h4 className="mt-6 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Phases
            </h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {plan.phases.map((p) => (
                <div key={p.name} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <span className="text-xs text-muted-foreground">{p.duration}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                </div>
              ))}
            </div>

            <h4 className="mt-6 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Milestones ({plan.milestones.length})
            </h4>
            <ul className="mt-3 space-y-2">
              {plan.milestones.map((m) => (
                <li key={m.title} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{m.title}</p>
                    <span className="text-xs text-muted-foreground">
                      day {Math.max(0, Math.round(m.due_offset_days))}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
                </li>
              ))}
            </ul>

            <h4 className="mt-6 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Tasks ({plan.tasks.length})
            </h4>
            <ul className="mt-3 space-y-2">
              {plan.tasks.map((t) => (
                <li
                  key={t.title}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 font-normal">
                    {t.priority}
                  </Badge>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPlan(null)}>
                Discard
              </Button>
              <Button onClick={() => apply.mutate()} disabled={apply.isPending}>
                {apply.isPending ? "Applying…" : "Apply plan to project"}
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
