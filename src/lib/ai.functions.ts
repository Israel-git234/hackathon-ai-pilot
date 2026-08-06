import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { notifyUsers, requireMembership } from "./db.server";
import type { ProjectPlan, ReadinessResult } from "./types";

export const generatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ projectId: z.string().uuid(), idea: z.string().min(3).max(4000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    const { NoObjectGeneratedError, Output, streamText } = await import("ai");
    const { buildProjectContext, friendlyAiError, getGateway, AI_MODEL } = await import(
      "./ai.server"
    );

    const contextText = await buildProjectContext(supabase, data.projectId);
    const gateway = getGateway();
    try {
      const result = streamText({
        model: gateway(AI_MODEL),
        output: Output.object({
          schema: z.object({
            summary: z.string(),
            tech_stack: z.array(z.string()),
            phases: z.array(
              z.object({ name: z.string(), description: z.string(), duration: z.string() }),
            ),
            milestones: z.array(
              z.object({
                title: z.string(),
                description: z.string(),
                due_offset_days: z.number(),
              }),
            ),
            tasks: z.array(
              z.object({
                title: z.string(),
                description: z.string(),
                priority: z.enum(["low", "medium", "high", "urgent"]),
                labels: z.array(z.string()),
                phase: z.string(),
              }),
            ),
          }),
        }),
        system:
          "You are HackPilot's AI project planner for hackathon teams. Turn a raw idea into a realistic hackathon execution plan. Keep scope achievable for a 24-72 hour hackathon: 3-5 phases, 4-6 milestones, 12-20 concrete tasks. due_offset_days is days from today. Prioritize a working demo over breadth.",
        prompt: `Project idea:\n${data.idea}\n\nCurrent project context:\n${contextText}`,
      });
      const output = await result.output;
      if (!output) throw new Error("The AI returned an empty plan. Try again.");
      return output as ProjectPlan;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("The AI plan didn't come back in the right shape. Try again.");
      }
      throw friendlyAiError(error);
    }
  });

export const applyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        plan: z.object({
          summary: z.string(),
          tech_stack: z.array(z.string()),
          phases: z.array(
            z.object({ name: z.string(), description: z.string(), duration: z.string() }),
          ),
          milestones: z.array(
            z.object({ title: z.string(), description: z.string(), due_offset_days: z.number() }),
          ),
          tasks: z.array(
            z.object({
              title: z.string(),
              description: z.string(),
              priority: z.enum(["low", "medium", "high", "urgent"]),
              labels: z.array(z.string()),
              phase: z.string(),
            }),
          ),
        }),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);

    const { count: milestoneCount } = await supabase
      .from("milestones")
      .select("id", { count: "exact", head: true })
      .eq("project_id", data.projectId);
    const today = new Date();
    const milestoneRows = data.plan.milestones.map((m, i) => {
      const due = new Date(today);
      due.setDate(due.getDate() + Math.max(0, Math.round(m.due_offset_days)));
      return {
        project_id: data.projectId,
        title: m.title,
        description: m.description,
        due_date: due.toISOString().slice(0, 10),
        position: (milestoneCount ?? 0) + i,
      };
    });
    if (milestoneRows.length > 0) {
      const { error } = await supabase.from("milestones").insert(milestoneRows);
      if (error) throw new Error(error.message);
    }

    const { data: lastTask } = await supabase
      .from("tasks")
      .select("position")
      .eq("project_id", data.projectId)
      .eq("status", "backlog")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    let position = (lastTask?.position ?? -1) + 1;
    const taskRows = data.plan.tasks.map((t) => ({
      project_id: data.projectId,
      title: t.title,
      description: `${t.description}\n\n_Phase: ${t.phase}_`,
      status: "backlog" as const,
      priority: t.priority,
      labels: [...t.labels, t.phase].slice(0, 6),
      position: position++,
      created_by: userId,
    }));
    if (taskRows.length > 0) {
      const { error } = await supabase.from("tasks").insert(taskRows);
      if (error) throw new Error(error.message);
    }

    const { error: ideaError } = await supabase
      .from("projects")
      .update({ idea: data.plan.summary })
      .eq("id", data.projectId);
    if (ideaError) throw new Error(ideaError.message);

    return { milestones: milestoneRows.length, tasks: taskRows.length };
  });

