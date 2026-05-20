import { auth } from "@/auth";
import { Group, Text, Title } from "@mantine/core";

import { LogoutButton } from "./logout-button";

export async function Header() {
  const session = await auth();
  const name = session?.user?.name ?? "";

  return (
    <Group
      component="header"
      justify="space-between"
      align="center"
      px="lg"
      py="sm"
      style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}
    >
      <Title order={1} size="h4">
        nonda
      </Title>
      <Group gap="sm" align="center">
        {name && (
          <Text size="sm" c="gray.7">
            {name}
          </Text>
        )}
        <LogoutButton />
      </Group>
    </Group>
  );
}
