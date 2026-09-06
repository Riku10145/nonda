import "server-only";

import { apiGet } from "@/lib/api-client";
import type { JstDate } from "@/lib/domain/ids";
import {
  buildDayLedger,
  buildMonthMatrix,
  expectedSlots,
  fillsForMonth,
  type HistoryViewModel,
  type YearMonth,
} from "@/lib/domain/history";
import { daysInMonth, jstDateOn, jstToday } from "@/lib/domain/jst";
import { loadMedicines } from "./medicines";
import { _parseDayGroups } from "./_wire";

export const loadHistoryView = async (
  month: YearMonth,
  selected: JstDate,
): Promise<HistoryViewModel> => {
  const from = jstDateOn(month, 1);
  const to = jstDateOn(month, daysInMonth(month));
  const [meds, groups] = await Promise.all([
    loadMedicines(),
    apiGet<unknown>(`/v1/medication-logs?from=${from}&to=${to}`).then(_parseDayGroups),
  ]);
  const expected = expectedSlots(meds);
  const fills = fillsForMonth(month, expected, groups);
  const matrix = buildMonthMatrix(month, fills, jstToday());
  const group = groups.find((item) => item.date === selected);
  return { month, matrix, selected: buildDayLedger(selected, expected, group) };
};
