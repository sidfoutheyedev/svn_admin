import { resolveWindows, percentChange, formatGrowth, toMetric } from '../../packages/utils';

describe('resolveWindows', () => {
  it('defaults to a 30-day window when no range or dates are given', () => {
    const { currentStart, currentEnd, previousStart, previousEnd } = resolveWindows({});
    const spanMs = currentEnd.getTime() - currentStart.getTime();
    expect(Math.round(spanMs / (24 * 60 * 60 * 1000))).toBe(30);
    expect(previousEnd.getTime()).toBe(currentStart.getTime());
    expect(currentStart.getTime() - previousStart.getTime()).toBe(spanMs);
  });

  it('uses a 7-day window for range=7d', () => {
    const { currentStart, currentEnd } = resolveWindows({ range: '7d' });
    const days = Math.round((currentEnd.getTime() - currentStart.getTime()) / (24 * 60 * 60 * 1000));
    expect(days).toBe(7);
  });

  it('uses a 90-day window for range=90d', () => {
    const { currentStart, currentEnd } = resolveWindows({ range: '90d' });
    const days = Math.round((currentEnd.getTime() - currentStart.getTime()) / (24 * 60 * 60 * 1000));
    expect(days).toBe(90);
  });

  it('derives the previous window from an explicit start_date/end_date span', () => {
    const { currentStart, currentEnd, previousStart, previousEnd } = resolveWindows({
      start_date: '2026-01-08',
      end_date: '2026-01-15',
    });
    expect(currentStart.toISOString()).toBe(new Date('2026-01-08').toISOString());
    expect(currentEnd.toISOString()).toBe(new Date('2026-01-15').toISOString());
    expect(previousEnd.getTime()).toBe(currentStart.getTime());
    expect(currentEnd.getTime() - currentStart.getTime()).toBe(previousStart.getTime() === previousEnd.getTime() ? 0 : currentEnd.getTime() - currentStart.getTime());
    expect(previousEnd.getTime() - previousStart.getTime()).toBe(currentEnd.getTime() - currentStart.getTime());
  });

  it('falls back to the default range when end_date is not after start_date', () => {
    const { currentStart, currentEnd } = resolveWindows({ start_date: '2026-01-15', end_date: '2026-01-08' });
    const days = Math.round((currentEnd.getTime() - currentStart.getTime()) / (24 * 60 * 60 * 1000));
    expect(days).toBe(30);
  });

  it('falls back to the default range when the dates are invalid', () => {
    const { currentStart, currentEnd } = resolveWindows({ start_date: 'not-a-date', end_date: 'also-not-a-date' });
    const days = Math.round((currentEnd.getTime() - currentStart.getTime()) / (24 * 60 * 60 * 1000));
    expect(days).toBe(30);
  });
});

describe('percentChange', () => {
  it('computes a positive percentage increase', () => {
    expect(percentChange(150, 100)).toBe(50);
  });

  it('computes a negative percentage decrease', () => {
    expect(percentChange(50, 100)).toBe(-50);
  });

  it('returns 0 when previous and current are both 0', () => {
    expect(percentChange(0, 0)).toBe(0);
  });

  it('returns 100 when previous is 0 and current is nonzero', () => {
    expect(percentChange(10, 0)).toBe(100);
  });
});

describe('formatGrowth', () => {
  it('prefixes a positive percent with +', () => {
    expect(formatGrowth(12.4)).toBe('+12.4%');
  });

  it('prefixes a negative percent with -', () => {
    expect(formatGrowth(-12.4)).toBe('-12.4%');
  });

  it('has no sign for zero', () => {
    expect(formatGrowth(0)).toBe('0%');
  });
});

describe('toMetric', () => {
  it('stringifies the value and computes growth from current/previous', () => {
    expect(toMetric(48920, 48920, 43500)).toEqual({
      value: '48920',
      growth: `+${percentChange(48920, 43500)}%`,
    });
  });
});
