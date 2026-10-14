import { useCallback, useEffect, useState } from "react";

/**
 * A ~60 line hash-free router.
 *
 * WHY NOT react-router: the app has four views and needs its filters to be
 * shareable. A single `history.pushState` + `popstate` listener covers that
 * with zero dependencies, and keeps the filter state in the *real* query
 * string (`?view=leads&status=new`) rather than a fragment.
 */

export type ViewId = "dashboard" | "leads" | "pipeline" | "reports";

export const VIEW_IDS: ViewId[] = ["dashboard", "leads", "pipeline", "reports"];

export interface Route {
  view: ViewId;
  params: URLSearchParams;
}

function parse(): Route {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("view");
  const view = (VIEW_IDS as string[]).includes(raw ?? "")
    ? (raw as ViewId)
    : "dashboard";
  return { view, params };
}

/** Current route, re-rendering on back/forward navigation. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse());

  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
  }, []);

  return route;
}

export interface NavOptions {
  /** Replace history instead of pushing — used for high-frequency filter edits. */
  replace?: boolean;
}

/**
 * Navigate to a view, merging the given query params.
 * Passing `null` removes a param. Only non-empty values are serialised, which
 * keeps URLs short and human-readable.
 */
export function navigate(
  view: ViewId,
  params: Record<string, string | string[] | null> = {},
  options: NavOptions = {},
) {
  const next = new URLSearchParams(window.location.search);
  next.set("view", view);

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
      next.delete(key);
      continue;
    }
    if (Array.isArray(value)) {
      next.set(key, value.join(","));
    } else {
      next.set(key, value);
    }
  }

  const query = next.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;

  if (options.replace) {
    window.history.replaceState(null, "", url);
  } else {
    window.history.pushState(null, "", url);
  }

  // pushState/replaceState do not fire `popstate`; notify listeners manually.
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/**
 * Read/write a slice of the query string from a component. Writes replace the
 * history entry so that typing in a filter does not flood the back button.
 */
export function useQueryParams() {
  const route = useRoute();

  const read = useCallback(
    (key: string): string | null => route.params.get(key),
    [route],
  );

  const readList = useCallback(
    (key: string): string[] => {
      const raw = route.params.get(key);
      if (!raw) return [];
      return raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    },
    [route],
  );

  const write = useCallback(
    (patch: Record<string, string | string[] | null>, options: NavOptions = { replace: true }) => {
      navigate(route.view, patch, options);
    },
    [route.view],
  );

  return { view: route.view, params: route.params, read, readList, write };
}
