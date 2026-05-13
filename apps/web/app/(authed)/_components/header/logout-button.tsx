"use client";

import { Button } from "@heroui/react";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <Button size="sm" variant="tertiary" onPress={() => signOut({ redirectTo: "/login" })}>
      ログアウト
    </Button>
  );
}
