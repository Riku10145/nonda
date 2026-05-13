import { auth } from "@/auth";

import { LogoutButton } from "./logout-button";

export async function Header() {
  const session = await auth();
  const name = session?.user?.name ?? "";

  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
      <h1 className="text-lg font-bold">nonda</h1>
      <div className="flex items-center gap-3">
        {name && <span className="text-sm text-gray-700">{name}</span>}
        <LogoutButton />
      </div>
    </header>
  );
}
