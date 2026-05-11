import { auth } from "@/auth";
import { ApiError, apiGet } from "@/lib/api-client";

interface Medicine {
  id: string;
  name: string;
  timings: string[];
}

export default async function Home() {
  const session = await auth();

  let medicines: Medicine[] | null = null;
  let error: string | null = null;

  try {
    medicines = await apiGet<Medicine[]>("/v1/medicines");
  } catch (e) {
    if (e instanceof ApiError) {
      error = `${e.code}: ${e.message}`;
    } else if (e instanceof Error) {
      error = `${e.name}: ${e.message}`;
    } else {
      error = "API 呼び出しに失敗しました";
    }
    console.error("API call failed:", e);
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Nonda</h1>
      <section>
        <h2 className="font-semibold">Session</h2>
        <pre className="text-xs bg-muted/30 p-2 rounded">{JSON.stringify(session, null, 2)}</pre>
      </section>
      <section>
        <h2 className="font-semibold">Medicines (API 呼び出しテスト)</h2>
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <pre className="text-xs bg-muted/30 p-2 rounded">
            {JSON.stringify(medicines, null, 2)}
          </pre>
        )}
      </section>
    </main>
  );
}
