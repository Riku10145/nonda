import { Title } from "@mantine/core";

import { verifySession } from "@/lib/auth-guard";

export default async function Home() {
  await verifySession();

  return <Title order={1}>Nonda</Title>;
}
