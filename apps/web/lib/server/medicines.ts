import "server-only";

import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type { MedicineId, NonEmptyTimings } from "@/lib/domain/ids";
import type { Medicine } from "@/lib/domain/medicine";
import { _parseMedicine, _parseMedicines, _wireMedicineBody } from "./_wire";

export const loadMedicines = async (): Promise<Medicine[]> => {
  const raw = await apiGet<unknown>("/v1/medicines");
  return _parseMedicines(raw);
};

export const loadMedicine = async (id: MedicineId): Promise<Medicine | null> => {
  try {
    const raw = await apiGet<unknown>(`/v1/medicines/${id}`);
    return _parseMedicine(raw);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
};

export const commitCreateMedicine = async (
  name: string,
  timings: NonEmptyTimings,
): Promise<void> => {
  await apiPost("/v1/medicines", _wireMedicineBody(name, timings));
};

export const commitUpdateMedicine = async (
  id: MedicineId,
  name: string,
  timings: NonEmptyTimings,
): Promise<void> => {
  await apiPatch(`/v1/medicines/${id}`, _wireMedicineBody(name, timings));
};

export const commitDeleteMedicine = async (id: MedicineId): Promise<void> => {
  await apiDelete(`/v1/medicines/${id}`);
};
