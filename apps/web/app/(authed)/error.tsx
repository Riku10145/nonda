"use client";

import { Button, Stack, Text } from "@mantine/core";

export default function AuthedError({ reset }: { reset: () => void }) {
  return (
    <Stack gap="md" py="xl">
      <Text>読み込みに失敗しました</Text>
      <Button onClick={reset}>再試行</Button>
    </Stack>
  );
}
