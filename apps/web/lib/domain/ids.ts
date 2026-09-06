import type { Timing } from "./timing";

export type MedicineId = string & { readonly __brand: "MedicineId" };
export type LogId = string & { readonly __brand: "LogId" };
export type JstDate = string & { readonly __brand: "JstDate" };
export type HhMm = string & { readonly __brand: "HhMm" };

export type NonEmptyTimings = readonly [Timing, ...Timing[]];

const _UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const parseMedicineId = (raw: string): MedicineId | null =>
  _UUID_RE.test(raw) ? (raw as MedicineId) : null;
