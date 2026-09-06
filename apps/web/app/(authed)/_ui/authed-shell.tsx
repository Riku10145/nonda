"use client";

import { ActionIcon, AppShell, Box, Group, Text } from "@mantine/core";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BottomNav } from "./bottom-nav";
import { PlusIcon } from "./icons";

const _isMedicineForm = (pathname: string): boolean =>
  pathname === "/medicines/new" || /^\/medicines\/[^/]+$/.test(pathname);

const _titleFor = (pathname: string): string => {
  if (pathname === "/") return "ホーム";
  if (pathname.startsWith("/medicines")) return "薬";
  if (pathname.startsWith("/history")) return "履歴";
  if (pathname.startsWith("/settings")) return "設定";
  return "nonda";
};

export function AuthedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = _isMedicineForm(pathname);
  return (
    <AppShell
      header={hideChrome ? undefined : { height: 56 }}
      footer={hideChrome ? undefined : { height: 64 }}
      padding={0}
    >
      {!hideChrome && (
        <AppShell.Header>
          <Box maw={430} mx="auto" h="100%" px="md">
            <Group h="100%" justify="space-between" wrap="nowrap">
              <Text fw={700} size="lg">
                {_titleFor(pathname)}
              </Text>
              {pathname === "/medicines" && (
                <ActionIcon
                  component={Link}
                  href="/medicines/new"
                  variant="subtle"
                  color="teal"
                  size="lg"
                  aria-label="薬を追加"
                >
                  <PlusIcon />
                </ActionIcon>
              )}
            </Group>
          </Box>
        </AppShell.Header>
      )}
      <AppShell.Main>
        <Box maw={430} mx="auto" px="md" py="md">
          {children}
        </Box>
      </AppShell.Main>
      {!hideChrome && (
        <AppShell.Footer>
          <Box maw={430} mx="auto">
            <BottomNav />
          </Box>
        </AppShell.Footer>
      )}
    </AppShell>
  );
}
