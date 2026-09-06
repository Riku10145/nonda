import { auth } from "@/auth";
import { loadNotifyTriplet } from "@/lib/server/notify";
import { SettingsView } from "../_ui/settings-view";

export default async function SettingsPage() {
  const [triplet, session] = await Promise.all([loadNotifyTriplet(), auth()]);
  return (
    <SettingsView
      triplet={triplet}
      account={{
        name: session?.user?.name ?? "",
        email: session?.user?.email ?? "",
        image: session?.user?.image ?? null,
      }}
    />
  );
}
