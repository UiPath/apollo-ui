import { emptyArray } from "../empty-array";

import { MAX_BINS, NICE_NUMBER_CATEGORIES, TARGET_BINS } from "./constants";

export function niceNumbers({ min, max }: { min: number; max: number }) {
  let bestBinSize = 1;
  let bestDistance = Number.MAX_SAFE_INTEGER;

  const range = max - min;

  // Construct an array between the start and end order of magnitude that may produce valid bins
  // i.e. given [2, 4] produces [100, 1000, 10000]
  const startOrderOfMagnitude = Math.trunc(Math.log10(range / MAX_BINS)) - 1;
  const endOrderOfMagnitude = Math.ceil(Math.log10(range * 10));
  const factorSteps = endOrderOfMagnitude - startOrderOfMagnitude;
  const factors = emptyArray(factorSteps).map(
    (_, idx) => 10 ** (idx + startOrderOfMagnitude),
  );

  const binSizes = factors.flatMap((factor) =>
    NICE_NUMBER_CATEGORIES.map((category) => category * factor),
  );

  for (const binSize of binSizes) {
    const binCount = Math.ceil(max / binSize) - Math.floor(min / binSize);
    if (binCount <= 4 || (binSize !== 3 && binSize !== 4)) {
      const currentDifference = Math.abs(binCount - TARGET_BINS);
      if (currentDifference < bestDistance && binCount <= MAX_BINS) {
        bestDistance = currentDifference;
        bestBinSize = binSize;
      }
    }
  }

  return {
    min: Math.floor(min / bestBinSize) * bestBinSize,
    binSize: bestBinSize,
  };
}
