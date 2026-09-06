"use client";

import { Avatar, Button, Group, Stack, Switch, Text, Title } from "@mantine/core";
import { signOut } from "next-auth/react";
import { useState, useTransition } from "react";

import { TIMINGS, timingLabel } from "@/lib/domain/timing";
import { isNotifyOn, type Account, type NotifyTriplet } from "@/lib/domain/notify";
import { saveNotifyTriplet } from "../actions";

export function SettingsView({ triplet, account }: { triplet: NotifyTriplet; account: Account }) {
  const [master, setMaster] = useState(isNotifyOn(triplet));
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Stack gap="xl">
      <form
        action={(formData) => {
          setMessage(null);
          start(async () => {
            const result = await saveNotifyTriplet(formData);
            if (result.kind === "failed") setMessage(result.message);
          });
        }}
      >
        <Stack gap="md">
          <Title order={4}>通知</Title>
          <input type="hidden" name="master" value={master ? "on" : "off"} />
          <Switch
            label="通知"
            checked={master}
            onChange={(event) => setMaster(event.currentTarget.checked)}
          />
          {TIMINGS.map((timing) => (
            <label key={timing}>
              <Text size="sm" mb={4}>
                {timingLabel(timing)}
              </Text>
              <input type="time" name={timing} defaultValue={triplet[timing].time} required />
            </label>
          ))}
          {message && (
            <Text c="red" size="sm">
              {message}
            </Text>
          )}
          <Button type="submit" loading={pending}>
            保存
          </Button>
        </Stack>
      </form>
      <Stack gap="md">
        <Title order={4}>アカウント</Title>
        <Group>
          <Avatar src={account.image ?? undefined} alt="" radius="xl" size="lg" />
          <Stack gap={2}>
            <Text fw={600}>{account.name}</Text>
            <Text size="sm" c="dimmed">
              {account.email}
            </Text>
          </Stack>
        </Group>
        <Button variant="default" type="button" onClick={() => signOut({ redirectTo: "/login" })}>
          ログアウト
        </Button>
      </Stack>
    </Stack>
  );
}
