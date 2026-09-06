import type { LogId, MedicineId, JstDate, NonEmptyTimings } from "./ids";
import { TIMINGS, timingTriple, type Timing, type TimingTriple } from "./timing";

export type DoseSlot =
  | {
      kind: "unlogged";
      medicineId: MedicineId;
      name: string;
      timing: Timing;
    }
  | {
      kind: "logged";
      medicineId: MedicineId;
      name: string;
      timing: Timing;
      logId: LogId;
      taken: boolean;
    };

export interface TimingLane {
  timing: Timing;
  slots: DoseSlot[];
}

export interface TimingLanes extends TimingTriple<TimingLane> {}

export interface TodayBoard {
  date: JstDate;
  lanes: TimingLanes;
}

export interface LaneSummary {
  timing: Timing;
  taken: number;
  due: number;
}

export type DoseCommand =
  | {
      type: "insert";
      rows: Array<{ medicineId: MedicineId; timing: Timing; taken: boolean }>;
    }
  | { type: "update"; logId: LogId; taken: boolean };

export interface MedicineWithLogs {
  id: MedicineId;
  name: string;
  timings: NonEmptyTimings;
  logs: Partial<Record<Timing, { logId: LogId; taken: boolean }>>;
}

export const buildTodayBoard = (date: JstDate, medicines: MedicineWithLogs[]): TodayBoard => {
  const lanes = timingTriple((timing): TimingLane => {
    const slots: DoseSlot[] = [];
    for (const medicine of medicines) {
      if (!medicine.timings.includes(timing)) continue;
      const log = medicine.logs[timing];
      if (log) {
        slots.push({
          kind: "logged",
          medicineId: medicine.id,
          name: medicine.name,
          timing,
          logId: log.logId,
          taken: log.taken,
        });
      } else {
        slots.push({
          kind: "unlogged",
          medicineId: medicine.id,
          name: medicine.name,
          timing,
        });
      }
    }
    return { timing, slots };
  });
  return { date, lanes };
};

export const isTaken = (slot: DoseSlot): boolean => slot.kind === "logged" && slot.taken;

export const isAllTaken = (board: TodayBoard): boolean =>
  TIMINGS.every((timing) => board.lanes[timing].slots.every(isTaken));

export const laneSummaries = (board: TodayBoard): LaneSummary[] =>
  TIMINGS.map((timing) => {
    const slots = board.lanes[timing].slots;
    return { timing, taken: slots.filter(isTaken).length, due: slots.length };
  });

export const findSlot = (
  board: TodayBoard,
  medicineId: MedicineId,
  timing: Timing,
): DoseSlot | undefined => board.lanes[timing].slots.find((slot) => slot.medicineId === medicineId);

export const commandsForSetTaken = (slot: DoseSlot, taken: boolean): DoseCommand[] => {
  if (slot.kind === "unlogged") {
    if (!taken) return [];
    return [
      { type: "insert", rows: [{ medicineId: slot.medicineId, timing: slot.timing, taken: true }] },
    ];
  }
  if (slot.taken !== taken) {
    return [{ type: "update", logId: slot.logId, taken }];
  }
  return [];
};

export const commandsForMarkAllTaken = (board: TodayBoard): DoseCommand[] => {
  const insertRows: Array<{ medicineId: MedicineId; timing: Timing; taken: boolean }> = [];
  const updates: DoseCommand[] = [];
  for (const timing of TIMINGS) {
    for (const slot of board.lanes[timing].slots) {
      if (isTaken(slot)) continue;
      if (slot.kind === "unlogged") {
        insertRows.push({ medicineId: slot.medicineId, timing: slot.timing, taken: true });
      } else {
        updates.push({ type: "update", logId: slot.logId, taken: true });
      }
    }
  }
  const commands: DoseCommand[] = [];
  if (insertRows.length > 0) {
    commands.push({ type: "insert", rows: insertRows });
  }
  commands.push(...updates);
  return commands;
};
