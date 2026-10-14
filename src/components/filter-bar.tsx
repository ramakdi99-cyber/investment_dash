import React from "react";
import { useUrlFilters } from "@/lib/url-filters";
import { BUDGET_BANDS, GOAL_LABELS, GOAL_ORDER, LEAD_STATUS_META, LEAD_STATUS_ORDER } from "@/lib/domain";
import { useStore } from "@/state/store";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/**
 * The six filter chips shown above the leads table and in the reports view.
 * Each chip is a native `<select>` styled to look like a quiet button: dense,
 * fast to scan, and consistent with the 8px grid.
 */
export function FilterBar({ className }: { className?: string }) {
  const { filters, set, activeCount, clearAll } = useUrlFilters();
  const { state } = useStore();

  const campaignCounts = new Map<string, number>();
  for (const lead of state.leads) {
    if (lead.campaignId) campaignCounts.set(lead.campaignId, (campaignCounts.get(lead.campaignId) ?? 0) + 1);
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-3", className)}>
      <FilterSelect
        label="Status"
        value={filters.status}
        options={LEAD_STATUS_ORDER.map((status) => ({
          value: status,
          label: `${LEAD_STATUS_META[status].label} · ${LEAD_STATUS_META[status].description}`.trim(),
          short: LEAD_STATUS_META[status].label,
          count: state.leads.filter((lead) => lead.status === status).length,
        }))}
        onChange={(value) => set("status", value)}
      />

      <FilterSelect
        label="Campaign"
        value={filters.campaignId}
        options={state.campaigns.map((campaign) => ({
          value: campaign.id,
          label: campaign.name,
          short: campaign.name,
          count: campaignCounts.get(campaign.id) ?? 0,
        }))}
        onChange={(value) => set("campaignId", value)}
      />

      <FilterSelect
        label="Investment goal"
        value={filters.goal}
        options={GOAL_ORDER.map((goal) => ({
          value: goal,
          label: GOAL_LABELS[goal],
          short: GOAL_LABELS[goal],
          count: state.leads.filter((lead) => lead.goal === goal).length,
        }))}
        onChange={(value) => set("goal", value)}
      />

      <FilterSelect
        label="Budget range"
        value={filters.budgetBand}
        options={BUDGET_BANDS.map((band) => ({
          value: band.id,
          label: band.label,
          short: band.short,
          count: state.leads.filter((lead) => lead.budgetBand === band.id).length,
        }))}
        onChange={(value) => set("budgetBand", value)}
      />

      <FilterSelect
        label="Assigned to"
        value={filters.employeeId}
        options={state.employees.map((employee) => ({
          value: employee.id,
          label: employee.name,
          short: employee.name,
          count: state.leads.filter((lead) => lead.assignedEmployeeId === employee.id).length,
        }))}
        onChange={(value) => set("employeeId", value)}
      />

      <div className="flex items-end gap-1.5">
        <DateFilter
          label="From"
          value={filters.from}
          onChange={(value) => set("from", value)}
        />
        <DateFilter
          label="To"
          value={filters.to}
          onChange={(value) => set("to", value)}
        />
      </div>

      {activeCount > 0 ? (
        <button
          type="button"
          onClick={clearAll}
          className="rounded-md px-1.5 py-1 text-[13px] font-medium text-cobalt transition-colors hover:bg-cobalt-soft"
        >
          Clear all ({activeCount})
        </button>
      ) : null}
    </div>
  );
}

interface FilterOption {
  value: string;
  label: string;
  short: string;
  count: number;
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string[];
  options: FilterOption[];
  onChange: (next: string[] | null) => void;
}) {
  const chipId = React.useId();
  const selectedCount = value.length;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = e.target.value;
    if (!raw) return;
    const next = new Set(value);
    if (next.has(raw)) {
      next.delete(raw);
    } else {
      next.add(raw);
    }
    onChange(next.size === 0 ? null : [...next]);
  };

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={chipId} className="text-2xs font-medium text-ink-subtle normal-case tracking-normal">
        {label}
      </Label>
      <select
        id={chipId}
        value=""
        onChange={handleChange}
        onKeyDown={(e) => {
          // let space/open keys cycle without opening the native listbox
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            (e.currentTarget as HTMLSelectElement).showPicker?.();
          }
        }}
        aria-label={`${label} filter`}
        className={cn(
          "h-8 cursor-pointer appearance-none rounded-md border border-ink-line bg-white pl-2.5 pr-7 text-[13px] text-ink transition-colors",
          "hover:bg-ink-wash focus-visible:border-cobalt/40",
          selectedCount > 0 && "border-cobalt/30 bg-cobalt-soft/40 font-medium text-cobalt",
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238A90A0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
        }}
      >
        <option value="" disabled>
          {selectedCount > 0 ? `${selectedCount} selected` : "Any"}
        </option>
        {options.map((option) => {
          const isSelected = value.includes(option.value);
          return (
            <option key={option.value} value={option.value} aria-selected={isSelected}>
              {isSelected ? "✓ " : ""}
              {option.short} ({option.count})
            </option>
          );
        })}
      </select>
    </div>
  );
}

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const chipId = React.useId();
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={chipId} className="text-2xs font-medium text-ink-subtle normal-case tracking-normal">
        {label}
      </Label>
      <input
        id={chipId}
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        aria-label={`${label} date filter`}
        className={cn(
          "h-8 cursor-pointer rounded-md border border-ink-line bg-white px-2 text-[13px] text-ink",
          "hover:bg-ink-wash focus-visible:border-cobalt/40",
          value && "border-cobalt/30 bg-cobalt-soft/40 font-medium text-cobalt",
        )}
      />
    </div>
  );
}