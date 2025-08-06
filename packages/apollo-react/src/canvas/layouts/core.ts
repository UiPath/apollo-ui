export const alignMap = {
  start: "flex-start",
  end: "flex-end",
  "flex-start": "flex-start",
  "flex-end": "flex-end",
  center: "center",
  stretch: "stretch",
  baseline: "baseline",
};

export const justifyMap = {
  start: "flex-start",
  end: "flex-end",
  "flex-start": "flex-start",
  "flex-end": "flex-end",
  center: "center",
  between: "space-between",
  around: "space-around",
  evenly: "space-evenly",
  "space-between": "space-between",
  "space-around": "space-around",
  "space-evenly": "space-evenly",
};

export function calcSpacingPx(value?: number | string) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "number") {
    return `${value}px`;
  }

  if (typeof value === "string") {
    return value;
  }

  return undefined;
}
