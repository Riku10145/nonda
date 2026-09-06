"use client";

import { Group, Text, UnstyledButton } from "@mantine/core";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { CalendarIcon, GearIcon, HomeIcon, PillIcon } from "./icons";

const _tabs = [
  { href: "/", label: "ホーム", icon: HomeIcon },
  { href: "/medicines", label: "薬", icon: PillIcon },
  { href: "/history", label: "履歴", icon: CalendarIcon },
  { href: "/settings", label: "設定", icon: GearIcon },
] as const;

const _isActive = (pathname: string, href: string): boolean =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

export function BottomNav() {
  const pathname = usePathname();
  return (
    <Group grow gap={0} h={64} px="xs">
      {_tabs.map((tab) => {
        const active = _isActive(pathname, tab.href);
        const Icon = tab.icon;
        return (
          <UnstyledButton
            key={tab.href}
            component={Link}
            href={tab.href}
            c={active ? "teal.7" : "dimmed"}
            ta="center"
          >
            <Icon />
            <Text size="xs" fw={active ? 700 : 500}>
              {tab.label}
            </Text>
          </UnstyledButton>
        );
      })}
    </Group>
  );
}
