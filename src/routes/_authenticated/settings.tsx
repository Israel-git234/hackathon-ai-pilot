import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Profile settings — HackPilot" },
      { name: "description", content: "Update your HackPilot display name and bio." },
      { property: "og:title", content: "Profile settings — HackPilot" },
      { property: "og:description", content: "Manage your HackPilot account profile." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profileFn = useServerFn(getMyProfile);
  const updateFn = useServerFn(updateMyProfile);
  const { data: profile } = useQuery({ queryKey: ["my-profile"], queryFn: () => profileFn() });

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setBio(profile.bio ?? "");
    }
  }, [profile]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const save = useMutation({
    mutationFn: () => updateFn({ data: { display_name: displayName, bio } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Profile updated");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <AppShell title="Profile settings">
      <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <h2 className="font-display text-2xl font-bold tracking-tight">Your profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This is how teammates see you across projects.
        </p>

        <Card className="mt-6 space-y-5 border-border bg-card p-6">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} readOnly disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Frontend dev, loves shipping demos at 3am."
            />
          </div>
          <div className="flex justify-between pt-1">
            <Button variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>
              Back
            </Button>
            <Button
              onClick={() => save.mutate()}
              disabled={save.isPending || displayName.trim().length === 0}
            >
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
