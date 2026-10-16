import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_STORAGE_KEY } from "@/registry/shell/shell-constants";
import { ThemeProvider, useTheme } from "@/registry/shell/shell-theme-provider";

import { Toaster } from "./sonner";

vi.mock("sonner", () => ({
  Toaster: ({ theme }: { theme?: string }) => (
    <div data-testid="sonner" data-theme={theme} />
  ),
}));

const darkLabel = "use dark";

function installMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: () => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
}

function ThemeToggle() {
  const { setTheme } = useTheme();
  return (
    <button type="button" onClick={() => setTheme("dark")}>
      {darkLabel}
    </button>
  );
}

describe("Toaster", () => {
  beforeEach(() => {
    installMatchMedia(false);
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("passes the shell resolved theme to Sonner", () => {
    const { getByRole, getByTestId } = render(
      <ThemeProvider>
        <ThemeToggle />
        <Toaster />
      </ThemeProvider>,
    );

    expect(getByTestId("sonner").dataset.theme).toBe("light");

    fireEvent.click(getByRole("button", { name: darkLabel }));

    expect(getByTestId("sonner").dataset.theme).toBe("dark");
  });

  it("resolves a system shell theme to light or dark", () => {
    installMatchMedia(true);
    localStorage.setItem(THEME_STORAGE_KEY, "system");

    const { getByTestId } = render(
      <ThemeProvider>
        <Toaster />
      </ThemeProvider>,
    );

    expect(getByTestId("sonner").dataset.theme).toBe("dark");
  });
});
