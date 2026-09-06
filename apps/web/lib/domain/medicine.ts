import type { MedicineId, NonEmptyTimings } from "./ids";
import { TIMINGS, type Timing } from "./timing";

export interface Medicine {
  id: MedicineId;
  name: string;
  timings: NonEmptyTimings;
}

export interface TimingSelection {
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
}

export type MedicineDraft =
  | { mode: "create"; name: string; selection: TimingSelection }
  | { mode: "edit"; id: MedicineId; name: string; selection: TimingSelection };

export const selectionFromTimings = (timings: readonly Timing[]): TimingSelection => ({
  morning: timings.includes("morning"),
  afternoon: timings.includes("afternoon"),
  evening: timings.includes("evening"),
});

export const timingsFromSelection = (s: TimingSelection): NonEmptyTimings | null => {
  const [first, ...rest] = TIMINGS.filter((timing) => s[timing]);
  if (!first) return null;
  return [first, ...rest];
};

export const initialGlyph = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return "薬";
  const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
  const first = segmenter.segment(trimmed)[Symbol.iterator]().next().value;
  return first?.segment ?? "薬";
};
