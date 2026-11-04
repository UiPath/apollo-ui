import { cleanup, render, screen } from "@testing-library/react";
import { createInstance } from "i18next";
import { DateTime } from "luxon";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { VERTEX_NAMESPACE } from "@/lib/vertex-translation";
import en from "../../locales/en.json";
import { InboxGroup, InboxItem, InboxItemTime, InboxItemTitle } from "./inbox";

const i18n = createInstance();

beforeAll(async () => {
  await i18n.init({
    lng: "en",
    resources: { en: { [VERTEX_NAMESPACE]: en } },
  });
});

afterEach(cleanup);

function renderInEnglish(ui: ReactNode) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe("InboxGroup", () => {
  it("labels a day group and lets label override it", () => {
    const { rerender } = renderInEnglish(<InboxGroup group="yesterday" />);
    expect(screen.getByRole("heading", { name: "Yesterday" })).toBeTruthy();

    rerender(
      <I18nextProvider i18n={i18n}>
        <InboxGroup group="yesterday" label="Pinned" />
      </I18nextProvider>,
    );
    expect(screen.getByRole("heading", { name: "Pinned" })).toBeTruthy();
  });
});

describe("InboxItem", () => {
  it("marks the selected item as current and announces unread items", () => {
    renderInEnglish(
      <InboxGroup>
        <InboxItem selected unread>
          <InboxItemTitle>{"Acme Corp"}</InboxItemTitle>
        </InboxItem>
        <InboxItem>
          <InboxItemTitle>{"Globex"}</InboxItemTitle>
        </InboxItem>
      </InboxGroup>,
    );

    const [first, second] = screen.getAllByRole("button");
    expect(first?.getAttribute("aria-current")).toBe("true");
    expect(first?.textContent).toContain("Unread");
    expect(second?.getAttribute("aria-current")).toBe("false");
    expect(second?.textContent).not.toContain("Unread");
  });
});

describe("InboxItemTime", () => {
  const now = DateTime.fromISO("2026-09-07T12:00:00Z");

  it("shows the relative time in the app's language with the exact date in dateTime", () => {
    const { container } = renderInEnglish(
      <InboxItemTime value="2026-09-07T10:00:00Z" now={now} />,
    );

    const time = container.querySelector("time");
    expect(time?.textContent).toBe("2 hours ago");
    expect(
      DateTime.fromISO(time?.getAttribute("datetime") ?? "").toMillis(),
    ).toBe(DateTime.fromISO("2026-09-07T10:00:00Z").toMillis());
  });

  it("renders nothing for an invalid date", () => {
    const { container } = renderInEnglish(
      <InboxItemTime value="not-a-date" now={now} />,
    );
    expect(container.querySelector("time")).toBeNull();
  });
});