export const standupDigest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ projectId: z.string().uuid(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    const { streamText } = await import("ai");
    const { buildProjectContext, friendlyAiError, getGateway, AI_MODEL } = await import(
      "./ai.server"
    );
    const { profilesById } = await import("./db.server");

    const { data: updates } = await supabase
      .from("daily_updates")
      .select("user_id, finished, planned, blockers")
      .eq("project_id", data.projectId)
      .eq("update_date", data.date);
    if (!updates || updates.length === 0) {
      throw new Error("No standups posted today yet.");
    }
    const profiles = await profilesById(supabase, updates.map((u) => u.user_id));
    const contextText = await buildProjectContext(supabase, data.projectId);
    const standupText = updates
      .map(
        (u) =>
          `${profiles.get(u.user_id)?.display_name ?? "Member"}: finished "${u.finished}"; planned "${u.planned}"; blockers "${u.blockers}"`,
      )
      .join("\n");

    const gateway = getGateway();
    try {
      const result = streamText({
        model: gateway(AI_MODEL),
        system:
          "You are HackPilot's standup analyst for hackathon teams. Given today's standups, produce a tight markdown digest: **Progress** (what shipped), **Risks** (blockers and slipping work, flag urgency), **Suggested focus** (3 concrete priorities for the next hours). Keep it under 250 words, direct and specific.",
        prompt: `Project context:\n${contextText}\n\nToday's standups (${data.date}):\n${standupText}`,
      });
      const digest = await result.text;
      return { digest };
    } catch (error) {
      throw friendlyAiError(error);
    }
  });

export const summarizeDiscussion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    const { streamText } = await import("ai");
    const { friendlyAiError, getGateway, AI_MODEL } = await import("./ai.server");
    const { profilesById } = await import("./db.server");

    const { data: messages } = await supabase
      .from("messages")
      .select("user_id, content, created_at")
      .eq("project_id", data.projectId)
      .order("created_at", { ascending: false })
      .limit(80);
    if (!messages || messages.length === 0) {
      throw new Error("No discussion to summarize yet.");
    }
    const profiles = await profilesById(supabase, messages.map((m) => m.user_id));
    const transcript = messages
      .reverse()
      .map((m) => `${profiles.get(m.user_id)?.display_name ?? "Member"}: ${m.content}`)
      .join("\n");

    const gateway = getGateway();
    try {
      const result = streamText({
        model: gateway(AI_MODEL),
        system:
          "You are HackPilot's team discussion summarizer. Summarize the recent team chat in tight markdown: **Key decisions**, **Open questions**, **Action items** (with owners if mentioned). Under 200 words.",
        prompt: transcript,
      });
      const summary = await result.text;
      return { summary };
    } catch (error) {
      throw friendlyAiError(error);
    }
  });

export const readinessScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    const { NoObjectGeneratedError, Output, streamText } = await import("ai");
    const { buildProjectContext, friendlyAiError, getGateway, AI_MODEL } = await import(
      "./ai.server"
    );

    const contextText = await buildProjectContext(supabase, data.projectId);
    const gateway = getGateway();
    try {
      const result = streamText({
        model: gateway(AI_MODEL),
        output: Output.object({
          schema: z.object({
            score: z.number(),
            breakdown: z.array(
              z.object({
                criterion: z.string(),
                score: z.number(),
                max: z.number(),
                note: z.string(),
              }),
            ),
            recommendations: z.array(z.string()),
          }),
        }),
        system:
          "You are HackPilot's submission readiness evaluator for hackathon teams. Score the project 0-100 across exactly 5 criteria (20 points each): Prototype completeness (tasks done vs planned), Documentation (generated docs present and quality implied by project info), Innovation & clarity of idea, Demo readiness (milestones progress, remaining work vs deadline), Team momentum (standup activity, task movement). Be honest and constructive. Provide 3-5 concrete recommendations, highest impact first.",
        prompt: `Evaluate this hackathon project:\n${contextText}`,
      });
      const output = await result.output;
      if (!output) throw new Error("The AI returned an empty evaluation. Try again.");
      return output as ReadinessResult;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("The AI evaluation didn't come back in the right shape. Try again.");
      }
      throw friendlyAiError(error);
    }
  });

