import { Duration } from "luxon";

export const NICE_NUMBER_CATEGORIES = [1, 2, 3, 4, 5, 25];

export const MAX_BINS = 20;
export const TARGET_BINS = 15;

export const DATE_TIME_NUMBER_CATEGORIES = [
  Duration.fromObject({ years: 500 }),
  Duration.fromObject({ years: 100 }),
  Duration.fromObject({ years: 50 }),
  Duration.fromObject({ years: 10 }),
  Duration.fromObject({ years: 5 }),
  Duration.fromObject({ years: 2 }),
  Duration.fromObject({ years: 1 }),

  Duration.fromObject({ months: 6 }),
  Duration.fromObject({ months: 4 }),
  Duration.fromObject({ months: 3 }),
  Duration.fromObject({ months: 2 }),
  Duration.fromObject({ months: 1 }),

  Duration.fromObject({ days: 14 }),
  Duration.fromObject({ days: 7 }),
  Duration.fromObject({ days: 4 }),
  Duration.fromObject({ days: 2 }),
  Duration.fromObject({ days: 1 }),

  Duration.fromObject({ hours: 12 }),
  Duration.fromObject({ hours: 6 }),
  Duration.fromObject({ hours: 4 }),
  Duration.fromObject({ hours: 2 }),
  Duration.fromObject({ hours: 1 }),

  Duration.fromObject({ minutes: 30 }),
  Duration.fromObject({ minutes: 20 }),
  Duration.fromObject({ minutes: 15 }),
  Duration.fromObject({ minutes: 10 }),
  Duration.fromObject({ minutes: 5 }),
  Duration.fromObject({ minutes: 4 }),
  Duration.fromObject({ minutes: 2 }),
  Duration.fromObject({ minutes: 1 }),

  Duration.fromObject({ seconds: 30 }),
  Duration.fromObject({ seconds: 10 }),
  Duration.fromObject({ seconds: 1 }),

  Duration.fromObject({ milliseconds: 100 }),
  Duration.fromObject({ milliseconds: 30 }),
  Duration.fromObject({ milliseconds: 1 }),
];
