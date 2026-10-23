import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VERTEX_NAMESPACE } from "@/lib/vertex-translation";
import { FilterDropdown } from "./filter-dropdown";

afterEach(cleanup);

const OPTIONS = [
  { label: "Running", value: "running" },
  { label: "Faulted", value: "faulted" },
  { label: "Paused", value: "paused" },
];

function renderDropdown(
  props: Partial<React.ComponentProps<typeof FilterDropdown>> = {},
) {
  return render(
    <FilterDropdown title="Status" options={OPTIONS} value={[]} {...props} />,
  );
}

const openDropdown = () => fireEvent.click(screen.getByRole("button"));

describe("FilterDropdown", () => {
  it("reads the trigger label from the vertex catalog", () => {
    // Not English, so a match proves the catalog was read rather than the default
    const i18n = createInstance();
    void i18n.init({
      lng: "xx",
      resources: {
        xx: {
          [VERTEX_NAMESPACE]: {
            filter_trigger_all: "{{title}} (all)",
            filter_trigger_value: "{{title}} = {{value}}",
            filter_trigger_count: "{{title}} x{{count}}",
          },
        },
      },
      interpolation: { escapeValue: false },
      initAsync: false,
    });
    const renderTranslated = (value: string[]) =>
      render(
        <I18nextProvider i18n={i18n}>
          <FilterDropdown title="R&D" options={OPTIONS} value={value} />
        </I18nextProvider>,
      );
    const triggerText = () => screen.getByRole("button").textContent;

    renderTranslated([]);
    expect(triggerText()).toBe("R&D (all)");
    cleanup();

    renderTranslated(["faulted"]);
    expect(triggerText()).toBe("R&D = Faulted");
    cleanup();

    renderTranslated(["running", "paused"]);
    expect(triggerText()).toBe("R&D x2");
  });

  it("reports opening and closing through onOpenChange", () => {
    const onOpenChange = vi.fn();
    renderDropdown({ onOpenChange });

    openDropdown();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("puts each option's value on its row, and none on the All row", () => {
    renderDropdown();
    openDropdown();

    const rows = screen.getAllByRole("option");
    expect(rows[0]?.dataset.value).toBeUndefined();
    expect(rows.slice(1).map((row) => row.dataset.value)).toEqual(
      OPTIONS.map((option) => option.value),
    );
  });

  it("names the listbox after the title and marks it multi-select", () => {
    renderDropdown();
    openDropdown();

    const listbox = screen.getByRole("listbox", { name: "Status" });
    expect(listbox.getAttribute("aria-multiselectable")).toBe("true");
  });

  it("moves focus between options with the arrow keys, Home and End", () => {
    renderDropdown();
    openDropdown();

    const listbox = screen.getByRole("listbox");
    const rows = screen.getAllByRole("option");
    rows[0]?.focus();

    fireEvent.keyDown(listbox, { key: "ArrowDown" });
    expect(document.activeElement).toBe(rows[1]);

    fireEvent.keyDown(listbox, { key: "End" });
    expect(document.activeElement).toBe(rows.at(-1));

    fireEvent.keyDown(listbox, { key: "ArrowDown" });
    expect(document.activeElement).toBe(rows.at(-1));

    fireEvent.keyDown(listbox, { key: "ArrowUp" });
    expect(document.activeElement).toBe(rows.at(-2));

    fireEvent.keyDown(listbox, { key: "Home" });
    expect(document.activeElement).toBe(rows[0]);
  });

  it("moves focus from the search input to the first option on ArrowDown", () => {
    renderDropdown({ enableSearch: true });
    openDropdown();

    fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getAllByRole("option")[0]);
  });

  it("adds triggerClassName to the trigger", () => {
    renderDropdown({ triggerClassName: "w-full" });
    expect(screen.getByRole("button").classList).toContain("w-full");
  });
});
