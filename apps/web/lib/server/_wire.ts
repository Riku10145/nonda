import "server-only";

import type { DayGroup, DayLog } from "@/lib/domain/history";
import type { HhMm, LogId, MedicineId, NonEmptyTimings } from "@/lib/domain/ids";
import { parseJstDate } from "@/lib/domain/jst";
import type { Medicine } from "@/lib/domain/medicine";
import { parseHhMm, type NotifyTriplet } from "@/lib/domain/notify";
import { TIMINGS, isTiming, timingTriple, type Timing } from "@/lib/domain/timing";
import type { MedicineWithLogs } from "@/lib/domain/today";

const _mismatch = (what: string): never => {
  throw new Error(`wire shape mismatch: ${what}`);
};

const _isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const _parseTiming = (raw: unknown, ctx: string): Timing => {
  if (typeof raw !== "string" || !isTiming(raw)) return _mismatch(ctx);
  return raw;
};

const _uniqueTimings = (raw: unknown): NonEmptyTimings => {
  if (!Array.isArray(raw)) return _mismatch("timings");
  const seen = new Set<Timing>();
  for (const item of raw) {
    seen.add(_parseTiming(item, "timings[]"));
  }
  const [first, ...rest] = TIMINGS.filter((timing) => seen.has(timing));
  if (!first) return _mismatch("timings empty");
  return [first, ...rest];
};

const _parseMedicineFields = (
  raw: unknown,
): { id: MedicineId; name: string; timings: NonEmptyTimings } => {
  if (!_isRecord(raw)) return _mismatch("medicine");
  if (typeof raw.id !== "string" || raw.id.length === 0) return _mismatch("medicine.id");
  if (typeof raw.name !== "string") return _mismatch("medicine.name");
  return {
    id: raw.id as MedicineId,
    name: raw.name,
    timings: _uniqueTimings(raw.timings),
  };
};

export const _parseMedicine = (raw: unknown): Medicine => _parseMedicineFields(raw);

export const _parseMedicines = (raw: unknown): Medicine[] => {
  if (!Array.isArray(raw)) return _mismatch("medicines");
  return raw.map(_parseMedicine);
};

export const _parseMedicineWithLogs = (raw: unknown): MedicineWithLogs => {
  const medicine = _parseMedicineFields(raw);
  if (!_isRecord(raw)) return _mismatch("medicine");
  const logs: MedicineWithLogs["logs"] = {};
  if (raw.today_logs === undefined) {
    return { ...medicine, logs };
  }
  if (!_isRecord(raw.today_logs)) return _mismatch("today_logs");
  for (const [key, value] of Object.entries(raw.today_logs)) {
    if (!isTiming(key)) continue;
    if (!_isRecord(value)) continue;
    if (typeof value.log_id !== "string" || value.log_id.length === 0) continue;
    if (typeof value.is_taken !== "boolean") continue;
    logs[key] = { logId: value.log_id as LogId, taken: value.is_taken };
  }
  return { ...medicine, logs };
};

export const _parseTodayMedicines = (raw: unknown): MedicineWithLogs[] => {
  if (!Array.isArray(raw)) return _mismatch("today medicines");
  return raw.map(_parseMedicineWithLogs);
};

const _parseDayLog = (raw: unknown): DayLog => {
  if (!_isRecord(raw)) return _mismatch("day log");
  if (typeof raw.id !== "string" || raw.id.length === 0) return _mismatch("day log.id");
  if (typeof raw.medicine_name !== "string") return _mismatch("day log.medicine_name");
  if (typeof raw.is_taken !== "boolean") return _mismatch("day log.is_taken");
  if (typeof raw.recorded_at !== "string") return _mismatch("day log.recorded_at");
  return {
    id: raw.id as LogId,
    name: raw.medicine_name,
    timing: _parseTiming(raw.timing, "day log.timing"),
    taken: raw.is_taken,
    recordedAt: raw.recorded_at,
  };
};

export const _parseDayGroups = (raw: unknown): DayGroup[] => {
  if (!Array.isArray(raw)) return _mismatch("day groups");
  return raw.map((item: unknown) => {
    if (!_isRecord(item)) return _mismatch("day group");
    const date = typeof item.date === "string" ? parseJstDate(item.date) : null;
    if (!date) return _mismatch("day group.date");
    if (!Array.isArray(item.logs)) return _mismatch("day group.logs");
    return { date, logs: item.logs.map(_parseDayLog) };
  });
};

const _DEFAULT_NOTIFY_TIMES = {
  morning: "08:00",
  afternoon: "12:00",
  evening: "21:00",
} as const;

export const _parseNotifyTriplet = (raw: unknown): NotifyTriplet => {
  if (!Array.isArray(raw)) return _mismatch("notification-settings");
  const parsed = new Map<Timing, { time: HhMm; enabled: boolean }>();
  for (const item of raw) {
    if (!_isRecord(item)) return _mismatch("notify item");
    if (typeof item.timing !== "string" || !isTiming(item.timing)) continue;
    if (typeof item.notify_time !== "string") continue;
    const time = parseHhMm(item.notify_time);
    if (!time) continue;
    if (typeof item.is_enabled !== "boolean") continue;
    parsed.set(item.timing, { time, enabled: item.is_enabled });
  }
  return timingTriple((timing) => {
    const slot = parsed.get(timing);
    if (slot) return slot;
    return {
      time: _DEFAULT_NOTIFY_TIMES[timing] as HhMm,
      enabled: true,
    };
  });
};

export const _wireInsertBody = (
  rows: Array<{ medicineId: MedicineId; timing: Timing; taken: boolean }>,
  recordedAtIso: string,
): unknown => ({
  logs: rows.map((row) => ({
    medicine_id: row.medicineId,
    timing: row.timing,
    is_taken: row.taken,
  })),
  recorded_at: recordedAtIso,
});

export const _wirePatchTaken = (taken: boolean): unknown => ({ is_taken: taken });

export const _wireMedicineBody = (name: string, timings: NonEmptyTimings): unknown => ({
  name,
  timings: [...timings],
});

export const _wireNotifyBody = (t: NotifyTriplet): unknown =>
  TIMINGS.map((timing) => ({
    timing,
    notify_time: t[timing].time,
    is_enabled: t[timing].enabled,
  }));
