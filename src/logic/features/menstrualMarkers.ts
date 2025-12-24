import { PeriodRecord } from "../../types/period";

export type MenstrualMarker = {
  isStart: boolean;
  isPeriod: boolean;
  isNextPredicted: boolean;
};

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;

function toDate(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(base.getDate() + days);
  return next;
}

function format(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function loadPeriodRecords(): PeriodRecord[] {
  const raw = localStorage.getItem("haru_periods");
  if (!raw) return [];

  try {
    const list = JSON.parse(raw) as PeriodRecord[];
    return Array.isArray(list) ? list.filter((p) => Boolean(p?.start)) : [];
  } catch {
    return [];
  }
}

export function buildMenstrualMarkerMap(
  periods: PeriodRecord[],
  cycleLength = DEFAULT_CYCLE_LENGTH,
  periodLength = DEFAULT_PERIOD_LENGTH
): Record<string, MenstrualMarker> {
  const sorted = [...periods].sort((a, b) => (a.start > b.start ? 1 : -1));
  const markers: Record<string, MenstrualMarker> = {};

  sorted.forEach((record) => {
    const startDate = toDate(record.start);
    if (!startDate) return;

    for (let offset = 0; offset < periodLength; offset++) {
      const current = addDays(startDate, offset);
      const key = format(current);
      const existing = markers[key] ?? {
        isStart: false,
        isPeriod: false,
        isNextPredicted: false,
      };

      markers[key] = {
        ...existing,
        isStart: existing.isStart || offset === 0,
        isPeriod: true,
      };
    }
  });

  const latest = sorted[sorted.length - 1];
  const latestStartDate = latest ? toDate(latest.start) : null;

  if (latestStartDate) {
    const predicted = addDays(latestStartDate, cycleLength);
    const predictedKey = format(predicted);
    const existing = markers[predictedKey] ?? {
      isStart: false,
      isPeriod: false,
      isNextPredicted: false,
    };
    markers[predictedKey] = { ...existing, isNextPredicted: true };
  }

  return markers;
}

export function loadMenstrualMarkers(
  cycleLength = DEFAULT_CYCLE_LENGTH,
  periodLength = DEFAULT_PERIOD_LENGTH
): Record<string, MenstrualMarker> {
  const periods = loadPeriodRecords();
  return buildMenstrualMarkerMap(periods, cycleLength, periodLength);
}