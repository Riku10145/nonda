import { Avatar, Badge, Group, Stack, Text, UnstyledButton } from "@mantine/core";
import Link from "next/link";

import { initialGlyph, type Medicine } from "@/lib/domain/medicine";
import { TIMINGS, timingLabel } from "@/lib/domain/timing";
import { ChevronIcon } from "./icons";

export function MedicineList({ medicines }: { medicines: Medicine[] }) {
  if (medicines.length === 0) {
    return (
      <Stack gap="sm" align="center" py="xl">
        <Text c="dimmed">まだ薬が登録されていません</Text>
        <Text component={Link} href="/medicines/new" c="teal.7" fw={600} td="underline">
          薬を登録する
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="xs">
      {medicines.map((medicine) => (
        <UnstyledButton
          key={medicine.id}
          component={Link}
          href={`/medicines/${medicine.id}`}
          w="100%"
        >
          <Group
            justify="space-between"
            wrap="nowrap"
            p="sm"
            style={{
              border: "1px solid var(--mantine-color-default-border)",
              borderRadius: "var(--mantine-radius-md)",
            }}
          >
            <Group wrap="nowrap" gap="sm">
              <Avatar color="teal" radius="xl">
                {initialGlyph(medicine.name)}
              </Avatar>
              <Stack gap={4}>
                <Text fw={600}>{medicine.name}</Text>
                <Group gap={4}>
                  {TIMINGS.filter((timing) => medicine.timings.includes(timing)).map((timing) => (
                    <Badge key={timing} variant="light" color="teal">
                      {timingLabel(timing)}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            </Group>
            <ChevronIcon />
          </Group>
        </UnstyledButton>
      ))}
    </Stack>
  );
}
