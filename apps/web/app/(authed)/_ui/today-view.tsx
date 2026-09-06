"use client";

import { Avatar, Button, Card, Checkbox, Group, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";

import { formatJstHeading } from "@/lib/domain/jst";
import { initialGlyph } from "@/lib/domain/medicine";
import { TIMINGS, timingLabel } from "@/lib/domain/timing";
import {
  applyBoardPatch,
  isAllTaken,
  isTaken,
  laneSummaries,
  type DoseSlot,
  type TodayBoard,
} from "@/lib/domain/today";
import { markAllTaken, setDoseTaken } from "../actions";

export function TodayView({ board }: { board: TodayBoard }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [view, patchBoard] = useOptimistic(board, applyBoardPatch);
  const empty = TIMINGS.every((timing) => view.lanes[timing].slots.length === 0);
  const summaries = laneSummaries(view);

  return (
    <Stack gap="lg">
      <Title order={2}>{formatJstHeading(view.date)}</Title>
      <Group grow>
        {summaries.map((summary) => (
          <Stack key={summary.timing} gap={2} ta="center">
            <Text size="sm" c="dimmed">
              {timingLabel(summary.timing)}
            </Text>
            <Text fw={700}>
              {summary.taken}/{summary.due}
            </Text>
          </Stack>
        ))}
      </Group>
      {message && (
        <Text c="red" size="sm">
          {message}
        </Text>
      )}
      {empty ? (
        <Stack gap="sm">
          <Text c="dimmed">まだ薬が登録されていません</Text>
          <Button component={Link} href="/medicines/new">
            薬を登録する
          </Button>
        </Stack>
      ) : (
        TIMINGS.map((timing) => {
          const lane = view.lanes[timing];
          if (lane.slots.length === 0) return null;
          return (
            <Stack key={timing} gap="xs">
              <Text fw={700}>{timingLabel(timing)}</Text>
              {lane.slots.map((slot) => (
                <DoseCard
                  key={`${slot.medicineId}:${slot.timing}`}
                  slot={slot}
                  disabled={pending}
                  onTaken={(taken) => {
                    setMessage(null);
                    start(async () => {
                      patchBoard({
                        type: "dose",
                        medicineId: slot.medicineId,
                        timing: slot.timing,
                        taken,
                      });
                      const result = await setDoseTaken(slot.medicineId, slot.timing, taken);
                      if (result.kind === "failed") setMessage(result.message);
                    });
                  }}
                />
              ))}
            </Stack>
          );
        })
      )}
      <Button
        fullWidth
        size="md"
        disabled={pending || empty || isAllTaken(view)}
        onClick={() => {
          setMessage(null);
          start(async () => {
            patchBoard({ type: "all" });
            const result = await markAllTaken();
            if (result.kind === "failed") setMessage(result.message);
          });
        }}
      >
        全部飲んだ
      </Button>
      <Text ta="center">
        <Text component={Link} href="/history" c="teal.7" fw={600} td="underline">
          履歴を見る
        </Text>
      </Text>
    </Stack>
  );
}

function DoseCard({
  slot,
  disabled,
  onTaken,
}: {
  slot: DoseSlot;
  disabled: boolean;
  onTaken: (taken: boolean) => void;
}) {
  return (
    <Card withBorder padding="sm" radius="md">
      <Group justify="space-between" wrap="nowrap">
        <Group wrap="nowrap" gap="sm">
          <Avatar color="teal" radius="xl">
            {initialGlyph(slot.name)}
          </Avatar>
          <Text fw={600}>{slot.name}</Text>
        </Group>
        <Checkbox
          size="md"
          checked={isTaken(slot)}
          disabled={disabled}
          aria-label={`${slot.name}を飲んだ`}
          onChange={(event) => onTaken(event.currentTarget.checked)}
        />
      </Group>
    </Card>
  );
}
