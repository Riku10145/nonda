import { notFound } from "next/navigation";

import { parseMedicineId } from "@/lib/domain/ids";
import { selectionFromTimings } from "@/lib/domain/medicine";
import { loadMedicine } from "@/lib/server/medicines";
import { MedicineForm } from "../../_ui/medicine-form";

const _formError = (raw: string | undefined): string | undefined => {
  if (!raw) return undefined;
  if (raw === "invalid") return "名前と服用タイミングを入力してください";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

export default async function EditMedicinePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const medicineId = parseMedicineId(id);
  if (!medicineId) notFound();
  const medicine = await loadMedicine(medicineId);
  if (!medicine) notFound();
  return (
    <MedicineForm
      draft={{
        mode: "edit",
        id: medicine.id,
        name: medicine.name,
        selection: selectionFromTimings(medicine.timings),
      }}
      error={_formError(error)}
    />
  );
}
