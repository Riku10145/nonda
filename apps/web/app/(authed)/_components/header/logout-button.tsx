"use client";

import { Button } from "@mantine/core";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <Button size="sm" variant="default" onClick={() => signOut({ redirectTo: "/login" })}>
      ログアウト
    </Button>
  );
}
