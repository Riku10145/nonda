import { loadMedicines } from "@/lib/server/medicines";
import { MedicineList } from "../_ui/medicine-list";

export default async function MedicinesPage() {
  const medicines = await loadMedicines();
  return <MedicineList medicines={medicines} />;
}
