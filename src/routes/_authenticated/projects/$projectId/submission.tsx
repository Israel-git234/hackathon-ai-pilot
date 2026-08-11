import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Markdown } from "@/components/app/Markdown";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DOC_TYPES } from "@/lib/constants";
import { generateDocument, readinessScore } from "@/lib/ai.functions";
import type { ReadinessResult } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/projects/$projectId/submission")({
  head: () => ({
    meta: [
      { title: "Submission Center — HackPilot" },
      { name: "description", content: "Generate your Devpost draft, README, and pitch script." },
      { property: "og:title", content: "Submission Center — HackPilot" },
      { property: "og:description", content: "Check readiness and ship your hackathon submission." },
    ],
  }),
  component: Submission,
});

function Submission() {
  const { projectId } = Route.useParams();
  const docFn = useServerFn(generateDocument);
  const scoreFn = useServerFn(readinessScore);
  const [doc, setDoc] = useState("");
  const [score, setScore] = useState<ReadinessResult | null>(null);

  const generate = useMutation({
    mutationFn: (docType: string) =>
      docFn({ data: { projectId, docType: docType as "devpost" | "readme" | "pitch" } }),
    onSuccess: (result) => setDoc(result.content),
    onError: (error) => toast.error(error.message),
  });

  const check = useMutation({
    mutationFn: () => scoreFn({ data: { projectId } }),
    onSuccess: (result) => setScore(result),
    onError: (error) => toast.error(error.message),
  });

  return (
    <AppShell title="Submission Center">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        <Card className="border-border bg-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold">Readiness score</h2>
              <p className="text-xs text-muted-foreground">
                AI review of how submission-ready your project is.
              </p>
            </div>
            <Button variant="outline" onClick={() => check.mutate()} disabled={check.isPending}>
              <Sparkles className="mr-1 h-4 w-4" />
              {check.isPending ? "Checking…" : "Check readiness"}
            </Button>
          </div>
          {score ? (
            <div className="mt-4">
              <p className="font-display text-3xl font-bold">{score.score}/100</p>
              <Progress value={score.score} className="mt-2" />
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {score.breakdown.map((b) => (
                  <li key={b.criterion}>
                    <span className="font-medium text-foreground">
                      {b.criterion}: {b.score}/{b.max}
                    </span>{" "}
                    — {b.note}
                  </li>
                ))}
              </ul>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {score.recommendations.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>

        <Card className="border-border bg-card p-6">
          <h2 className="font-display text-base font-semibold">Generate submission documents</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {DOC_TYPES.map((d) => (
              <Button
                key={d.id}
                variant="secondary"
                onClick={() => generate.mutate(d.id)}
                disabled={generate.isPending}
              >
                {d.label}
              </Button>
            ))}
          </div>
          {doc ? (
            <div className="mt-4 rounded-lg border border-border p-4">
              <Markdown>{doc}</Markdown>
            </div>
          ) : null}
        </Card>
      </div>
    </AppShell>
  );
}
