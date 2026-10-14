import { useMemo } from "react";
import { ArrowUpRight, CalendarClock, CircleDollarSign, Inbox, Target, TrendingUp } from "lucide-react";
import { useStore } from "@/state/store";
import { PageHeader } from "@/components/page-header";
import { MetricCard, MetricCardGrid, MetricCardSkeletons } from "@/components/dashboard/metric-card";
import { ActivityList, ActivityListSkeleton } from "@/components/dashboard/activity-list";
import { TrendChart, type TrendPoint } from "@/components/dashboard/trend-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LEAD_STATUS_META, LEAD_STATUS_ORDER } from "@/lib/domain";
import { formatCurrencyCompact, formatNumber, formatRelative, isSameDay, pluralize, startOfDay, addDays } from "@/lib/format";
import { cn } from "@/lib/utils";
import { navigate } from "@/lib/router";
import { filterCounts } from "@/lib/filters";

export function DashboardView() {
  const { state } = useStore();
  const loading = state.loadState === "loading";

  const metrics = useMemo(() => computeMetrics(state), [state]);

  const chartData = useMemo<TrendPoint[]>(() => {
    const days: TrendPoint[] = [];
    const today = startOfDay(new Date());
    for (let i = 13; i >= 0; i -= 1) {
      const date = addDays(today, -i);
      let received = 0;
      let converted = 0;
      for (const lead of state.leads) {
        const created = new Date(lead.createdAt);
        if (!isSameDay(created, date)) continue;
        received += 1;
        if (lead.status === "converted" || lead.status === "not-interested") {
          // not-interested is not a conversion; only converted counts here
          converted += lead.status === "converted" ? 1 : 0;
        }
      }
      if (received > 0 || i === 13 || i === 0) {
        days.push({ date, received, converted });
      }
    }
    return days;
  }, [state.leads]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
        title="Overview"
        description={
          <>
            {formatNumber(state.leads.length)} leads in the pipeline ·{" "}
            {pluralize(metrics.followUpsPending, "follow-up pending")} ·{" "}
            {formatRelative(state.activity[0]?.at)}
          </>
        }
        actions={
          <Button variant="outline" onClick={() => navigate("leads", {})}>
            View leads
            <ArrowUpRight className="text-ink-muted" />
          </Button>
        }
      />

      {loading ? <MetricCardSkeletons /> : <MetricGrid metrics={metrics} />}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {loading ? (
          <Skeleton className="h-[320px] rounded-xl" />
        ) : (
          <Card className="xl:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Leads received, last 14 days</CardTitle>
                <CardDescription>
                  Daily inbound volume with conversions overlaid.
                </CardDescription>
              </div>
              <Badge variant="outline" className="mt-1">
                {formatNumber(metrics.totalLeads)} total
              </Badge>
            </CardHeader>
            <CardContent className="pt-2">
              <TrendChart data={chartData} />
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Skeleton className="h-[320px] rounded-xl" />
        ) : (
          <StageBreakdown metrics={metrics} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {loading ? (
          <Skeleton className="h-[300px] rounded-xl" />
        ) : (
          <Card className="xl:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>
                  Every status change, note, reply and task, newest first.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("leads", { sort: "lastContact" })}>
                Open leads
                <ArrowUpRight />
              </Button>
            </CardHeader>
            {loading ? <ActivityListSkeleton /> : <ActivityList limit={7} />}
          </Card>
        )}

        {loading ? (
          <Skeleton className="h-[300px] rounded-xl" />
        ) : (
          <CampaignPerformance />
        )}
      </div>
    </div>
  );
}

interface Metrics {
  totalLeads: number;
  newToday: number;
  newYesterday: number;
  qualified: number;
  followUpsPending: number;
  followUpsOverdue: number;
  converted: number;
  statedInterestSum: number;
  statedInterestCount: number;
  conversionRate: number;
}

function computeMetrics(state: ReturnType<typeof useStore>["state"]): Metrics {
  const today = startOfDay(new Date());
  const yesterday = startOfDay(addDays(today, -1));

  let newToday = 0;
  let newYesterday = 0;
  let qualified = 0;
  let converted = 0;
  let statedInterestSum = 0;
  let statedInterestCount = 0;

  for (const lead of state.leads) {
    const created = new Date(lead.createdAt);
    if (lead.status === "new") {
      if (isSameDay(created, today)) newToday += 1;
      if (isSameDay(created, yesterday)) newYesterday += 1;
    }
    if (lead.status === "qualified") qualified += 1;
    if (lead.status === "converted") converted += 1;
    if (lead.statedMonthlyInterest !== null) {
      statedInterestSum += lead.statedMonthlyInterest;
      statedInterestCount += 1;
    }
  }

  const followUps = state.followUps.filter((item) => !item.completedAt);
  const now = Date.now();

  return {
    totalLeads: state.leads.length,
    newToday,
    newYesterday,
    qualified,
    followUpsPending: followUps.length,
    followUpsOverdue: followUps.filter((item) => new Date(item.dueAt).getTime() < now).length,
    converted,
    statedInterestSum,
    statedInterestCount,
    conversionRate: state.leads.length === 0 ? 0 : Math.round((converted / state.leads.length) * 100),
  };
}

function MetricGrid({ metrics }: { metrics: Metrics }) {
  const label = (count: number) => (count >= 1_00_000 ? formatCurrencyCompact(count) : formatNumber(count));
  const hasStatedInterest = metrics.statedInterestCount > 0;

  return (
    <MetricCardGrid>
      <MetricCard
        label="Total leads received"
        value={formatNumber(metrics.totalLeads)}
        sub={`${label(metrics.totalLeads)} this month`}
        accent
        icon={<Inbox className="size-3.5" />}
        delay={0}
      />
      <MetricCard
        label="New leads today"
        value={formatNumber(metrics.newToday)}
        sub={
          metrics.newToday > metrics.newYesterday
            ? `${metrics.newToday - metrics.newYesterday} more than yesterday`
            : `${metrics.newYesterday - metrics.newToday} vs yesterday`
        }
        icon={<TrendingUp className="size-3.5" />}
        delay={40}
      />
      <MetricCard
        label="Qualified leads"
        value={formatNumber(metrics.qualified)}
        sub={`${metrics.conversionRate}% conversion rate`}
        icon={<Target className="size-3.5" />}
        delay={80}
      />
      <MetricCard
        label="Follow-ups pending"
        value={formatNumber(metrics.followUpsPending)}
        sub={
          metrics.followUpsOverdue > 0
            ? `${metrics.followUpsOverdue} overdue right now`
            : "Nothing overdue"
        }
        icon={<CalendarClock className="size-3.5" />}
        delay={120}
      />
      <MetricCard
        label="Converted"
        value={formatNumber(metrics.converted)}
        sub={`${metrics.conversionRate}% of all leads`}
        icon={<ArrowUpRight className="size-3.5" />}
        delay={160}
      />
      <MetricCard
        label="Stated monthly interest"
        value={hasStatedInterest ? formatCurrencyCompact(metrics.statedInterestSum) : "—"}
        sub={
          hasStatedInterest
            ? `Across ${pluralize(metrics.statedInterestCount, "lead")} that shared a budget`
            : "No budget captured yet"
        }
        icon={<CircleDollarSign className="size-3.5" />}
        delay={200}
      />
    </MetricCardGrid>
  );
}

function StageBreakdown({ metrics }: { metrics: Metrics }) {
  const { state } = useStore();
  const counts = filterCounts(state.leads);
  const total = state.leads.length || 1;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>Leads by stage</CardTitle>
          <CardDescription>Where the pipeline is right now.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end space-y-3.5">
        {LEAD_STATUS_ORDER.map((status) => {
          const meta = LEAD_STATUS_META[status];
          const count = counts[status];
          const pct = Math.round((count / total) * 100);
          const isFocus = status === "new" || status === "qualified";
          return (
            <div key={status} className="group">
              <div className="flex items-baseline justify-between gap-2">
                <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                  <span className="size-2 rounded-full" style={{ backgroundColor: meta.dot }} aria-hidden="true" />
                  {meta.label}
                </span>
                <span className="tabular text-[13px] font-semibold text-ink">
                  {count}
                  <span className="ml-1.5 text-2xs font-normal text-ink-subtle">{pct}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-line/60" role="progressbar" aria-valuenow={count} aria-valuemin={0} aria-valuemax={total} aria-label={`${meta.label}: ${count} leads`}>
                <div
                  className={cn("h-full rounded-full transition-all duration-500", isFocus ? "bg-cobalt" : "bg-ink-line")}
                  style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
        <div className="!mt-5 flex items-center justify-between rounded-lg bg-ink-wash px-3 py-2.5">
          <span className="text-[13px] text-ink-muted">Follow-ups pending</span>
          <span className="tabular text-[13px] font-semibold text-ink">{metrics.followUpsPending}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignPerformance() {
  const { state } = useStore();

  const rows = useMemo(() => {
    return state.campaigns
      .map((campaign) => {
        const leads = state.leads.filter((lead) => lead.campaignId === campaign.id);
        const converted = leads.filter((lead) => lead.status === "converted").length;
        return {
          campaign,
          leads: leads.length,
          converted,
          rate: leads.length === 0 ? 0 : Math.round((converted / leads.length) * 100),
          costPerLead: leads.length === 0 ? 0 : Math.round(campaign.spend / leads.length),
        };
      })
      .sort((a, b) => b.leads - a.leads);
  }, [state.campaigns, state.leads]);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Campaign performance</CardTitle>
          <CardDescription>Cost per lead across active sources.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row) => (
          <div key={row.campaign.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-ink">{row.campaign.name}</p>
              <p className="text-2xs text-ink-subtle">{row.leads} leads · {row.converted} converted</p>
            </div>
            <div className="text-right">
              <p className="tabular text-[13px] font-semibold text-ink">{row.campaign.spend === 0 ? "—" : `₹${Math.round(row.costPerLead).toLocaleString("en-IN")}/lead`}</p>
              <p className="tabular text-2xs text-ink-subtle">{row.rate}% conv.</p>
            </div>
            <div className="col-span-2 h-1 overflow-hidden rounded-full bg-ink-line/60">
              <div
                className="h-full rounded-full bg-ink/70"
                style={{ width: `${Math.max(row.leads * 6, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}