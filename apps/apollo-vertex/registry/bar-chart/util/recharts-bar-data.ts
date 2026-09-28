export type RechartsBarData = {
  __category: string;
  __id: string;
  __formatted: Record<string, string>;
  [key: string]: string | number | Record<string, string>;
};

export type LabelListContentProps = {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  payload?: RechartsBarData;
};

export function isRechartsBarData(value: unknown): value is RechartsBarData {
  return (
    typeof value === "object" &&
    value !== null &&
    "__category" in value &&
    "__id" in value
  );
}
