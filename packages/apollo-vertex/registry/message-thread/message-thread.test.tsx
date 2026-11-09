import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createInstance } from "i18next";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { VERTEX_NAMESPACE } from "@/lib/vertex-translation";
import en from "../../locales/en.json";
import {
  MessageThread,
  MessageThreadHeader,
  type MessageThreadMessage,
  type MessageThreadProps,
} from "./message-thread";

const i18n = createInstance();

beforeAll(async () => {
  await i18n.init({
    lng: "en",
    resources: { en: { [VERTEX_NAMESPACE]: en } },
  });
});

afterEach(cleanup);

function inEnglish(ui: ReactNode) {
  return <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>;
}

function thread(props: MessageThreadProps) {
  return inEnglish(<MessageThread {...props} />);
}

function message(
  id: string,
  body: string,
  overrides: Partial<MessageThreadMessage> = {},
): MessageThreadMessage {
  return {
    id,
    sender: "Maya Patel",
    sentAt: "2026-09-20T09:00:00Z",
    body,
    ...overrides,
  };
}

const QUESTION_BODY = "When will INV-1 be paid?";
const ANSWER_BODY = "INV-1 is scheduled for Friday.";
const question = message("1", QUESTION_BODY);
const answer = message("2", ANSWER_BODY, { sender: "Leo Martins" });

const toggles = () => screen.queryAllByRole("button", { expanded: false });
const expandedToggles = () =>
  screen.queryAllByRole("button", { expanded: true });

function toggleFor(text: string | RegExp) {
  const toggle = screen
    .getAllByRole("button")
    .find((button) => button.textContent.match(text) != null);
  if (toggle == null) throw new Error(`No toggle for ${String(text)}`);
  return toggle;
}

