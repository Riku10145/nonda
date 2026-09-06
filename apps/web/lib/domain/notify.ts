import type { HhMm } from "./ids";
import { TIMINGS, timingTriple, type Timing, type TimingTriple } from "./timing";

export interface NotifySlot {
  time: HhMm;
  enabled: boolean;
}

export interface NotifyTriplet extends TimingTriple<NotifySlot> {}

export interface Account {
  name: string;
  email: string;
  image: string | null;
}

export const isNotifyOn = (t: NotifyTriplet): boolean =>
  TIMINGS.some((timing) => t[timing].enabled);

export const setNotifyMaster = (t: NotifyTriplet, on: boolean): NotifyTriplet =>
  timingTriple((timing) => ({ time: t[timing].time, enabled: on }));

export const setNotifyTime = (t: NotifyTriplet, timing: Timing, time: HhMm): NotifyTriplet =>
  timingTriple((slotTiming) =>
    slotTiming === timing ? { time, enabled: t[slotTiming].enabled } : t[slotTiming],
  );

export const parseHhMm = (raw: string): HhMm | null => {
  const sliced = /^\d{2}:\d{2}:\d{2}/.test(raw) ? raw.slice(0, 5) : raw;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(sliced)) return null;
  return sliced as HhMm;
};
