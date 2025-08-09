import { describe, expect, it } from "vitest";
import { alignMap, calcSpacingPx, justifyMap } from "./core";

describe("Layout Core Utilities", () => {
  describe("alignMap", () => {
    it("maps all alignment values correctly", () => {
      expect(alignMap.start).toBe("flex-start");
      expect(alignMap.end).toBe("flex-end");
      expect(alignMap["flex-start"]).toBe("flex-start");
      expect(alignMap["flex-end"]).toBe("flex-end");
      expect(alignMap.center).toBe("center");
      expect(alignMap.stretch).toBe("stretch");
      expect(alignMap.baseline).toBe("baseline");
    });
  });

  describe("justifyMap", () => {
    it("maps all justification values correctly", () => {
      expect(justifyMap.start).toBe("flex-start");
      expect(justifyMap.end).toBe("flex-end");
      expect(justifyMap["flex-start"]).toBe("flex-start");
      expect(justifyMap["flex-end"]).toBe("flex-end");
      expect(justifyMap.center).toBe("center");
      expect(justifyMap.between).toBe("space-between");
      expect(justifyMap.around).toBe("space-around");
      expect(justifyMap.evenly).toBe("space-evenly");
      expect(justifyMap["space-between"]).toBe("space-between");
      expect(justifyMap["space-around"]).toBe("space-around");
      expect(justifyMap["space-evenly"]).toBe("space-evenly");
    });
  });

  describe("calcSpacingPx", () => {
    it("returns undefined for undefined input", () => {
      expect(calcSpacingPx(undefined)).toBeUndefined();
    });

    it("converts number values to pixel strings", () => {
      expect(calcSpacingPx(0)).toBe("0px");
      expect(calcSpacingPx(16)).toBe("16px");
      expect(calcSpacingPx(-8)).toBe("-8px");
    });

    it("returns string values as-is", () => {
      expect(calcSpacingPx("0")).toBe("0");
      expect(calcSpacingPx("16px")).toBe("16px");
      expect(calcSpacingPx("1rem")).toBe("1rem");
      expect(calcSpacingPx("50%")).toBe("50%");
      expect(calcSpacingPx("calc(100% - 20px)")).toBe("calc(100% - 20px)");
    });
  });
});