describe("MessageThread", () => {
  it("lists the newest message first and expands only that one", () => {
    render(thread({ messages: [question, answer] }));
    const [newest, oldest] = screen.getAllByRole("listitem");

    expect(expandedToggles()).toHaveLength(1);
    expect(newest?.contains(expandedToggles()[0] ?? null)).toBe(true);
    expect(oldest?.contains(toggles()[0] ?? null)).toBe(true);
    expect(screen.getByText(ANSWER_BODY).tagName).toBe("P");
  });

  it("lists the oldest message first when asked", () => {
    render(thread({ messages: [question, answer], order: "oldest-first" }));
    const [first] = screen.getAllByRole("listitem");

    expect(first?.contains(toggles()[0] ?? null)).toBe(true);
  });

  it("shows a collapsed message's body on one line", () => {
    render(thread({ messages: [message("1", "Hi,\n\nThanks."), answer] }));

    expect(toggles()[0]?.textContent).toContain("Hi, Thanks.");
  });

  it("expands and collapses a message from the same header button", () => {
    render(
      thread({
        messages: [{ ...question, footer: "Suggested reply" }, answer],
      }),
    );
    const header = toggleFor(QUESTION_BODY);

    fireEvent.click(header);
    expect(header.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Suggested reply")).toBeTruthy();

    fireEvent.click(header);
    expect(header.isConnected).toBe(true);
    expect(header.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("Suggested reply")).toBeNull();
  });

  it("shows the subject above the excerpt when collapsed, and in the header when expanded", () => {
    render(
      thread({
        messages: [
          { ...question, subject: "INV-1 status" },
          { ...answer, subject: "Re: INV-1 status" },
        ],
      }),
    );

    const collapsed = toggles()[0];
    const subject = screen.getByText("INV-1 status");
    expect(collapsed?.contains(subject)).toBe(true);
    expect(
      subject.compareDocumentPosition(screen.getByText(QUESTION_BODY)) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(expandedToggles()[0]?.textContent).toContain("Re: INV-1 status");
  });

  it("shows the same relative time in both states", () => {
    render(thread({ messages: [question, answer] }));

    const collapsed = toggles()[0]?.querySelector("time");
    expect(collapsed?.textContent).toMatch(/ago|in /u);

    fireEvent.click(toggleFor(QUESTION_BODY));

    expect(expandedToggles()[0]?.querySelector("time")?.textContent).toBe(
      collapsed?.textContent,
    );
  });

  it("shows the sender e-mail in both states, and recipients when expanded", () => {
    render(
      thread({
        messages: [
          {
            ...question,
            senderEmail: "maya@example.com",
            recipients: ["Leo Martins"],
          },
          {
            ...answer,
            senderEmail: "leo@example.com",
            recipients: ["AP Team", "Maya Patel"],
          },
        ],
      }),
    );

    const expanded = expandedToggles()[0];
    expect(expanded?.textContent).toContain("<leo@example.com>");
    expect(expanded?.textContent).toContain("to AP Team and Maya Patel");

    const collapsed = toggles()[0];
    expect(collapsed?.textContent).toContain("<maya@example.com>");
    expect(collapsed?.textContent).not.toContain("to Leo Martins");
    expect(collapsed?.textContent).toContain(QUESTION_BODY);
  });

  it("shows a notice as a badge when collapsed and an alert when expanded", () => {
    const onClick = vi.fn();
    render(
      thread({
        messages: [
          {
            ...question,
            notice: {
              status: "warning",
              label: "Address change",
              description: "The address differs from the one on file.",
              actions: [{ label: "Update address", onClick }],
            },
          },
          answer,
        ],
      }),
    );
    expect(toggles()[0]?.textContent).toContain("Address change");
    expect(screen.queryByRole("alert")).toBeNull();

    fireEvent.click(toggleFor(QUESTION_BODY));

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Address change");
    expect(alert.textContent).toContain(
      "The address differs from the one on file.",
    );
    expect(
      alert.compareDocumentPosition(screen.getByText(QUESTION_BODY)) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Update address" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("shows actions beside the header of an expanded message only", () => {
    const onClick = vi.fn();
    render(
      thread({
        messages: [
          {
            ...question,
            actions: [
              {
                label: "Forward",
                onClick,
                icon: () => <svg data-testid="forward-icon" />,
              },
            ],
          },
          answer,
        ],
      }),
    );
    expect(screen.queryByRole("button", { name: "Forward" })).toBeNull();

    const header = toggleFor(QUESTION_BODY);
    fireEvent.click(header);

    const forward = screen.getByRole("button", { name: "Forward" });
    expect(header.contains(forward)).toBe(false);
    expect(forward.contains(screen.getByTestId("forward-icon"))).toBe(true);
    fireEvent.click(forward);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("keeps the previous latest message open when a new one arrives", () => {
    const { rerender } = render(thread({ messages: [question] }));

    rerender(thread({ messages: [question, answer] }));

    expect(toggles()).toHaveLength(0);
  });

  it("expands every message that arrives in one update", () => {
    const { rerender } = render(thread({ messages: [question, answer] }));
    fireEvent.click(toggleFor("Leo Martins"));

    rerender(
      thread({
        messages: [
          question,
          answer,
          message("3", "And INV-2?"),
          message("4", "And INV-3?"),
        ],
      }),
    );

    expect(toggles().map((toggle) => toggle.textContent)).toEqual([
      expect.stringContaining(ANSWER_BODY),
      expect.stringContaining(QUESTION_BODY),
    ]);
  });

  it("leaves earlier messages loaded later collapsed", () => {
    const { rerender } = render(thread({ messages: [question, answer] }));

    rerender(thread({ messages: [message("0", "Older"), question, answer] }));

    expect(toggleFor("Older").getAttribute("aria-expanded")).toBe("false");
  });

  it("expands only the latest message when the first messages load", () => {
    const { rerender } = render(thread({ messages: [] }));

    rerender(thread({ messages: [question, answer] }));

    expect(toggles()).toHaveLength(1);
    expect(toggleFor(QUESTION_BODY).getAttribute("aria-expanded")).toBe(
      "false",
    );
  });

  it("applies defaultExpandedIds when the first messages load", () => {
    const { rerender } = render(
      thread({ messages: [], defaultExpandedIds: [] }),
    );

    rerender(thread({ messages: [question, answer], defaultExpandedIds: [] }));

    expect(expandedToggles()).toHaveLength(0);
  });

  it("always shows a single message expanded, without a toggle", () => {
    render(thread({ messages: [question], defaultExpandedIds: [] }));

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByText(QUESTION_BODY).tagName).toBe("P");
  });

  it("follows expandedIds and reports changes when controlled", () => {
    const onExpandedChange = vi.fn();
    render(
      thread({
        messages: [question, answer],
        expandedIds: ["1", "2"],
        onExpandedChange,
      }),
    );
    expect(toggles()).toHaveLength(0);

    fireEvent.click(toggleFor("Leo Martins"));

    expect(onExpandedChange).toHaveBeenCalledWith(["1"]);
    expect(toggles()).toHaveLength(0);
  });
});

describe("MessageThreadHeader", () => {
  it("shows the title, badge, meta line and actions", () => {
    render(
      inEnglish(
        <MessageThreadHeader
          title="Invoice status"
          badge={{ label: "Open", status: "info" }}
          meta="2 messages"
          actions={[
            { label: "Mark solved", onClick: vi.fn() },
            { label: "Archive", onClick: vi.fn(), disabled: true },
          ]}
        />,
      ),
    );

    expect(
      screen.getByRole("heading", { name: "Invoice status" }),
    ).toBeTruthy();
    expect(screen.getByText("Open")).toBeTruthy();
    expect(screen.getByText("2 messages")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Mark solved" }).dataset.variant,
    ).toBe("default");
    const archive = screen.getByRole<HTMLButtonElement>("button", {
      name: "Archive",
    });
    expect(archive.dataset.variant).toBe("outline");
    expect(archive.disabled).toBe(true);
  });
});
