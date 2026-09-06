import type { JstDate } from "./ids";

const _JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const _DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const _YEAR_MONTH_RE = /^(\d{4})-(\d{2})$/;
const _WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export interface YearMonth {
  year: number;
  month: number;
}

export const parseJstDate = (raw: string | undefined): JstDate | null => {
  if (!raw) return null;
  const match = _DATE_RE.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return null;
  }
  return raw as JstDate;
};

export const jstToday = (now: Date = new Date()): JstDate => {
  const jst = new Date(now.getTime() + _JST_OFFSET_MS);
  return jst.toISOString().slice(0, 10) as JstDate;
};

export const yearMonthOf = (date: JstDate): YearMonth => ({
  year: Number(date.slice(0, 4)),
  month: Number(date.slice(5, 7)),
});

export const parseYearMonth = (raw: string | undefined): YearMonth | null => {
  if (!raw) return null;
  const match = _YEAR_MONTH_RE.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
};

export const jstDateOn = (ym: YearMonth, day: number): JstDate => {
  const mm = String(ym.month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${ym.year}-${mm}-${dd}` as JstDate;
};

export const daysInMonth = (ym: YearMonth): number =>
  new Date(Date.UTC(ym.year, ym.month, 0)).getUTCDate();

export const formatJstHeading = (date: JstDate): string => {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${year}年${month}月${day}日（${_WEEKDAYS[weekday]}）`;
};

export const toIsoNow = (now: Date = new Date()): string => now.toISOString();

export const formatClock = (iso: string): string => {
  const jst = new Date(new Date(iso).getTime() + _JST_OFFSET_MS);
  return jst.toISOString().slice(11, 16);
};

export const weekdayOf = (date: JstDate): number => {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
};
