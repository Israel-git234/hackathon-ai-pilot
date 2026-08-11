import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { Send } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Markdown } from "@/components/app/Markdown";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/projects/$projectId/mentor")({
  head: () => ({
    meta: [
      { title: "AI Mentor — HackPilot" },
      { name: "description", content: "Ask an AI hackathon mentor about scope, demos, and pitch." },
      { property: "og:title", content: "AI Mentor — HackPilot" },
      { property: "og:description", content: "Grounded advice based on your project's real data." },
    ],
  }),
  component: Mentor,
});

function Mentor() {
  const { projectId } = Route.useParams();
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    id: projectId,
    transport: new DefaultChatTransport({ api: "/api/chat", body: { projectId } }),
  });
  const isLoading = status === "submitted" || status === "streaming";

  return (
    <AppShell title="AI Mentor">
      <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
        <Card className="flex-1 space-y-4 overflow-y-auto border-border bg-card p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ask anything: "Is our scope realistic?", "How should we structure the demo?", "What
              should we cut?"
            </p>
          ) : null}
          {messages.map((m) => {
            const text = m.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join("");
            return (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-lg bg-primary/15 p-3 text-sm"
                    : "max-w-[95%] rounded-lg border border-border p-3"
                }
              >
                {m.role === "user" ? text : <Markdown>{text}</Markdown>}
              </div>
            );
          })}
        </Card>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your mentor…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim() && !isLoading) {
                sendMessage({ text: input.trim() });
                setInput("");
              }
            }}
          />
          <Button
            aria-label="Send"
            disabled={!input.trim() || isLoading}
            onClick={() => {
              sendMessage({ text: input.trim() });
              setInput("");
            }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
