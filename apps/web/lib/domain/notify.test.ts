import { describe, expect, it } from "vitest";

import type { HhMm } from "./ids";
import {
  isNotifyOn,
  parseHhMm,
  setNotifyMaster,
  setNotifyTime,
  type NotifyTriplet,
} from "./notify";

const _time = (raw: string): HhMm => raw as HhMm;

const _triplet = (): NotifyTriplet => ({
  morning: { time: _time("08:00"), enabled: true },
  afternoon: { time: _time("12:00"), enabled: false },
  evening: { time: _time("21:00"), enabled: true },
});

describe("notify triplet", () => {
  it("treats any-enabled as master on", () => {
    expect(isNotifyOn(_triplet())).toBe(true);
    expect(
      isNotifyOn({
        morning: { time: _time("08:00"), enabled: false },
        afternoon: { time: _time("12:00"), enabled: false },
        evening: { time: _time("21:00"), enabled: false },
      }),
    ).toBe(false);
  });

  it("writes the same enabled flag to all three slots and keeps times", () => {
    const off = setNotifyMaster(_triplet(), false);
    expect(off).toEqual({
      morning: { time: "08:00", enabled: false },
      afternoon: { time: "12:00", enabled: false },
      evening: { time: "21:00", enabled: false },
    });
    const on = setNotifyMaster(off, true);
    expect(on.morning.enabled).toBe(true);
    expect(on.afternoon.enabled).toBe(true);
    expect(on.evening.enabled).toBe(true);
    expect(on.morning.time).toBe("08:00");
    expect(on.afternoon.time).toBe("12:00");
    expect(on.evening.time).toBe("21:00");
  });

  it("updates one slot time without touching the others", () => {
    const next = setNotifyTime(_triplet(), "morning", _time("07:30"));
    expect(next.morning.time).toBe("07:30");
    expect(next.afternoon.time).toBe("12:00");
    expect(next.evening.enabled).toBe(true);
  });
});

describe("parseHhMm", () => {
  it("accepts HH:MM and HH:MM:SS", () => {
    expect(parseHhMm("07:30")).toBe("07:30");
    expect(parseHhMm("21:00:00")).toBe("21:00");
    expect(parseHhMm("24:00")).toBeNull();
    expect(parseHhMm("8:00")).toBeNull();
  });
});
