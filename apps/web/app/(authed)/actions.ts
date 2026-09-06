"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError } from "@/lib/api-client";
import { parseMedicineId } from "@/lib/domain/ids";
import { timingsFromSelection, type TimingSelection } from "@/lib/domain/medicine";
import { parseHhMm, setNotifyMaster, setNotifyTime } from "@/lib/domain/notify";
import { TIMINGS, parseTiming } from "@/lib/domain/timing";
import { commitMarkAllTaken, commitSetDoseTaken } from "@/lib/server/today";
import {
  commitCreateMedicine,
  commitDeleteMedicine,
  commitUpdateMedicine,
} from "@/lib/server/medicines";
import { commitNotifyTriplet, loadNotifyTriplet } from "@/lib/server/notify";

export type ActionResult = { kind: "succeeded" } | { kind: "failed"; message: string };

const _actionMessage = (error: unknown): string => {
  if (error instanceof ApiError) return error.message;
  return "処理に失敗しました";
};

const _selectionFromForm = (formData: FormData): TimingSelection => ({
  morning: formData.has("morning"),
  afternoon: formData.has("afternoon"),
  evening: formData.has("evening"),
});

export const setDoseTaken = async (
  medicineId: string,
  timing: string,
  taken: boolean,
): Promise<ActionResult> => {
  const id = parseMedicineId(medicineId);
  const parsedTiming = parseTiming(timing);
  if (!id || !parsedTiming || typeof taken !== "boolean") {
    return { kind: "failed", message: "不正なリクエストです" };
  }
  try {
    await commitSetDoseTaken(id, parsedTiming, taken);
    revalidatePath("/");
    revalidatePath("/history");
    return { kind: "succeeded" };
  } catch (error) {
    return { kind: "failed", message: _actionMessage(error) };
  }
};

export const markAllTaken = async (): Promise<ActionResult> => {
  try {
    await commitMarkAllTaken();
    revalidatePath("/");
    revalidatePath("/history");
    return { kind: "succeeded" };
  } catch (error) {
    return { kind: "failed", message: _actionMessage(error) };
  }
};

export const createMedicine = async (formData: FormData): Promise<void> => {
  const name = String(formData.get("name") ?? "").trim();
  const timings = timingsFromSelection(_selectionFromForm(formData));
  if (!name || !timings) {
    redirect("/medicines/new?error=invalid");
  }
  try {
    await commitCreateMedicine(name, timings);
  } catch (error) {
    redirect(`/medicines/new?error=${encodeURIComponent(_actionMessage(error))}`);
  }
  revalidatePath("/");
  revalidatePath("/medicines");
  revalidatePath("/history");
  redirect("/medicines");
};

export const updateMedicine = async (id: string, formData: FormData): Promise<void> => {
  const medicineId = parseMedicineId(id);
  if (!medicineId) redirect("/medicines");
  const name = String(formData.get("name") ?? "").trim();
  const timings = timingsFromSelection(_selectionFromForm(formData));
  if (!name || !timings) {
    redirect(`/medicines/${medicineId}?error=invalid`);
  }
  try {
    await commitUpdateMedicine(medicineId, name, timings);
  } catch (error) {
    redirect(`/medicines/${medicineId}?error=${encodeURIComponent(_actionMessage(error))}`);
  }
  revalidatePath("/");
  revalidatePath("/medicines");
  revalidatePath("/history");
  redirect("/medicines");
};

export const deleteMedicine = async (id: string): Promise<void> => {
  const medicineId = parseMedicineId(id);
  if (!medicineId) redirect("/medicines");
  try {
    await commitDeleteMedicine(medicineId);
  } catch (error) {
    redirect(`/medicines/${medicineId}?error=${encodeURIComponent(_actionMessage(error))}`);
  }
  revalidatePath("/");
  revalidatePath("/medicines");
  revalidatePath("/history");
  redirect("/medicines");
};

export const saveNotifyTriplet = async (formData: FormData): Promise<ActionResult> => {
  try {
    const current = await loadNotifyTriplet();
    const masterOn = formData.get("master") === "on";
    let next = setNotifyMaster(current, masterOn);
    for (const timing of TIMINGS) {
      const raw = String(formData.get(timing) ?? "");
      const time = parseHhMm(raw);
      if (time) next = setNotifyTime(next, timing, time);
    }
    await commitNotifyTriplet(next);
    revalidatePath("/settings");
    return { kind: "succeeded" };
  } catch (error) {
    return { kind: "failed", message: _actionMessage(error) };
  }
};
