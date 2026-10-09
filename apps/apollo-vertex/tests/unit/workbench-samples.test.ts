import { describe, expect, it } from "vitest";
import {
  normalizeSamples,
  parseSamples,
  writeSamples,
} from "@/app/preview/occupants/workbench-samples";
import {
  parseWorkbenchView,
  serializeWorkbenchView,
} from "@/app/preview/occupants/workbench-url-state";

// The template view's samples: each occupant on the page shows primary
// unless the inspector chose another, and the link carries that choice.

const roundTrip = (query: string) =>
  serializeWorkbenchView(parseWorkbenchView(query));

describe("samples in a link", () => {
  it("reads each occupant's sample, leaving out unknown and primary ones", () => {
    const params = new URLSearchParams(
      "samples=activity-timeline:secondary~key-facts:stress~queue:primary~x:nonsense",
    );
    expect(parseSamples(params)).toEqual({
      "activity-timeline": "secondary",
      "key-facts": "stress",
    });
  });

  it("writes them in a steady order, and nothing when every one is primary", () => {
    const params = new URLSearchParams();
    writeSamples(
      { "key-facts": "stress", "activity-timeline": "secondary" },
      params,
    );
    expect(params.get("samples")).toBe(
      "activity-timeline:secondary~key-facts:stress",
    );
    const none = new URLSearchParams();
    writeSamples({ queue: "primary" }, none);
    expect(none.has("samples")).toBe(false);
  });

  it("keeps a sample only while its occupant is on the page", () => {
    const contents = {
      "end-panel": {
        surface: "side-panel" as const,
        tabs: [{ id: "queue", occupants: ["queue"] }],
      },
    };
    expect(
      normalizeSamples(contents, { queue: "secondary", "key-facts": "stress" }),
    ).toEqual({ queue: "secondary" });
  });
});

describe("the template view's link", () => {
  it("carries the samples of occupants on the page", () => {
    expect(
      roundTrip("?view=template&end-panel-contents=queue&samples=queue:stress"),
    ).toBe("?view=template&end-panel-contents=queue&samples=queue:stress");
  });

  it("drops a sample whose occupant isn't on the page", () => {
    expect(
      roundTrip(
        "?view=template&end-panel-contents=queue&samples=key-facts:stress",
      ),
    ).toBe("?view=template&end-panel-contents=queue");
  });

  it("is ignored by the surface view, which has its own sample", () => {
    expect(
      roundTrip("?occupant=queue&samples=queue:stress&sample=secondary"),
    ).toBe("?occupant=queue&sample=secondary");
  });
});
