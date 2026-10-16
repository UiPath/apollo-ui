import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./command";

vi.stubGlobal(
  "ResizeObserver",
  class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  },
);

Element.prototype.scrollIntoView = vi.fn();

afterEach(cleanup);

function renderCommand({
  search,
  alwaysRender,
}: {
  search?: string;
  alwaysRender?: boolean;
} = {}) {
  return render(
    <Command>
      <CommandInput value={search} onValueChange={vi.fn()} />
      <CommandList>
        <CommandGroup heading="Suggestions">
          <CommandItem>{"Calendar"}</CommandItem>
        </CommandGroup>
        <CommandSeparator alwaysRender={alwaysRender} />
        <CommandGroup heading="Settings">
          <CommandItem>{"Profile"}</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>,
  );
}

describe("CommandSeparator", () => {
  it("renders inside the listbox without the separator role", () => {
    const { container, getByRole } = renderCommand();

    const separator = container.querySelector(
      '[data-slot="command-separator"]',
    );

    expect(separator).not.toBeNull();
    expect(separator?.getAttribute("role")).toBe("none");
    expect(getByRole("listbox").contains(separator)).toBe(true);
    expect(container.querySelector('[role="separator"]')).toBeNull();
  });

  it("is hidden while searching", () => {
    const { container } = renderCommand({ search: "cal" });

    expect(
      container.querySelector('[data-slot="command-separator"]'),
    ).toBeNull();
  });

  it("stays visible while searching when alwaysRender is set", () => {
    const { container } = renderCommand({ search: "cal", alwaysRender: true });

    expect(
      container.querySelector('[data-slot="command-separator"]'),
    ).not.toBeNull();
  });
});
