import { Anchor, Group, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";

import {
  adjacentMonth,
  dayNumber,
  formatYearMonth,
  hrefForHistory,
  type HistoryViewModel,
} from "@/lib/domain/history";
import { daysInMonth, formatClock, jstDateOn } from "@/lib/domain/jst";
import { timingLabel } from "@/lib/domain/timing";

const _WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

const _pagedDay = (view: HistoryViewModel, delta: -1 | 1) => {
  const next = adjacentMonth(view.month, delta);
  const day = Math.min(dayNumber(view.selected.date), daysInMonth(next));
  return { month: next, day: jstDateOn(next, day) };
};

export function HistoryView({ view }: { view: HistoryViewModel }) {
  const prev = _pagedDay(view, -1);
  const next = _pagedDay(view, 1);
  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Anchor component={Link} href={hrefForHistory(prev.month, prev.day)}>
          ←
        </Anchor>
        <Title order={3}>{formatYearMonth(view.month)}</Title>
        <Anchor component={Link} href={hrefForHistory(next.month, next.day)}>
          →
        </Anchor>
      </Group>
      <div className="nonda-cal" role="grid">
        {_WEEKDAYS.map((label) => (
          <Text key={label} size="xs" c="dimmed" ta="center">
            {label}
          </Text>
        ))}
        {view.matrix.weeks.flatMap((week, i) =>
          week.map((cell, j) =>
            cell.kind === "outside" ? (
              <span key={`${i}-${j}`} />
            ) : (
              <Link
                key={cell.date}
                href={hrefForHistory(view.month, cell.date)}
                className="nonda-cal-cell"
                data-fill={cell.fill}
                data-today={cell.isToday ? "true" : undefined}
                aria-current={cell.date === view.selected.date ? "date" : undefined}
              >
                {dayNumber(cell.date)}
              </Link>
            ),
          ),
        )}
      </div>
      <Stack gap="xs">
        {view.selected.entries.length === 0 ? (
          <Text c="dimmed">この日の予定はありません</Text>
        ) : (
          view.selected.entries.map((entry, index) => (
            <Group key={`${entry.name}-${entry.timing}-${index}`} justify="space-between">
              <Text>
                {entry.name} {timingLabel(entry.timing)}
              </Text>
              <Text c={entry.kind === "taken" ? undefined : "dimmed"}>
                {entry.kind === "taken" ? formatClock(entry.recordedAt) : "未服用"}
              </Text>
            </Group>
          ))
        )}
      </Stack>
    </Stack>
  );
}
