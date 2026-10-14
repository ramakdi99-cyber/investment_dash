import { ChevronsUpDown, LogOut, Search, Settings, UserRound } from "lucide-react";
import { useStore } from "@/state/store";
import { navigate } from "@/lib/router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleBadge } from "@/components/status-badge";
import { ROLE_LABELS } from "@/lib/domain";
import { initialsOf } from "@/lib/utils";

/**
 * The top bar: breadcrumb-style view title, a global search affordance and the
 * current user. The user menu hosts the demo role switcher (admin <-> agent) so
 * the export gating can be previewed without leaving the app.
 */
export function TopBar() {
  const { state, dispatch } = useStore();
  const user = state.users[state.role];

  return (
    <div className="sticky top-0 z-20 hidden h-16 items-center justify-between gap-4 border-b border-ink-line bg-white/85 backdrop-blur-md lg:flex">
      <div className="flex items-center gap-3">
        <span className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-subtle">
          {state.role === "admin" ? "Admin workspace" : "Agent workspace"}
        </span>
        <span className="h-4 w-px bg-ink-line" aria-hidden="true" />
        <button
          type="button"
          onClick={() => navigate("leads", {})}
          className="group inline-flex items-center gap-2 rounded-lg border border-ink-line bg-white px-3 py-2 text-[13px] text-ink-muted shadow-card transition-colors hover:border-ink-line hover:text-ink"
          aria-label="Search leads (shortcut: Ctrl K)"
        >
          <Search className="size-4 text-ink-subtle" aria-hidden="true" />
          Search leads, campaigns…
          <kbd
            className="ml-6 rounded border border-ink-line bg-ink-wash px-1.5 py-0.5 font-mono text-[10px] text-ink-subtle"
            aria-hidden="true"
          >
            Ctrl K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2.5">
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings className="size-[18px]" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-ink-wash"
              aria-label="Open user menu"
            >
              <Avatar className="size-8">
                <AvatarFallback>{initialsOf(user.name)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-left xl:block">
                <span className="block text-[13px] font-medium leading-4 text-ink">{user.name}</span>
                <span className="block text-2xs leading-4 text-ink-subtle">
                  {state.role === "admin" ? "Administrator" : "Sales agent"} · {user.email}
                </span>
              </span>
              <ChevronsUpDown className="size-3.5 text-ink-subtle" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <span className="flex items-center justify-between gap-2">
                {user.name}
                <RoleBadge role={state.role} />
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <div className="px-2 py-1.5">
              <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-subtle">
                Demo role
              </p>
              <p className="mt-0.5 text-2xs leading-4 text-ink-muted">
                Export permission changes with the role — {ROLE_LABELS[state.role]}s{" "}
                {state.role === "admin" ? "may export the full dataset." : "cannot export data."}
              </p>
            </div>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-ink transition-colors hover:bg-ink-wash"
              onClick={() =>
                dispatch({ type: "set-role", role: state.role === "admin" ? "agent" : "admin" })
              }
            >
              <UserRound className="size-4 text-ink-muted" aria-hidden="true" />
              Switch to {state.role === "admin" ? ROLE_LABELS.agent : ROLE_LABELS.admin}
            </button>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <Settings className="size-4" />
              Settings
              <span className="ml-auto text-2xs text-ink-subtle">soon</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-700 focus:text-red-700 [&_svg]:text-red-600">
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}