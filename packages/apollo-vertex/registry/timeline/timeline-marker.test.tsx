import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TimelineMarker } from "./timeline-marker";

afterEach(cleanup);

describe("TimelineMarker completed-user-progress", () => {
  it("spins the ring around the completed-user check", () => {
    const { container, rerender } = render(
      <TimelineMarker variant="completed-user-progress" />,
    );

    expect(container.querySelector(".animate-spin")).not.toBeNull();
    expect(container.querySelector(".lucide-user-check")).not.toBeNull();

    rerender(<TimelineMarker variant="completed-user" />);
    expect(container.querySelector(".animate-spin")).toBeNull();
    expect(container.querySelector(".lucide-user-check")).not.toBeNull();
  });
});
