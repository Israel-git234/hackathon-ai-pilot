import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProject, listHackathons } from "@/lib/projects.functions";

export const Route = createFileRoute("/_authenticated/projects/new")({
  head: () => ({
    meta: [
      { title: "New project — HackPilot" },
      { name: "description", content: "Create a hackathon project workspace for your team." },
      { property: "og:title", content: "New project — HackPilot" },
      { property: "og:description", content: "Spin up a hackathon workspace in under a minute." },
    ],
  }),
  component: NewProject,
});

const CUSTOM = "__custom__";

function NewProject() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hackathonsFn = useServerFn(listHackathons);
  const createFn = useServerFn(createProject);

  const { data: hackathons } = useQuery({
    queryKey: ["hackathons"],
    queryFn: () => hackathonsFn(),
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [idea, setIdea] = useState("");
  const [hackathonId, setHackathonId] = useState<string>(CUSTOM);
  const [customHackathon, setCustomHackathon] = useState("");
  const [deadline, setDeadline] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const selected = hackathons?.find((h) => h.id === hackathonId);
      return createFn({
        data: {
          name,
          description: description || null,
          idea: idea || null,
          hackathon_id: selected ? selected.id : null,
          hackathon_name: selected ? selected.name : customHackathon || null,
          deadline: deadline || null,
        },
      });
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["my-projects"] });
      toast.success("Project created");
      navigate({ to: "/projects/$projectId/planner", params: { projectId: project.id } });
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <AppShell title="New project">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h2 className="font-display text-2xl font-bold tracking-tight">Create a project</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Give the workspace a name and drop in your idea — the AI planner takes it from there.
        </p>

        <Card className="mt-6 space-y-5 border-border bg-card p-6">
          <div className="space-y-1.5">
            <Label htmlFor="name">Project name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="MediMind"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Short description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="AI triage assistant for rural clinics"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="idea">Your idea</Label>
            <Textarea
              id="idea"
              rows={5}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe the problem, who it's for, and what you want to build this weekend…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Hackathon</Label>
              <Select value={hackathonId} onValueChange={setHackathonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a hackathon" />
                </SelectTrigger>
                <SelectContent>
                  {(hackathons ?? []).map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM}>Other / custom</SelectItem>
                </SelectContent>
              </Select>
              {hackathonId === CUSTOM ? (
                <Input
                  className="mt-2"
                  value={customHackathon}
                  onChange={(e) => setCustomHackathon(e.target.value)}
                  placeholder="Hackathon name"
                />
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deadline">Submission deadline</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>
              Cancel
            </Button>
            <Button
              onClick={() => create.mutate()}
              disabled={name.trim().length < 2 || create.isPending}
            >
              {create.isPending ? "Creating…" : "Create project"}
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
