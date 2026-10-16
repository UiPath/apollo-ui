import { describe, expect, it } from "vitest";
import { VERTEX_NAMESPACE } from "@/lib/vertex-translation";
import {
  navItemIsCurrent,
  navItemState,
  navPathIsActive,
} from "./shell-nav-active";
import { type NavCatalog, readNavLabel } from "./shell-nav-label";

describe("navPathIsActive", () => {
  it("matches the path and its nested pages", () => {
    expect(navPathIsActive("/rules/exceptions", "/rules/exceptions")).toBe(
      true,
    );
    expect(
      navPathIsActive(
        "/rules/exceptions/currency-mismatch",
        "/rules/exceptions",
      ),
    ).toBe(true);
  });

  it("does not match a sibling page", () => {
    expect(navPathIsActive("/rules/feedback", "/rules/exceptions")).toBe(false);
    expect(navPathIsActive("/rules/feedback/abc", "/rules/exceptions")).toBe(
      false,
    );
  });

  it("keeps a parent prefix active on nested child pages", () => {
    expect(navPathIsActive("/rules/exceptions", "/rules")).toBe(true);
    expect(navPathIsActive("/rules/feedback", "/rules")).toBe(true);
  });

  it("matches the root only exactly", () => {
    expect(navPathIsActive("/", "/")).toBe(true);
    expect(navPathIsActive("/dashboard", "/")).toBe(false);
  });
});

describe("navItemIsCurrent", () => {
  const invoiceChildren = ["/invoices/rejected"];

  it("marks a parent page current on its own pages", () => {
    expect(navItemIsCurrent("/invoices", "/invoices", invoiceChildren)).toBe(
      true,
    );
    expect(
      navItemIsCurrent("/invoices/abc-123", "/invoices", invoiceChildren),
    ).toBe(true);
  });

  it("hands current to the child on the child's page", () => {
    expect(
      navItemIsCurrent("/invoices/rejected", "/invoices", invoiceChildren),
    ).toBe(false);
    expect(navItemIsCurrent("/invoices/rejected", "/invoices/rejected")).toBe(
      true,
    );
  });

  it("keeps a group parent like Rules off while a child is open", () => {
    expect(
      navItemIsCurrent("/rules/exceptions", "/rules", [
        "/rules/feedback",
        "/rules/exceptions",
      ]),
    ).toBe(false);
  });
});

describe("navItemState", () => {
  it("links a group to its default child and keeps the prefix active", () => {
    expect(
      navItemState("/rules/exceptions", {
        path: "/rules",
        to: "/rules/exceptions",
        childPaths: ["/rules/feedback", "/rules/exceptions"],
      }),
    ).toEqual({
      href: "/rules/exceptions",
      prefixActive: true,
      current: false,
    });
  });

  it("uses path as the link when the group has no default child", () => {
    expect(
      navItemState("/invoices", {
        path: "/invoices",
        childPaths: ["/invoices/rejected"],
      }).href,
    ).toBe("/invoices");
  });
});

function catalog(bundles: Record<string, Record<string, string>>): NavCatalog {
  return {
    defaultNamespace: "translation",
    exists: (key, namespace) => Object.hasOwn(bundles[namespace] ?? {}, key),
    translate: (key, namespace) => bundles[namespace]?.[key] ?? key,
  };
}

describe("readNavLabel", () => {
  it("reads an app key that is not in the vertex catalog", () => {
    expect(
      readNavLabel(
        catalog({
          translation: { queue: "My work" },
          [VERTEX_NAMESPACE]: { dashboard: "Dashboard" },
        }),
        "queue",
      ),
    ).toBe("My work");
  });

  it("prefers the app catalog when both define the key", () => {
    expect(
      readNavLabel(
        catalog({
          translation: { dashboard: "Home" },
          [VERTEX_NAMESPACE]: { dashboard: "Dashboard" },
        }),
        "dashboard",
      ),
    ).toBe("Home");
  });

  it("falls back to the vertex catalog", () => {
    expect(
      readNavLabel(
        catalog({
          translation: {},
          [VERTEX_NAMESPACE]: { dashboard: "Dashboard" },
        }),
        "dashboard",
      ),
    ).toBe("Dashboard");
  });

  it("returns the raw key when neither catalog has it", () => {
    expect(readNavLabel(catalog({ translation: {} }), "queue")).toBe("queue");
  });
});
