import { useRoute } from "@/lib/router";
import { StoreProvider } from "@/state/store";
import { AppShell } from "@/components/layout/sidebar";
import { Toaster } from "@/components/toaster";
import { DashboardView } from "@/views/dashboard-view";
import { LeadsView } from "@/views/leads-view";
import { PipelineView } from "@/views/pipeline-view";
import { ReportsView } from "@/views/reports-view";
import { CommandPalette } from "@/components/command-palette";

export default function App() {
  const route = useRoute();

  return (
    <StoreProvider>
      <AppShell>
        {route.view === "dashboard" ? <DashboardView /> : null}
        {route.view === "leads" ? <LeadsView /> : null}
        {route.view === "pipeline" ? <PipelineView /> : null}
        {route.view === "reports" ? <ReportsView /> : null}
      </AppShell>
      <CommandPalette />
      <Toaster />
    </StoreProvider>
  );
}