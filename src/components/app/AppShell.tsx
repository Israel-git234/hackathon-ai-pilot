import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode } from "react";
import {
  Bell,
  Bot,
  CheckSquare,
  FileCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Rocket,
  Settings,
  Sparkles,
  Sunrise,
  TrendingUp,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadNotificationCount,
} from "@/lib/notifications.functions";
import { listMyProjects } from "@/lib/projects.functions";
import { getMyProfile } from "@/lib/profile.functions";
import { cn } from "@/lib/utils";

const projectNav = [
  { to: "/projects/$projectId", label: "Overview", icon: Rocket, exact: true },
  { to: "/projects/$projectId/planner", label: "AI Planner", icon: Sparkles },
  { to: "/projects/$projectId/board", label: "Task Board", icon: CheckSquare },
  { to: "/projects/$projectId/team", label: "Team Hub", icon: MessageSquare },
  { to: "/projects/$projectId/standup", label: "Stand-up", icon: Sunrise },
  { to: "/projects/$projectId/mentor", label: "AI Mentor", icon: Bot },
  { to: "/projects/$projectId/progress", label: "Progress", icon: TrendingUp },
  { to: "/projects/$projectId/submission", label: "Submission", icon: FileCheck },
] as const;

function initials(name: string | null | undefined) {
  if (!name) return "HP";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const listProjects = useServerFn(listMyProjects);
  const { data: projects } = useQuery({
    queryKey: ["my-projects"],
    queryFn: () => listProjects(),
  });

  const match = /^\/projects\/([0-9a-f-]{36})/.exec(pathname);
  const activeProjectId = match?.[1];
  const activeProject = projects?.find((p) => p.id === activeProjectId);

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-2 px-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Rocket className="h-4 w-4 text-primary-foreground" />
        </span>
        <span className="font-display text-lg font-bold tracking-tight">HackPilot</span>
      </Link>

      <nav className="space-y-1">
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
            pathname === "/dashboard" && "bg-sidebar-accent text-foreground",
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        <Link
          to="/projects/new"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
            pathname === "/projects/new" && "bg-sidebar-accent text-foreground",
          )}
        >
          <Plus className="h-4 w-4" />
          New project
        </Link>
      </nav>

      {activeProject ? (
        <div className="min-h-0 flex-1">
          <p className="px-3 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {activeProject.name}
          </p>
          <ScrollArea className="h-full">
            <nav className="space-y-1 pr-2">
              {projectNav.map((item) => {
                const href = item.to.replace("$projectId", activeProject.id);
                const active = "exact" in item ? pathname === href : pathname === href;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    params={{ projectId: activeProject.id }}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
                      active && "bg-sidebar-accent text-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <Link
                to="/projects/$projectId/settings"
                params={{ projectId: activeProject.id }}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
                  pathname.endsWith("/settings") && "bg-sidebar-accent text-foreground",
                )}
              >
                <Settings className="h-4 w-4" />
                Project settings
              </Link>
            </nav>
          </ScrollArea>
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <p className="px-3 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Your projects
          </p>
          <ScrollArea className="h-full">
            <nav className="space-y-1 pr-2">
              {(projects ?? []).map((p) => (
                <Link
                  key={p.id}
                  to="/projects/$projectId"
                  params={{ projectId: p.id }}
                  onClick={onNavigate}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="truncate">{p.name}</span>
                </Link>
              ))}
              {projects?.length === 0 ? (
                <p className="px-3 text-sm text-muted-foreground">No projects yet.</p>
              ) : null}
            </nav>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

function NotificationBell() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const list = useServerFn(listNotifications);
  const count = useServerFn(unreadNotificationCount);
  const markRead = useServerFn(markNotificationRead);
  const markAll = useServerFn(markAllNotificationsRead);
  const [open, setOpen] = useState(false);

  const { data: unread } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => count(),
    refetchInterval: 30000,
  });
  const { data: notifications } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => list(),
    enabled: open,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread ? (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await markAll({});
              invalidate();
            }}
          >
            Mark all read
          </Button>
        </div>
        <ScrollArea className="max-h-80">
          <div className="divide-y divide-border">
            {(notifications ?? []).map((n) => (
              <button
                key={n.id}
                type="button"
                className={cn(
                  "block w-full px-3 py-2 text-left transition-colors hover:bg-muted",
                  !n.read && "bg-primary/5",
                )}
                onClick={async () => {
                  await markRead({ data: { id: n.id } });
                  invalidate();
                  setOpen(false);
                  if (n.link) navigate({ to: n.link });
                }}
              >
                <p className="text-sm font-medium">{n.title}</p>
                {n.body ? (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                ) : null}
              </button>
            ))}
            {notifications?.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                You're all caught up.
              </p>
            ) : null}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell({
  title,
  actions,
  children,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileFn = useServerFn(getMyProfile);
  const { data: profile } = useQuery({ queryKey: ["my-profile"], queryFn: () => profileFn() });

  const signOut = useMutation({
    mutationFn: async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
    },
    onSuccess: () => navigate({ to: "/auth", replace: true }),
  });

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            {typeof title === "string" ? (
              <h1 className="truncate font-display text-base font-semibold">{title}</h1>
            ) : (
              title
            )}
          </div>

          <div className="flex items-center gap-1">
            {actions}
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/15 text-xs text-primary">
                      {initials(profile?.display_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="truncate">
                  {profile?.display_name ?? "Your account"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                  <User className="mr-2 h-4 w-4" />
                  Profile settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut.mutate()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

export { initials };

export function StatusBadge({ children }: { children: ReactNode }) {
  return (
    <Badge variant="secondary" className="font-normal">
      {children}
    </Badge>
  );
}