export const generateDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        docType: z.enum(["readme", "devpost", "overview", "tech_stack", "demo_script", "pitch"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    const { streamText } = await import("ai");
    const { buildProjectContext, friendlyAiError, getGateway, AI_MODEL } = await import(
      "./ai.server"
    );

    const docInstructions: Record<string, string> = {
      readme:
        "Write a polished GitHub README.md: project name with tagline, problem, solution, key features, tech stack, setup instructions (generic but plausible), screenshots placeholder, team section, license line.",
      devpost:
        "Write a Devpost submission in markdown with sections: Inspiration, What it does, How we built it, Challenges we ran into, Accomplishments we're proud of, What we learned, What's next. Make it vivid and judge-friendly.",
      overview:
        "Write a one-page project overview: the problem, the solution, target users, impact, and what makes it original. Crisp prose with short sections.",
      tech_stack:
        "Write a technology stack document: architecture overview, frontend/backend/AI/data choices with one-line rationales each, and notable implementation details. Markdown with headers and bullets.",
      demo_script:
        "Write a minute-by-minute live demo script for a 3-minute hackathon demo: hook (0:00-0:20), problem (0:20-0:40), live walkthrough beats with what to click and say, closing statement. Include speaker notes.",
      pitch:
        "Write a 60-second spoken elevator pitch for judges: hook, problem, solution, why it wins. Conversational, memorable, ~150 words.",
    };

    const contextText = await buildProjectContext(supabase, data.projectId);
    const gateway = getGateway();
    try {
      const result = streamText({
        model: gateway(AI_MODEL),
        system:
          "You are HackPilot's submission writer. Produce polished markdown tailored to the project. Be specific to the actual idea, tasks, and team — never generic filler.",
        prompt: `${docInstructions[data.docType]}\n\nProject context:\n${contextText}`,
      });
      const content = await result.text;

      const { data: existing } = await supabase
        .from("generated_documents")
        .select("id")
        .eq("project_id", data.projectId)
        .eq("doc_type", data.docType)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("generated_documents")
          .update({ content, updated_by: userId })
          .eq("id", existing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("generated_documents")
          .insert({
            project_id: data.projectId,
            doc_type: data.docType,
            content,
            updated_by: userId,
          });
        if (error) throw new Error(error.message);
      }
      return { content };
    } catch (error) {
      throw friendlyAiError(error);
    }
  });

export const listDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    const { data: docs, error } = await supabase
      .from("generated_documents")
      .select("*")
      .eq("project_id", data.projectId);
    if (error) throw new Error(error.message);
    return docs ?? [];
  });

export const saveDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        docType: z.enum(["readme", "devpost", "overview", "tech_stack", "demo_script", "pitch"]),
        content: z.string().max(60000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    const { data: existing } = await supabase
      .from("generated_documents")
      .select("id")
      .eq("project_id", data.projectId)
      .eq("doc_type", data.docType)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from("generated_documents")
        .update({ content: data.content, updated_by: userId })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("generated_documents").insert({
        project_id: data.projectId,
        doc_type: data.docType,
        content: data.content,
        updated_by: userId,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const listConversations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    const { data: conversations, error } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("project_id", data.projectId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return conversations ?? [];
  });

export const createConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ projectId: z.string().uuid(), title: z.string().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    const { data: conversation, error } = await supabase
      .from("ai_conversations")
      .insert({ project_id: data.projectId, user_id: userId, title: data.title })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return conversation;
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ conversationId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ai_conversations")
      .delete()
      .eq("id", data.conversationId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listConversationMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ conversationId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: messages, error } = await context.supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", data.conversationId)
      .order("created_at");
    if (error) throw new Error(error.message);
    return messages ?? [];
  });

export const saveMentorTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        conversationId: z.string().uuid(),
        user: z.string().min(1).max(8000),
        assistant: z.string().min(1).max(30000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: owns } = await supabase.rpc("owns_conversation", {
      _conversation_id: data.conversationId,
      _user_id: userId,
    });
    if (!owns) throw new Error("Conversation not found.");
    const { error } = await supabase.from("ai_messages").insert([
      { conversation_id: data.conversationId, role: "user", content: data.user },
      { conversation_id: data.conversationId, role: "assistant", content: data.assistant },
    ]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
