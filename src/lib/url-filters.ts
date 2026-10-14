import { useMemo, useCallback } from "react";
import type { BudgetBandId, InvestmentGoal, LeadFilters, LeadStatus } from "@/data/types";
import { useQueryParams } from "@/lib/router";
import { GOAL_ORDER, LEAD_STATUS_META, BUDGET_BANDS } from "@/lib/domain";

/**
 * Single source of truth for the active filter set. The filters live in the
 * URL query string (`?view=leads&status=new,qualified&employee=emp_meera`),
 * so they survive reloads, are shareable, and can be bookmarked.
 */

const ALL_STATUSES = Object.keys(LEAD_STATUS_META) as LeadStatus[];
const ALL_GOALS = GOAL_ORDER;
const ALL_BANDS = BUDGET_BANDS.map((band) => band.id) as BudgetBandId[];

function validList(raw: string[], allowed: readonly string[]): string[] {
  const set = new Set(allowed);
  return raw.filter((item) => set.has(item));
}

export interface UrlFilterApi {
  filters: LeadFilters;
  /** Replace a single filter dimension (arrays replace wholesale, not append). */
  set: (key: keyof LeadFilters, value: string[] | string | null) => void;
  /** Patch several dimensions at once. */
  patch: (patch: Partial<LeadFilters>) => void;
  clearAll: () => void;
  hasActive: boolean;
  activeCount: number;
}

export function useUrlFilters(): UrlFilterApi {
  const { readList, read, write } = useQueryParams();

  const filters = useMemo<LeadFilters>(
    () => ({
      status: validList(readList("status"), ALL_STATUSES) as LeadStatus[],
      campaignId: readList("campaign"),
      goal: validList(readList("goal"), ALL_GOALS) as InvestmentGoal[],
      budgetBand: validList(readList("budget"), ALL_BANDS) as BudgetBandId[],
      employeeId: readList("employee"),
      from: read("from"),
      to: read("to"),
      q: read("q") ?? "",
    }),
    // readList/read are recreated on every route change, so this re-syncs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readList, read],
  );

  const set = useCallback(
    (key: keyof LeadFilters, value: string[] | string | null) => {
      const patch: Record<string, string | string[] | null> = {};
      switch (key) {
        case "status":
          patch.status = value as string[] | null;
          break;
        case "campaignId":
          patch.campaign = value as string[] | null;
          break;
        case "goal":
          patch.goal = value as string[] | null;
          break;
        case "budgetBand":
          patch.budget = value as string[] | null;
          break;
        case "employeeId":
          patch.employee = value as string[] | null;
          break;
        case "from":
          patch.from = (value as string | null) ?? null;
          break;
        case "to":
          patch.to = (value as string | null) ?? null;
          break;
        case "q":
          patch.q = (value as string) || null;
          break;
      }
      write(patch);
    },
    [write],
  );

  const patch = useCallback(
    (next: Partial<LeadFilters>) => {
      const patchRecord: Record<string, string | string[] | null> = {};
      if (next.status !== undefined) patchRecord.status = next.status;
      if (next.campaignId !== undefined) patchRecord.campaign = next.campaignId;
      if (next.goal !== undefined) patchRecord.goal = next.goal;
      if (next.budgetBand !== undefined) patchRecord.budget = next.budgetBand;
      if (next.employeeId !== undefined) patchRecord.employee = next.employeeId;
      if (next.from !== undefined) patchRecord.from = next.from;
      if (next.to !== undefined) patchRecord.to = next.to;
      if (next.q !== undefined) patchRecord.q = next.q || null;
      write(patchRecord);
    },
    [write],
  );

  const clearAll = useCallback(() => {
    write({
      status: null,
      campaign: null,
      goal: null,
      budget: null,
      employee: null,
      from: null,
      to: null,
      q: null,
    });
  }, [write]);

  const activeCount =
    filters.status.length +
    filters.campaignId.length +
    filters.goal.length +
    filters.budgetBand.length +
    filters.employeeId.length +
    (filters.from ? 1 : 0) +
    (filters.to ? 1 : 0) +
    (filters.q ? 1 : 0);

  return { filters, set, patch, clearAll, hasActive: activeCount > 0, activeCount };
}