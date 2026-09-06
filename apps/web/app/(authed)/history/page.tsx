import { jstDateOn, jstToday, parseJstDate, parseYearMonth, yearMonthOf } from "@/lib/domain/jst";
import { loadHistoryView } from "@/lib/server/history";
import { HistoryView } from "../_ui/history-view";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const query = await searchParams;
  const today = jstToday();
  const month = parseYearMonth(query.month) ?? yearMonthOf(today);
  const parsedDay = parseJstDate(query.day);
  const selected =
    parsedDay &&
    yearMonthOf(parsedDay).year === month.year &&
    yearMonthOf(parsedDay).month === month.month
      ? parsedDay
      : yearMonthOf(today).year === month.year && yearMonthOf(today).month === month.month
        ? today
        : jstDateOn(month, 1);
  const view = await loadHistoryView(month, selected);
  return <HistoryView view={view} />;
}
