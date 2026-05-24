import { Button, Card, Center, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";

import { auth } from "@/auth";

import { Shell } from "./_shell";

export default async function Home() {
  const session = await auth();

  if (session?.user?.id) {
    return (
      <Shell>
        <Title order={1}>Nonda</Title>
      </Shell>
    );
  }

  return (
    <Center mih="100dvh" p="md">
      <Card shadow="sm" padding="lg" radius="md" withBorder w="100%" maw={360}>
        <Stack gap="md">
          <Stack gap={4}>
            <Title order={2}>Nonda</Title>
            <Text c="dimmed" size="sm">
              薬の飲み忘れを防ぐ服用記録アプリ
            </Text>
          </Stack>
          <Button component={Link} href="/login" fullWidth>
            始める
          </Button>
        </Stack>
      </Card>
    </Center>
  );
}
