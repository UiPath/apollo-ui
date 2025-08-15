import { cx } from "./CssUtil";

describe("cx utility function", () => {
  it("should handle single string class", () => {
    expect(cx("class1")).toBe("class1");
  });

  it("should handle multiple string classes", () => {
    expect(cx("class1", "class2")).toBe("class1 class2");
  });

  it("should handle object with boolean values", () => {
    expect(cx({ class1: true, class2: false, class3: true })).toBe("class1 class3");
  });

  it("should handle array of strings", () => {
    expect(cx(["class1", "class2"])).toBe("class1 class2");
  });

  it("should handle nested arrays", () => {
    expect(cx(["class1", ["class2", "class3"]])).toBe("class1 class2 class3");
  });

  it("should handle mixed types", () => {
    expect(cx("class1", { class2: true, class3: false }, ["class4", { class5: true }])).toBe("class1 class2 class4 class5");
  });

  it("should handle deeply nested arrays and objects", () => {
    expect(cx(["class1", ["class2", { class3: true, class4: false }, ["class5", { class6: true }]]])).toBe(
      "class1 class2 class3 class5 class6"
    );
  });

  it("should return an empty string for invalid inputs", () => {
    expect(cx(null, undefined, 123)).toBe("123");
  });
});
