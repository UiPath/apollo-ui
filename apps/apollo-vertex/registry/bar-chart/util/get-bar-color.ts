import { assertDefined } from "@/lib/asserts/assert-defined";
import { COLORS, PALETTE } from "./colors";
import type { RechartsBarData } from "./recharts-bar-data";

interface GetBarColorParams {
  seriesCount: number;
  seriesIndex: number;
  item: { color?: string; payload?: { fill?: string } };
  payload: RechartsBarData | null;
  rechartsData: Array<RechartsBarData>;
}

export function getBarColor({
  seriesCount,
  seriesIndex,
  item,
  payload,
  rechartsData,
}: GetBarColorParams): string {
  const itemColor = item.color;
  const payloadFill = item.payload?.fill;

  if (seriesCount === 1) {
    const rowIndex = rechartsData.findIndex(
      (row) => row.__id === payload?.__id,
    );
    const fallbackColor =
      PALETTE[rowIndex >= 0 ? rowIndex % PALETTE.length : 0];
    return assertDefined(
      itemColor ?? payloadFill ?? fallbackColor,
      "Bar color",
    );
  }

  const fallbackColor = COLORS[seriesIndex % COLORS.length];
  return assertDefined(itemColor ?? payloadFill ?? fallbackColor, "Bar color");
}
