import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DetailPage } from "./detail-page";
import type { DetailPageConfig } from "./detail-page-rules";
import { useDetailPage } from "./use-detail-page";

afterEach(cleanup);

const bothOpen: DetailPageConfig = {
  panels: "both",
  start: { placement: "beside-header", defaultOpen: true },
  end: { placement: "below-header", defaultOpen: true },
};

const closeStartLabel = "Close start";
const recordTitle = "Record";
const queueLabel = "Queue";
const contentLabel = "Invoice body";
const activityLabel = "Activity";

function Page({ config = bothOpen }: { config?: DetailPageConfig }) {
  const state = useDetailPage(config);
  return (
    <>
      <button type="button" onClick={() => state.setPanelOpen("start", false)}>
        {closeStartLabel}
      </button>
      <DetailPage
        state={state}
        header={<h1>{recordTitle}</h1>}
        startSidebar={<p>{queueLabel}</p>}
        content={<p>{contentLabel}</p>}
        endSidebar={<p>{activityLabel}</p>}
      />
    </>
  );
}

describe("DetailPage", () => {
  it("renders the header, both sidebars, and the content", () => {
    render(<Page />);

    expect(screen.getByRole("heading", { name: recordTitle })).toBeTruthy();
    expect(screen.getByText(queueLabel)).toBeTruthy();
    expect(screen.getByText(contentLabel)).toBeTruthy();
    expect(screen.getByText(activityLabel)).toBeTruthy();
    expect(slot("detail-page-header")).toBeTruthy();
    expect(slot("detail-page-main")).toBeTruthy();
    expect(slot("detail-page-start-panel")?.dataset.state).toBe("open");
    expect(slot("detail-page-end-panel")?.dataset.state).toBe("open");
  });

  it("puts a beside-header sidebar beside the header and a below-header one under it", () => {
    render(<Page />);

    expect(slot("detail-page-header")?.className).toContain("col-start-2");
    expect(slot("detail-page-start-panel")?.className).toContain("row-span-2");
    expect(slot("detail-page-end-panel")?.className).not.toContain(
      "row-span-2",
    );
  });

  it("leaves a disabled sidebar out and keeps a closed one mounted", () => {
    const { rerender } = render(<Page />);

    fireEvent.click(screen.getByRole("button", { name: closeStartLabel }));
    expect(slot("detail-page-start-panel")?.dataset.state).toBe("closed");
    expect(slot("detail-page-start-panel")?.hasAttribute("inert")).toBe(true);
    expect(screen.getByText(queueLabel)).toBeTruthy();

    rerender(
      <Page
        config={{
          ...bothOpen,
          panels: "end",
        }}
      />,
    );
    expect(slot("detail-page-start-panel")).toBeNull();
    expect(slot("detail-page-end-panel")).toBeTruthy();
  });
});

function slot(name: string): HTMLElement | null {
  const node = document.querySelector(`[data-slot="${name}"]`);
  if (!(node instanceof HTMLElement)) return null;
  return node;
}
