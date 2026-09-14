export type AnalyticsRange = "7d" | "30d" | "90d";

export interface RangeQuery {
  range?: AnalyticsRange;
  start_date?: string;
  end_date?: string;
}

// trend is intentionally never populated yet — a daily bucketed series for
// the sparkline is a separate charting concern from the headline
// value/growth pair, deferred until it's actually needed.
export interface StatMetric {
  value: string;
  growth: string;
  trend?: number[];
}

const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
const DAY_MS = 24 * 60 * 60 * 1000;

export const resolveWindows = (query: RangeQuery) => {
  if (query.start_date && query.end_date) {
    const currentStart = new Date(query.start_date);
    const currentEnd = new Date(query.end_date);
    if (
      !Number.isNaN(currentStart.getTime()) &&
      !Number.isNaN(currentEnd.getTime()) &&
      currentEnd > currentStart
    ) {
      const spanMs = currentEnd.getTime() - currentStart.getTime();
      const previousEnd = currentStart;
      const previousStart = new Date(previousEnd.getTime() - spanMs);
      return { currentStart, currentEnd, previousStart, previousEnd };
    }
  }

  const days =
    query.range && RANGE_DAYS[query.range]
      ? RANGE_DAYS[query.range]
      : RANGE_DAYS["30d"];
  const currentEnd = new Date();
  const currentStart = new Date(currentEnd.getTime() - days * DAY_MS);
  const previousEnd = currentStart;
  const previousStart = new Date(previousEnd.getTime() - days * DAY_MS);
  return { currentStart, currentEnd, previousStart, previousEnd };
};

export const percentChange = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 10000) / 100;
};

export const formatGrowth = (percent: number) => {
  const sign = percent > 0 ? "+" : percent < 0 ? "-" : "";
  return `${sign}${Math.abs(percent)}%`;
};

export const toMetric = (
  value: number,
  current: number,
  previous: number,
): StatMetric => ({
  value: String(value),
  growth: formatGrowth(percentChange(current, previous)),
});
