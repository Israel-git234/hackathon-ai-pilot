import { createFileRoute } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";

const MENTOR_SYSTEM = `You are HackPilot's AI mentor, embedded in a hackathon team's workspace.
You help teams: brainstorm features that impress judges, sharpen originality, prioritize ruthlessly under time pressure, understand judging criteria, and review ideas with concrete improvement suggestions.

Style rules:
- Be direct, specific, and encouraging. Hackathons are time-boxed — favor shippable scope.
- Use markdown: short paragraphs, bullets, bold for key points, code blocks when useful.
- Ground answers in the project context below when relevant.
- If asked something unrelated to the hackathon/project, answer briefly and steer back.

PROJECT CONTEXT:
`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice(7);
        if (token.split(".").length !== 3) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient<Database>(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_PUBLISHABLE_KEY"]!,
          {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          },
        );
        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
        const userId = claimsData?.claims?.sub;
        if (claimsError || !userId) {
          return new Response("Unauthorized", { status: 401 });
        }

        let body: { messages?: unknown; projectId?: unknown };
        try {
          body = await request.json();
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        const projectId = typeof body.projectId === "string" ? body.projectId : null;
        if (!projectId || !Array.isArray(body.messages)) {
          return new Response("Bad request", { status: 400 });
        }

        const { data: isMember } = await supabase.rpc("is_project_member", {
          _project_id: projectId,
          _user_id: userId,
        });
        if (!isMember) {
          return new Response("Forbidden", { status: 403 });
        }

        const { buildProjectContext } = await import("@/lib/ai.server");
        const {
          AI_MODEL,
          createLovableAiGatewayProvider,
          getLovableAiGatewayResponseHeaders,
          getLovableAiGatewayRunId,
          withLovableAiGatewayRunIdHeader,
        } = await import("@/lib/ai-gateway.server");
        const { streamText, convertToModelMessages } = await import("ai");

        const lovableKey = process.env["LOVABLE_API_KEY"];
        if (!lovableKey) {
          return new Response("AI is not configured for this workspace.", { status: 500 });
        }

        const contextText = await buildProjectContext(supabase, projectId);
        const initialRunId = getLovableAiGatewayRunId(request);
        const gateway = createLovableAiGatewayProvider(lovableKey, initialRunId);

        const modelMessages = await convertToModelMessages(body.messages as never);
        const result = streamText({
          model: gateway(AI_MODEL),
          system: MENTOR_SYSTEM + contextText,
          messages: modelMessages,
        });

        const response = result.toUIMessageStreamResponse({
          headers: getLovableAiGatewayResponseHeaders(undefined, {
            ...(initialRunId ? { "X-Lovable-AIG-Run-ID": initialRunId } : {}),
          }),
        });
        return withLovableAiGatewayRunIdHeader(response, gateway);
      },
    },
  },
});
