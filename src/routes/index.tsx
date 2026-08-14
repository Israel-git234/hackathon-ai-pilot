import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
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
          "Plan with AI, run your task board, keep standups tight, and generate a winning submission — HackPilot is the workspace built for hackathon teams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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

const steps = [
  {
    n: "01",
    title: "Describe the idea",
    body: "Drop in your concept and the hackathon you're building for. That's the whole setup.",
  },
  {
    n: "02",
    title: "Let AI build the plan",
    body: "Phases, milestones and prioritised tasks land on your board, assigned and dated.",
  },
  {
    n: "03",
    title: "Ship the submission",
    body: "Standups keep the team honest; the submission center writes the docs and scores you.",
  },
];

const stats = [
  { value: "48h", label: "The window HackPilot is designed around" },
  { value: "8", label: "Workspaces replaced by one tool" },
  { value: "0-100", label: "Readiness score before you hit submit" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue shadow-glow">
              <Rocket className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">HackPilot</span>
          </div>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth" search={{ mode: "signup" }}>
                Get started
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 pt-20 pb-16">
        <div
          aria-hidden
          className="pointer-events-none absolute top-[-14rem] left-1/2 h-[34rem] w-[56rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[150px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.045] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-primary" />
            Built for the 48-hour sprint
          </span>
          <h1 className="mt-6 font-display text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-6xl">
            The AI workspace for{" "}
            <span className="text-gradient">hackathon teams</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
            Plan the idea, split the work, keep the team in sync, and ship a submission judges
            remember — all in one place, from kickoff to demo.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="shadow-glow">
              <Link to="/auth" search={{ mode: "signup" }}>
                Start free
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card. Invite your whole team with one link.
          </p>
        </div>

        {/* Product preview */}
        <div className="relative mx-auto mt-14 max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-border bg-card/80 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              <span className="ml-3 text-xs text-muted-foreground">
                hackpilot / smart-campus-navigator
              </span>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-3 sm:p-6">
              {[
                { label: "To do", items: ["Auth + profiles", "Seed hackathons"], tone: "muted" },
                {
                  label: "In progress",
                  items: ["Realtime board", "AI planner prompt"],
                  tone: "primary",
                },
                { label: "Done", items: ["Design system", "Landing page"], tone: "success" },
              ].map((col) => (
                <div key={col.label} className="rounded-xl border border-border bg-background/60 p-3">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>{col.label}</span>
                    <span>{col.items.length}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {col.items.map((t) => (
                      <div
                        key={t}
                        className="rounded-lg border border-border bg-card px-3 py-2 text-xs"
                      >
                        <span
                          className={
                            col.tone === "primary"
                              ? "text-primary"
                              : col.tone === "success"
                                ? "text-success"
                                : "text-muted-foreground"
                          }
                        >
                          ●
                        </span>{" "}
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-8 -bottom-6 h-16 rounded-full bg-primary/20 blur-3xl"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label} className="border-border bg-card/60 p-6">
              <p className="font-display text-3xl font-bold text-gradient">{s.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 pb-24">
        <div className="max-w-2xl">
          <span className="text-xs font-medium tracking-widest text-primary uppercase">
            Features
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-balance">
            Everything a hackathon team juggles, in one workspace
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card
              key={f.title}
              className="group relative overflow-hidden border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
              />
              <div className="relative">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/60">
                  <f.icon className="h-4 w-4 text-primary" />
                </span>
                <h3 className="mt-4 font-display text-sm font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-6 pb-24">
        <div className="max-w-2xl">
          <span className="text-xs font-medium tracking-widest text-primary uppercase">
            How it works
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-balance">
            From idea to submission in three moves
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <Card key={s.n} className="border-border bg-card p-6">
              <span className="font-mono text-xs text-primary">{s.n}</span>
              <h3 className="mt-3 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28">
        <Card className="relative overflow-hidden border-border bg-card p-10 text-center sm:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-blue/20"
          />
          <div className="relative">
            <h2 className="font-display text-2xl font-bold tracking-tight text-balance sm:text-4xl">
              Spend the weekend building, not managing tools
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground sm:text-base">
              Create a project, invite your team with one link, and let HackPilot handle the rest.
            </p>
            <Button asChild size="lg" className="mt-8 shadow-glow">
              <Link to="/auth" search={{ mode: "signup" }}>
                Get started free
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </section>

      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
              <Rocket className="h-3 w-3 text-primary-foreground" />
            </span>
            <span className="font-display text-sm font-semibold">HackPilot</span>
          </div>
          <p className="text-xs text-muted-foreground">
            AI workspace for hackathon teams. Built for builders.
          </p>
        </div>
      </footer>
    </div>
  );
}
