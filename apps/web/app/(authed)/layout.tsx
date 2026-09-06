import { verifySession } from "@/lib/auth-guard";
import { AuthedShell } from "./_ui/authed-shell";

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  await verifySession();
  return <AuthedShell>{children}</AuthedShell>;
}
