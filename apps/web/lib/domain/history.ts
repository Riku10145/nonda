import type { JstDate, LogId } from "./ids";
import { daysInMonth, jstDateOn, weekdayOf, type YearMonth } from "./jst";
import type { Medicine } from "./medicine";
import { TIMINGS, type Timing } from "./timing";

export type { YearMonth };

export type DayFill = "none" | "partial" | "full";

export type CalendarCell =
  | { kind: "outside" }
  | { kind: "day"; date: JstDate; fill: DayFill; isToday: boolean };

export interface MonthMatrix {
  yearMonth: YearMonth;
  weeks: CalendarCell[][];
}

export interface ExpectedSlot {
  name: string;
  timing: Timing;
}

export type LedgerEntry =
  | { kind: "taken"; name: string; timing: Timing; recordedAt: string }
  | { kind: "skipped"; name: string; timing: Timing; recordedAt: string }
  | { kind: "missing"; name: string; timing: Timing };

export interface DayLedger {
  date: JstDate;
  entries: LedgerEntry[];
}

export interface HistoryViewModel {
  month: YearMonth;
  matrix: MonthMatrix;
  selected: DayLedger;
}

export interface DayLog {
  id: LogId;
  name: string;
  timing: Timing;
  taken: boolean;
  recordedAt: string;
}

export interface DayGroup {
  date: JstDate;
  logs: DayLog[];
}

const _slotKey = (name: string, timing: Timing): string => `${name}\0${timing}`;

const _latestByNameTiming = (logs: DayLog[]): Map<string, DayLog> => {
  const sorted = [...logs].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const map = new Map<string, DayLog>();
  for (const log of sorted) {
    map.set(_slotKey(log.name, log.timing), log);
  }
  return map;
};

export const fillForDay = (expected: ExpectedSlot[], logs: DayLog[]): DayFill => {
  if (expected.length === 0) return "none";
  const latest = _latestByNameTiming(logs);
  let takenCount = 0;
  for (const slot of expected) {
    const log = latest.get(_slotKey(slot.name, slot.timing));
    if (log?.taken) takenCount += 1;
  }
  if (takenCount === 0) return "none";
  if (takenCount === expected.length) return "full";
  return "partial";
};

export const expectedSlots = (medicines: Medicine[]): ExpectedSlot[] => {
  const slots: ExpectedSlot[] = [];
  for (const timing of TIMINGS) {
    const names = medicines
      .filter((medicine) => medicine.timings.includes(timing))
      .map((medicine) => medicine.name)
      .sort((a, b) => a.localeCompare(b, "ja"));
    for (const name of names) {
      slots.push({ name, timing });
    }
  }
  return slots;
};

export const buildMonthMatrix = (
  yearMonth: YearMonth,
  fillByDate: Map<JstDate, DayFill>,
  today: JstDate,
): MonthMatrix => {
  const days = daysInMonth(yearMonth);
  const pad = weekdayOf(jstDateOn(yearMonth, 1));
  const cells: CalendarCell[] = [];
  for (let i = 0; i < pad; i++) cells.push({ kind: "outside" });
  for (let day = 1; day <= days; day++) {
    const date = jstDateOn(yearMonth, day);
    cells.push({
      kind: "day",
      date,
      fill: fillByDate.get(date) ?? "none",
      isToday: date === today,
    });
  }
  while (cells.length % 7 !== 0) cells.push({ kind: "outside" });
  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return { yearMonth, weeks };
};

export const fillsForMonth = (
  yearMonth: YearMonth,
  expected: ExpectedSlot[],
  groups: DayGroup[],
): Map<JstDate, DayFill> => {
  const byDate = new Map(groups.map((group) => [group.date, group.logs]));
  const fills = new Map<JstDate, DayFill>();
  const days = daysInMonth(yearMonth);
  for (let day = 1; day <= days; day++) {
    const date = jstDateOn(yearMonth, day);
    fills.set(date, fillForDay(expected, byDate.get(date) ?? []));
  }
  return fills;
};

export const buildDayLedger = (
  date: JstDate,
  expected: ExpectedSlot[],
  group: DayGroup | undefined,
): DayLedger => {
  const latest = _latestByNameTiming(group?.logs ?? []);
  const used = new Set<string>();
  const entries: LedgerEntry[] = [];
  for (const slot of expected) {
    const key = _slotKey(slot.name, slot.timing);
    const log = latest.get(key);
    if (log) {
      used.add(key);
      entries.push(
        log.taken
          ? { kind: "taken", name: slot.name, timing: slot.timing, recordedAt: log.recordedAt }
          : { kind: "skipped", name: slot.name, timing: slot.timing, recordedAt: log.recordedAt },
      );
    } else {
      entries.push({ kind: "missing", name: slot.name, timing: slot.timing });
    }
  }
  const orphans = [...latest.entries()].filter(([key]) => !used.has(key));
  orphans.sort(([a], [b]) => a.localeCompare(b));
  for (const [, log] of orphans) {
    entries.push(
      log.taken
        ? { kind: "taken", name: log.name, timing: log.timing, recordedAt: log.recordedAt }
        : { kind: "skipped", name: log.name, timing: log.timing, recordedAt: log.recordedAt },
    );
  }
  return { date, entries };
};

export const adjacentMonth = (ym: YearMonth, delta: -1 | 1): YearMonth => {
  const monthIndex = ym.year * 12 + (ym.month - 1) + delta;
  const year = Math.floor(monthIndex / 12);
  const month = monthIndex - year * 12 + 1;
  return { year, month };
};

export const formatYearMonth = (ym: YearMonth): string => `${ym.year}年${ym.month}月`;

export const hrefForHistory = (ym: YearMonth, day: JstDate): string => {
  const month = `${ym.year}-${String(ym.month).padStart(2, "0")}`;
  return `/history?month=${month}&day=${day}`;
};

export const dayNumber = (date: JstDate): number => Number(date.slice(8, 10));
