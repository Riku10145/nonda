import { verifySession } from "@/lib/auth-guard";

export default async function Home() {
  await verifySession();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Nonda</h1>
    </div>
  );
}
