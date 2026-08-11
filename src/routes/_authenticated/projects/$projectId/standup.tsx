import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell, initials } from "@/components/app/AppShell";
import { Markdown } from "@/components/app/Markdown";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { standupDigest } from "@/lib/ai.functions";
import { getMyStandup, listStandups, saveStandup } from "@/lib/standups.functions";

export const Route = createFileRoute("/_authenticated/projects/$projectId/standup")({
  head: () => ({
    meta: [
      { title: "Daily Stand-up — HackPilot" },
      { name: "description", content: "Post finished work, plans, and blockers for the day." },
      { property: "og:title", content: "Daily Stand-up — HackPilot" },
      { property: "og:description", content: "Keep your hackathon team in sync every day." },
    ],
  }),
  component: Standup,
});

function Standup() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();
  const date = new Date().toISOString().slice(0, 10);
  const listFn = useServerFn(listStandups);
  const mineFn = useServerFn(getMyStandup);
  const saveFn = useServerFn(saveStandup);
  const digestFn = useServerFn(standupDigest);

  const [finished, setFinished] = useState("");
  const [planned, setPlanned] = useState("");
  const [blockers, setBlockers] = useState("");
  const [digest, setDigest] = useState("");

  const { data: mine } = useQuery({
    queryKey: ["standup", projectId, date, "mine"],
    queryFn: () => mineFn({ data: { projectId, date } }),
  });
  const { data: all } = useQuery({
    queryKey: ["standup", projectId, date, "all"],
    queryFn: () => listFn({ data: { projectId, date } }),
  });

  useEffect(() => {
    if (mine) {
      setFinished(mine.finished ?? "");
      setPlanned(mine.planned ?? "");
      setBlockers(mine.blockers ?? "");
    }
  }, [mine]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: { projectId, date, finished, planned, blockers } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standup", projectId, date] });
      toast.success("Stand-up posted");
    },
    onError: (error) => toast.error(error.message),
  });

  const summarize = useMutation({
    mutationFn: () => digestFn({ data: { projectId, date } }),
    onSuccess: (result) => setDigest(result.digest),
    onError: (error) => toast.error(error.message),
  });

  return (
    <AppShell title="Daily Stand-up">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-2">
        <Card className="space-y-4 border-border bg-card p-6">
          <h2 className="font-display text-base font-semibold">Your update — {date}</h2>
          <div className="space-y-1.5">
            <Label htmlFor="finished">What I finished</Label>
            <Textarea
              id="finished"
              rows={3}
              value={finished}
              onChange={(e) => setFinished(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="planned">What I'm working on next</Label>
            <Textarea
              id="planned"
              rows={3}
              value={planned}
              onChange={(e) => setPlanned(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="blockers">Blockers</Label>
            <Textarea
              id="blockers"
              rows={3}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : mine ? "Update stand-up" : "Post stand-up"}
          </Button>
        </Card>

        <Card className="border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Team stand-ups</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => summarize.mutate()}
              disabled={summarize.isPending}
            >
              <Sparkles className="mr-1 h-4 w-4" />
              {summarize.isPending ? "Working…" : "AI digest"}
            </Button>
          </div>
          {digest ? (
            <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3">
              <Markdown>{digest}</Markdown>
            </div>
          ) : null}
          <div className="mt-4 space-y-4">
            {(all ?? []).map((u) => (
              <div key={u.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary/15 text-[10px] text-primary">
                      {initials(u.profile?.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium">{u.profile?.display_name ?? "Teammate"}</p>
                </div>
                <dl className="mt-2 space-y-1 text-xs">
                  <div>
                    <dt className="inline font-semibold text-muted-foreground">Finished: </dt>
                    <dd className="inline">{u.finished || "—"}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-muted-foreground">Next: </dt>
                    <dd className="inline">{u.planned || "—"}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-muted-foreground">Blockers: </dt>
                    <dd className="inline">{u.blockers || "—"}</dd>
                  </div>
                </dl>
              </div>
            ))}
            {all?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stand-ups posted today yet.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
