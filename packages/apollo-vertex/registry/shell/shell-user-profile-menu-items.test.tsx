import { cleanup, render, screen } from "@testing-library/react";
import { createInstance } from "i18next";
import { initReactI18next, setI18n } from "react-i18next";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  DropdownMenu,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import type { SupportedLocale } from "@/lib/i18n";
import { VERTEX_NAMESPACE } from "@/lib/vertex-translation";
import { LocaleProvider } from "./shell-locale-provider";
import { ThemeProvider } from "./shell-theme-provider";
import { UserProfileMenuItems } from "./shell-user-profile-menu-items";

afterEach(cleanup);

beforeAll(async () => {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: () => false,
    }) satisfies MediaQueryList;
  const instance = createInstance();
  await instance
    .use(initReactI18next)
    .init({ lng: "en", resources: { en: { [VERTEX_NAMESPACE]: {} } } });
  setI18n(instance);
});

const ready = () => Promise.resolve();

function renderMenu(locales?: readonly SupportedLocale[]) {
  render(
    <ThemeProvider>
      <LocaleProvider configureI18n={ready} locales={locales}>
        <LocaleProvider configureI18n={ready}>
          <DropdownMenu open>
            <DropdownMenuContent>
              <UserProfileMenuItems />
            </DropdownMenuContent>
          </DropdownMenu>
        </LocaleProvider>
      </LocaleProvider>
    </ThemeProvider>,
  );
}

describe("UserProfileMenuItems", () => {
  it("shows the language menu when the app sets no locales", () => {
    renderMenu();

    expect(screen.getByText("language")).toBeDefined();
  });

  it("hides the language menu when the app allows one locale, through a nested provider", () => {
    renderMenu(["en"]);

    expect(screen.queryByText("language")).toBeNull();
    expect(screen.getByText("sign_out")).toBeDefined();
  });

  it("keeps the current language in the menu when the app's locales leave it out", async () => {
    const instance = createInstance();
    await instance
      .use(initReactI18next)
      .init({ lng: "de", resources: { de: { [VERTEX_NAMESPACE]: {} } } });

    renderMenu(["en"]);

    expect(screen.getByText("language")).toBeDefined();
  });
});
