import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LayoutGrid, Inbox, Kanban, BarChart3, Briefcase, HelpCircle, ChevronsUpDown, Menu } from "lucide-react";
import { navigate, useRoute, type ViewId } from "@/lib/router";
import { useStore } from "@/state/store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { ROLE_LABELS } from "@/lib/domain";
import { initialsOf } from "@/lib/utils";
import { TopBar } from "@/components/layout/topbar";
import { ConnectionBanner } from "@/components/connection-banner";

const NAV_SECTIONS: { title: string; items: { view: ViewId; label: string; icon: React.ComponentType<{ className?: string }>; hint?: string }[] }[] = [
  {
    title: "Workspace",
    items: [
      { view: "dashboard", label: "Overview", icon: LayoutGrid },
      { view: "leads", label: "Leads", icon: Inbox },
      { view: "pipeline", label: "Pipeline", icon: Kanban },
      { view: "reports", label: "Search & reports", icon: BarChart3 },
    ],
  },
];

export function Sidebar({ className }: { className?: string }) {
  const route = useRoute();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "flex h-full flex-col border-r border-ink-line bg-white",
        className,
      )}
    >
      <Brand />

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="label-caps px-2 pb-1.5">{section.title}</p>
            {section.items.map((item) => {
              const active = route.view === item.view;
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => navigate(item.view, {}, { replace: false })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-cobalt-soft text-cobalt"
                      : "text-ink-muted hover:bg-ink-wash hover:text-ink",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full transition-opacity",
                      active ? "bg-cobalt opacity-100" : "opacity-0",
                    )}
                  />
                  <item.icon className={cn("size-4", active ? "text-cobalt" : "text-ink-subtle group-hover:text-ink")} />
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}

        <div className="mt-6 space-y-1">
          <p className="label-caps px-2 pb-1.5">Help</p>
          <a
            href="#/help"
            onClick={(e) => e.preventDefault()}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:bg-ink-wash hover:text-ink"
          >
            <HelpCircle className="size-4 text-ink-subtle" />
            Documentation
          </a>
        </div>
      </div>

      <SidebarUserCard />
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-4 pb-4 pt-5">
      <div className="flex size-8 items-center justify-center rounded-lg bg-cobalt shadow-sm">
        <Briefcase className="size-4 text-white" aria-hidden="true" />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[15px] font-semibold tracking-tight text-ink">Cobalt</span>
        <span className="rounded border border-ink-line px-1 py-px text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
          CRM
        </span>
      </div>
    </div>
  );
}

function SidebarUserCard() {
  const { state } = useStore();
  const user = state.users[state.role];

  return (
    <div className="border-t border-ink-line p-3">
      <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
        <Avatar className="size-8">
          <AvatarFallback>{initialsOf(user.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium leading-4 text-ink">{user.name}</p>
          <p className="truncate text-2xs leading-4 text-ink-subtle">{ROLE_LABELS[user.role]}</p>
        </div>
        <ChevronsUpDown className="size-3.5 text-ink-subtle" aria-hidden="true" />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const route = useRoute();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [route.view]);

  return (
    <div className="min-h-screen bg-white text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-cobalt focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <div className="lg:pl-60">
        <TopBar />
        <MobileTopBar onMenu={() => setMobileNavOpen(true)} />
        <ConnectionBanner />
        <main id="main" className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function MobileTopBar({ onMenu }: { onMenu: () => void }) {
  return (
    <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-ink-line bg-white/90 px-4 backdrop-blur lg:hidden">
      <Button variant="ghost" size="icon" onClick={onMenu} aria-label="Open navigation">
        <Menu className="size-5" />
      </Button>
      <div className="flex items-center gap-2.5">
        <div className="flex size-7 items-center justify-center rounded-md bg-cobalt">
          <Briefcase className="size-3.5 text-white" aria-hidden="true" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-ink">Cobalt</span>
      </div>
      <div className="w-9" />
    </div>
  );
}