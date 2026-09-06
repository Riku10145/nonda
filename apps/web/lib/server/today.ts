import "server-only";

import { apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type { MedicineId } from "@/lib/domain/ids";
import { jstToday, toIsoNow } from "@/lib/domain/jst";
import type { Timing } from "@/lib/domain/timing";
import {
  buildTodayBoard,
  commandsForMarkAllTaken,
  commandsForSetTaken,
  findSlot,
  type DoseCommand,
  type TodayBoard,
} from "@/lib/domain/today";
import { _parseTodayMedicines, _wireInsertBody, _wirePatchTaken } from "./_wire";

export const loadTodayBoard = async (): Promise<TodayBoard> => {
  const raw = await apiGet<unknown>("/v1/medicines?today=true");
  return buildTodayBoard(jstToday(), _parseTodayMedicines(raw));
};

export const commitDoseCommands = async (commands: DoseCommand[]): Promise<void> => {
  const insertRows = commands.filter((c) => c.type === "insert").flatMap((c) => c.rows);
  const updates = commands.filter((c) => c.type === "update");
  if (insertRows.length > 0) {
    await apiPost("/v1/medication-logs", _wireInsertBody(insertRows, toIsoNow()));
  }
  await Promise.all(
    updates.map((update) =>
      apiPatch(`/v1/medication-logs/${update.logId}`, _wirePatchTaken(update.taken)),
    ),
  );
};

export const commitSetDoseTaken = async (
  medicineId: MedicineId,
  timing: Timing,
  taken: boolean,
): Promise<void> => {
  const board = await loadTodayBoard();
  const slot = findSlot(board, medicineId, timing);
  if (!slot) return;
  await commitDoseCommands(commandsForSetTaken(slot, taken));
};

export const commitMarkAllTaken = async (): Promise<void> => {
  await commitDoseCommands(commandsForMarkAllTaken(await loadTodayBoard()));
};
