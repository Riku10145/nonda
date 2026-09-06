export const TIMINGS = ["morning", "afternoon", "evening"] as const;
export type Timing = (typeof TIMINGS)[number];

export interface TimingTriple<T> {
  readonly morning: T;
  readonly afternoon: T;
  readonly evening: T;
}

export const timingTriple = <T>(build: (timing: Timing) => T): TimingTriple<T> => ({
  morning: build("morning"),
  afternoon: build("afternoon"),
  evening: build("evening"),
});

const _LABELS = { morning: "朝", afternoon: "昼", evening: "夜" } as const;

export const timingLabel = (timing: Timing): (typeof _LABELS)[Timing] => _LABELS[timing];

export const isTiming = (raw: string): raw is Timing =>
  (TIMINGS as readonly string[]).includes(raw);

export const parseTiming = (raw: string): Timing | null => (isTiming(raw) ? raw : null);
