import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bot,
  CheckSquare,
  FileCheck,
  MessageSquare,
  Rocket,
  Sparkles,
  Sunrise,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HackPilot — AI Workspace for Hackathon Teams" },
      {
        name: "description",
        content:
          "Plan with AI, run your task board, keep standups tight, and generate a winning submission — HackPilot is the workspace built for hackathon teams.",
      },
      { property: "og:title", content: "HackPilot — AI Workspace for Hackathon Teams" },
      {
        property: "og:description",
        content:
          "One workspace for hackathon teams: AI planning, tasks, collaboration, progress tracking, and submission assistance.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Sparkles,
    title: "AI Project Planner",
    body: "Turn a raw idea into phases, milestones, and a full task list in seconds.",
  },
  {
    icon: CheckSquare,
    title: "Task Board",
    body: "A drag-and-drop kanban tuned for hackathon pace, with owners and priorities.",
  },
  {
    icon: MessageSquare,
    title: "Team Hub",
    body: "Discussion with mentions and reactions, a shared scratchpad, and file sharing.",
  },
  {
    icon: Sunrise,
    title: "Daily Stand-up",
    body: "Everyone posts finished, planned, and blockers — AI turns it into a digest.",
  },
  {
    icon: Bot,
    title: "AI Mentor",
    body: "A judge-savvy mentor that knows your project context and pushes your scope.",
  },
  {
    icon: TrendingUp,
    title: "Progress Dashboard",
    body: "Velocity, completion, and milestone health at a glance for the whole team.",
  },
  {
    icon: FileCheck,
    title: "Submission Center",
    body: "Generate READMEs, Devpost copy, demo scripts, and a pitch — then export.",
  },
  {
    icon: Rocket,
    title: "Readiness Score",
    body: "An honest 0-100 score with concrete recommendations before you submit.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Rocket className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">HackPilot</span>
        </div>
        <Button asChild size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <section className="relative overflow-hidden px-6 pt-16 pb-24">
        <div
          aria-hidden
          className="pointer-events-none absolute top-[-12rem] left-1/2 h-[32rem] w-[52rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]"
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            Built for the 48-hour sprint
          </span>
          <h1 className="mt-6 font-display text-4xl leading-tight font-bold tracking-tight text-balance sm:text-6xl">
            The AI workspace for{" "}
            <span className="bg-gradient-to-r from-primary to-blue bg-clip-text text-transparent">
              hackathon teams
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Plan the idea, split the work, keep the team in sync, and ship a submission judges
            remember — all in one place, from kickoff to demo.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Start free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth" search={{ mode: "signup" }}>
                Create a team project
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          Everything a hackathon team juggles, in one workspace
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="border-border bg-card p-5">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-display text-sm font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28">
        <Card className="relative overflow-hidden border-border bg-card p-10 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-blue/15"
          />
          <div className="relative">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Spend the weekend building, not managing tools
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
              Create a project, invite your team with one link, and let HackPilot handle the rest.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </Card>
      </section>

      <footer className="border-t border-border px-6 py-8">
        <p className="mx-auto max-w-6xl text-xs text-muted-foreground">
          HackPilot — AI workspace for hackathon teams.
        </p>
      </footer>
    </div>
  );
}
