import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

import { formatRelativeTime, getDayGroup, groupByDay } from "./relative-time";

const NOW = DateTime.fromISO("2026-09-07T12:00:00", {
  zone: "Europe/Amsterdam",
});

describe("formatRelativeTime", () => {
  it("formats an ISO string relative to now", () => {
    expect(
      formatRelativeTime("2026-09-05T12:00:00+02:00", {
        now: NOW,
        locale: "en",
      }),
    ).toBe("2 days ago");
  });

  it("accepts a Date and a DateTime", () => {
    const twoHoursAgo = NOW.minus({ hours: 2 });
    expect(formatRelativeTime(twoHoursAgo, { now: NOW, locale: "en" })).toBe(
      "2 hours ago",
    );
    expect(
      formatRelativeTime(twoHoursAgo.toJSDate(), { now: NOW, locale: "en" }),
    ).toBe("2 hours ago");
  });

  it("formats in the given locale", () => {
    expect(
      formatRelativeTime(NOW.minus({ days: 2 }), { now: NOW, locale: "de" }),
    ).toBe("vor 2 Tagen");
  });

  it("formats future dates", () => {
    expect(
      formatRelativeTime(NOW.plus({ days: 3 }), { now: NOW, locale: "en" }),
    ).toBe("in 3 days");
  });

  it("supports the short style", () => {
    expect(
      formatRelativeTime(NOW.minus({ hours: 2 }), {
        now: NOW,
        locale: "en",
        style: "short",
      }),
    ).toBe("2 hr. ago");
  });

  it("returns an empty string for an invalid date", () => {
    expect(formatRelativeTime("not-a-date", { now: NOW })).toBe("");
  });
});

describe("getDayGroup", () => {
  it("buckets by calendar day, not by 24-hour periods", () => {
    const lateLastNight = NOW.minus({ days: 1 }).set({ hour: 23, minute: 59 });
    const earlyThisMorning = NOW.startOf("day");
    expect(getDayGroup(earlyThisMorning, NOW)).toBe("today");
    expect(getDayGroup(lateLastNight, NOW)).toBe("yesterday");
  });

  it("puts the past six days in week and anything earlier in older", () => {
    expect(getDayGroup(NOW.minus({ days: 6 }), NOW)).toBe("week");
    expect(getDayGroup(NOW.minus({ days: 7 }), NOW)).toBe("older");
  });

  it("compares in now's time zone", () => {
    // 23:30 UTC on Sep 6 is 01:30 on Sep 7 in Amsterdam
    expect(getDayGroup("2026-09-06T23:30:00Z", NOW)).toBe("today");
  });

  it("treats future dates as today and invalid dates as older", () => {
    expect(getDayGroup(NOW.plus({ days: 2 }), NOW)).toBe("today");
    expect(getDayGroup("not-a-date", NOW)).toBe("older");
  });
});

describe("groupByDay", () => {
  const item = (id: string, days: number) => ({
    id,
    at: NOW.minus({ days }).toISO() ?? "",
  });

  it("keeps groups in display order, keeps item order and drops empty groups", () => {
    const groups = groupByDay(
      [item("a", 0), item("b", 3), item("c", 30), item("d", 4)],
      (i) => i.at,
      NOW,
    );

    expect(groups.map((g) => g.group)).toEqual(["today", "week", "older"]);
    expect(groups[1]?.items.map((i) => i.id)).toEqual(["b", "d"]);
  });

  it("returns nothing for an empty list", () => {
    expect(groupByDay([], (i: { at: string }) => i.at, NOW)).toEqual([]);
  });
});
