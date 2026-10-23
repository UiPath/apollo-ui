import { beforeEach, describe, expect, it, vi } from "vitest";

import { createProteusProvider } from "./proteus-adapter";
import { initializeProteus } from "./proteus-client.mock";

const fetched: Record<string, boolean> = { "Flag.Enabled": true };

const context = {
  userId: "user",
  email: "user@example.com",
  organizationName: "org",
  organizationId: "org-id",
  tenantName: "tenant",
  tenantId: "tenant-id",
};

function provider(apiOrigin?: string) {
  return createProteusProvider<string>({
    appName: "app",
    apiOrigin,
    featureFlags: {},
    authTokenFactory: () => "",
  });
}

describe("createProteusProvider", () => {
  beforeEach(() => {
    initializeProteus.mockReset();
    initializeProteus.mockImplementation(() => {
      let loaded = false;
      return {
        identity: () => {
          loaded = true;
          return Promise.resolve();
        },
        featureFlagValue: (key: string) => loaded && Boolean(fetched[key]),
        defaultFeatureFlagValue: () => false,
        addFlagChangeListener: vi.fn(),
        removeFlagChangeListener: vi.fn(),
      };
    });
  });

  it("forwards apiOrigin to Proteus", () => {
    provider("https://example.com");

    expect(initializeProteus).toHaveBeenCalledWith(
      expect.objectContaining({ apiOrigin: "https://example.com" }),
    );
  });

  it("leaves apiOrigin unset when the caller omits it", () => {
    provider();

    expect(initializeProteus.mock.calls[0]?.[0].apiOrigin).toBeUndefined();
  });

  it("notifies listeners registered before the first fetch", async () => {
    const p = provider("https://example.com");
    const cb = vi.fn();
    p.on("Flag.Enabled", cb);

    expect(p.getFeatureFlagValue("Flag.Enabled")).toBe(false);
    await p.initialize(context);

    expect(cb).toHaveBeenCalledWith(true);
    expect(p.getFeatureFlagValue("Flag.Enabled")).toBe(true);
  });

  it("does not notify listeners that were removed", async () => {
    const p = provider("https://example.com");
    const cb = vi.fn();
    p.on("Flag.Enabled", cb);
    p.off("Flag.Enabled", cb);

    await p.initialize(context);

    expect(cb).not.toHaveBeenCalled();
  });
});
