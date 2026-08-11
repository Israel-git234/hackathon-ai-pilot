import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell, initials } from "@/components/app/AppShell";
import { Markdown } from "@/components/app/Markdown";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { summarizeDiscussion } from "@/lib/ai.functions";
import { getSharedNote, listMessages, postMessage, saveSharedNote } from "@/lib/team.functions";

export const Route = createFileRoute("/_authenticated/projects/$projectId/team")({
  head: () => ({
    meta: [
      { title: "Team Hub — HackPilot" },
      { name: "description", content: "Team discussion and shared notes for your project." },
      { property: "og:title", content: "Team Hub — HackPilot" },
      { property: "og:description", content: "Chat, mention teammates, and keep shared notes." },
    ],
  }),
  component: TeamHub,
});

function TeamHub() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();
  const messagesFn = useServerFn(listMessages);
  const postFn = useServerFn(postMessage);
  const noteFn = useServerFn(getSharedNote);
  const saveNoteFn = useServerFn(saveSharedNote);
  const summarizeFn = useServerFn(summarizeDiscussion);

  const [content, setContent] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [summary, setSummary] = useState("");

  const { data: messages } = useQuery({
    queryKey: ["messages", projectId],
    queryFn: () => messagesFn({ data: { projectId } }),
    refetchInterval: 15000,
  });
  const { data: sharedNote } = useQuery({
    queryKey: ["note", projectId],
    queryFn: () => noteFn({ data: { projectId } }),
  });

  const send = useMutation({
    mutationFn: () => postFn({ data: { projectId, content } }),
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["messages", projectId] });
    },
    onError: (error) => toast.error(error.message),
  });

  const saveNote = useMutation({
    mutationFn: () => saveNoteFn({ data: { projectId, content: note ?? "" } }),
    onSuccess: () => toast.success("Notes saved"),
    onError: (error) => toast.error(error.message),
  });

  const summarize = useMutation({
    mutationFn: () => summarizeFn({ data: { projectId } }),
    onSuccess: (result) => setSummary(result.summary),
    onError: (error) => toast.error(error.message),
  });

  const noteValue = note ?? sharedNote?.content ?? "";

  return (
    <AppShell title="Team Hub">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="flex h-[70vh] flex-col border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Discussion</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => summarize.mutate()}
              disabled={summarize.isPending}
            >
              <Sparkles className="mr-1 h-4 w-4" />
              {summarize.isPending ? "Summarizing…" : "AI summary"}
            </Button>
          </div>
          {summary ? (
            <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3">
              <Markdown>{summary}</Markdown>
            </div>
          ) : null}
          <div className="mt-3 flex-1 space-y-4 overflow-y-auto pr-1">
            {(messages ?? []).map((m) => (
              <div key={m.id} className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/15 text-xs text-primary">
                    {initials(m.profile?.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {m.profile?.display_name ?? "Teammate"}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {messages?.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No messages yet — say hi to your team.
              </p>
            ) : null}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Message your team… use @name to mention"
              onKeyDown={(e) => {
                if (e.key === "Enter" && content.trim()) send.mutate();
              }}
            />
            <Button
              onClick={() => send.mutate()}
              disabled={!content.trim() || send.isPending}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card className="border-border bg-card p-4">
          <h2 className="font-display text-base font-semibold">Shared notes</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            A scratchpad everyone on the team can edit.
          </p>
          <Textarea
            className="mt-3 min-h-[45vh]"
            value={noteValue}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Decisions, credentials to share, demo checklist…"
          />
          <Button
            className="mt-3 w-full"
            onClick={() => saveNote.mutate()}
            disabled={saveNote.isPending}
          >
            {saveNote.isPending ? "Saving…" : "Save notes"}
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
