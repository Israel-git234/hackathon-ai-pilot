import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Rocket, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getInvitePreview, joinProjectByCode } from "@/lib/projects.functions";

export const Route = createFileRoute("/join/$code")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Join a project — HackPilot" },
      { name: "description", content: "Accept a HackPilot invite and join your team's project." },
      { property: "og:title", content: "Join a project — HackPilot" },
      { property: "og:description", content: "You've been invited to a HackPilot workspace." },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const previewFn = useServerFn(getInvitePreview);
  const joinFn = useServerFn(joinProjectByCode);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  const { data: preview, isLoading } = useQuery({
    queryKey: ["invite", code],
    queryFn: () => previewFn({ data: { code } }),
    enabled: authed === true,
  });

  const join = useMutation({
    mutationFn: () => joinFn({ data: { code } }),
    onSuccess: (result) => {
      toast.success("You're in!");
      navigate({ to: "/projects/$projectId", params: { projectId: result.projectId as string } });
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm border-border bg-card p-6 text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Rocket className="h-5 w-5 text-primary-foreground" />
        </span>
        {authed === false ? (
          <>
            <h1 className="mt-4 font-display text-lg font-bold">Sign in to join</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You need a HackPilot account to accept this invite.
            </p>
            <Button
              className="mt-6 w-full"
              onClick={() =>
                navigate({ to: "/auth", search: { redirect: `/join/${code}` } })
              }
            >
              Sign in
            </Button>
          </>
        ) : isLoading || authed === null ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading invite…</p>
        ) : preview ? (
          <>
            <h1 className="mt-4 font-display text-lg font-bold">{preview.project_name}</h1>
            <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {preview.member_count} member{preview.member_count === 1 ? "" : "s"}
            </p>
            <Button
              className="mt-6 w-full"
              onClick={() => join.mutate()}
              disabled={join.isPending}
            >
              {join.isPending ? "Joining…" : "Join project"}
            </Button>
          </>
        ) : (
          <>
            <h1 className="mt-4 font-display text-lg font-bold">Invite not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This invite link is invalid or has been revoked.
            </p>
            <Button className="mt-6 w-full" onClick={() => navigate({ to: "/dashboard" })}>
              Go to dashboard
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
