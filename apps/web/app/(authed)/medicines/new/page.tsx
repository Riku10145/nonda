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

export default async function NewMedicinePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <MedicineForm
      draft={{
        mode: "create",
        name: "",
        selection: { morning: false, afternoon: false, evening: false },
      }}
      error={_formError(error)}
    />
  );
}
