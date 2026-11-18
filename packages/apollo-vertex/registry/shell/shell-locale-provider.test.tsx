import { act, cleanup, render, screen } from "@testing-library/react";
import { createInstance } from "i18next";
import { type ReactNode, useContext, useLayoutEffect } from "react";
import { I18nContext, I18nextProvider } from "react-i18next";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { loadVertexTranslations, type SupportedLocale } from "@/lib/i18n";
import {
  useVertexTranslation,
  VERTEX_NAMESPACE,
} from "@/lib/vertex-translation";
import en from "../../locales/en.json";
import { LocaleProvider } from "./shell-locale-provider";
import { ThemeProvider } from "./shell-theme-provider";
import { UserProfileMenuItems } from "./shell-user-profile-menu-items";

afterEach(cleanup);

beforeAll(() => {
  // jsdom has no matchMedia; the theme provider reads it.
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
});

// React only retries a suspended render that started inside an async act.
const renderAsync = (ui: ReactNode) =>
  act(async () => {
    render(ui);
    await Promise.resolve();
  });

const createAppI18n = async (withVertexStrings: boolean) => {
  const i18n = createInstance();
  await i18n.init({
    lng: "en",
    fallbackLng: "en",
    resources: {
      en: {
        translation: { greeting: "Hello from the app" },
        ...(withVertexStrings ? { [VERTEX_NAMESPACE]: en } : {}),
      },
    },
  });
  return i18n;
};

function Strings() {
  const { t } = useVertexTranslation();
  const app = useContext(I18nContext)?.i18n;
  return (
    <p>{`${app?.t("greeting", { ns: "translation" })} ${t("language")}`}</p>
  );
}

describe("LocaleProvider", () => {
  it("renders on the first render when the app's instance has the Vertex strings", async () => {
    const i18n = await createAppI18n(true);

    render(
      <LocaleProvider i18n={i18n} loadingElement={<p>{"loading"}</p>}>
        <Strings />
      </LocaleProvider>,
    );

    expect(screen.queryByText("loading")).toBeNull();
    expect(screen.getByText("Hello from the app Language")).toBeDefined();
  });

  it("adds the Vertex strings to the app's instance and keeps its own", async () => {
    const i18n = await createAppI18n(false);

    await act(async () => {
      render(
        <LocaleProvider i18n={i18n}>
          <Strings />
        </LocaleProvider>,
      );
      await loadVertexTranslations(i18n);
    });

    expect(screen.getByText("Hello from the app Language")).toBeDefined();
  });

  it("shows the loading element until the app initialises i18next", async () => {
    const i18n = createInstance();

    await renderAsync(
      <LocaleProvider i18n={i18n} loadingElement={<p>{"loading"}</p>}>
        <Strings />
      </LocaleProvider>,
    );
    expect(screen.getByText("loading")).toBeDefined();

    await act(async () => {
      await i18n.init({
        lng: "en",
        resources: { en: { translation: { greeting: "Late app" } } },
      });
      await loadVertexTranslations(i18n);
    });

    expect(screen.queryByText("loading")).toBeNull();
    expect(screen.getByText("Late app Language")).toBeDefined();
  });

  it("uses the enclosing I18nextProvider's instance", async () => {
    const i18n = await createAppI18n(true);

    render(
      <I18nextProvider i18n={i18n}>
        <LocaleProvider>
          <Strings />
        </LocaleProvider>
      </I18nextProvider>,
    );

    expect(screen.getByText("Hello from the app Language")).toBeDefined();
  });

  it("keeps the enclosing I18nextProvider's default namespace", async () => {
    const i18n = await createAppI18n(true);
    let defaultNS: unknown;
    function ReadDefaultNS() {
      const context: object | undefined = useContext(I18nContext);
      defaultNS = context && "defaultNS" in context && context.defaultNS;
      return null;
    }

    render(
      <I18nextProvider i18n={i18n} defaultNS="app">
        <LocaleProvider>
          <ReadDefaultNS />
        </LocaleProvider>
      </I18nextProvider>,
    );

    expect(defaultNS).toBe("app");
  });

  it("loads the Vertex strings for a language a child switches to on mount", async () => {
    const i18n = await createAppI18n(true);
    function SwitchToGerman() {
      useLayoutEffect(() => {
        void i18n.changeLanguage("de");
      }, []);
      return null;
    }

    await renderAsync(
      <LocaleProvider i18n={i18n}>
        <SwitchToGerman />
        <Strings />
      </LocaleProvider>,
    );

    expect(await screen.findByText("Hello from the app Sprache")).toBeDefined();
  });

  it("changes the app's language once when the Vertex strings load later", async () => {
    const i18n = await createAppI18n(true);
    await loadVertexTranslations(i18n);
    const languageChanged = vi.fn();
    i18n.on("languageChanged", languageChanged);

    render(
      <LocaleProvider i18n={i18n}>
        <Strings />
      </LocaleProvider>,
    );
    await act(() => i18n.changeLanguage("de"));

    expect(await screen.findByText("Hello from the app Sprache")).toBeDefined();
    expect(languageChanged).toHaveBeenCalledTimes(1);
  });

  it("loads the Vertex strings for a new language and syncs the document language", async () => {
    const i18n = await createAppI18n(true);
    await loadVertexTranslations(i18n);

    render(
      <LocaleProvider i18n={i18n}>
        <Strings />
      </LocaleProvider>,
    );
    await act(() => i18n.changeLanguage("de"));

    expect(await screen.findByText("Hello from the app Sprache")).toBeDefined();
    expect(document.documentElement.lang).toBe("de");
  });
});

describe("language menu", () => {
  const renderMenu = async (
    outer?: SupportedLocale[],
    inner?: SupportedLocale[],
    language?: string,
  ) => {
    const i18n = await createAppI18n(true);
    if (language) await i18n.changeLanguage(language);
    await loadVertexTranslations(i18n);
    render(
      <ThemeProvider>
        <LocaleProvider i18n={i18n} locales={outer}>
          <LocaleProvider locales={inner}>
            <DropdownMenu open>
              <DropdownMenuTrigger>{"menu"}</DropdownMenuTrigger>
              <DropdownMenuContent>
                <UserProfileMenuItems />
              </DropdownMenuContent>
            </DropdownMenu>
          </LocaleProvider>
        </LocaleProvider>
      </ThemeProvider>,
    );
  };

  it("shows the Language menu by default", async () => {
    await renderMenu();
    expect(screen.getByText("Language")).toBeDefined();
  });

  it("hides it when an outer provider lists one locale", async () => {
    await renderMenu(["en"]);
    expect(screen.queryByText("Language")).toBeNull();
  });

  it("lets a nested provider set its own locales", async () => {
    await renderMenu(["en"], ["en", "de"]);
    expect(screen.getByText("Language")).toBeDefined();
  });

  it("offers a listed locale when the current language falls back to it", async () => {
    await renderMenu(["en"], ["en"], "it");
    expect(screen.getByText("Language")).toBeDefined();
  });

  it("keeps the current language when the app's locales leave it out", async () => {
    await renderMenu(["en"], ["en"], "de-DE");
    expect(screen.getByText("Sprache")).toBeDefined();
  });
});
