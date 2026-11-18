import { act, cleanup, render, screen } from "@testing-library/react";
import { createInstance, type i18n as I18n, type ReadCallback } from "i18next";
import { createElement } from "react";
import { I18nextProvider } from "react-i18next";
import { afterEach, describe, expect, it, vi } from "vitest";
import german from "../locales/de.json";
import {
  addVertexTranslations,
  hasVertexTranslations,
  loadVertexTranslations,
} from "./i18n";
import { useVertexTranslation, VERTEX_NAMESPACE } from "./vertex-translation";

async function freshInstance(): Promise<I18n> {
  const instance = createInstance();
  await instance.init({ lng: "en", fallbackLng: "en", resources: {} });
  return instance;
}

const ToggleThemeLabel = () => {
  const { t } = useVertexTranslation();
  return createElement("span", null, t("toggle_theme"));
};

afterEach(cleanup);

describe("addVertexTranslations", () => {
  it("adds the missing strings to a language that already has some, keeping them", async () => {
    const instance = await freshInstance();
    instance.addResourceBundle("en", VERTEX_NAMESPACE, {
      sign_out: "Log off",
    });

    await addVertexTranslations(instance);

    expect(instance.t("sign_out", { ns: VERTEX_NAMESPACE })).toBe("Log off");
    expect(instance.t("toggle_theme", { ns: VERTEX_NAMESPACE })).toBe(
      "Toggle theme",
    );
  });

  it("re-renders a mounted component when registering fills the language it shows", async () => {
    const instance = await freshInstance();
    instance.addResourceBundle("en", VERTEX_NAMESPACE, {
      sign_out: "Sign out",
    });
    const changed = vi.fn();
    instance.on("languageChanged", changed);
    render(
      createElement(
        I18nextProvider,
        { i18n: instance },
        createElement(ToggleThemeLabel),
      ),
    );
    expect(screen.getByText("toggle_theme")).toBeDefined();

    await act(async () => {
      await addVertexTranslations(instance);
    });

    expect(screen.getByText("Toggle theme")).toBeDefined();
    expect(changed).not.toHaveBeenCalled();
  });

  it("gives a new `t` when the strings land, so memoized translations re-run", async () => {
    const instance = await freshInstance();
    instance.addResourceBundle("en", VERTEX_NAMESPACE, {
      sign_out: "Sign out",
    });
    const translators: unknown[] = [];
    const RecordingLabel = () => {
      const { t } = useVertexTranslation();
      translators.push(t);
      return createElement("span", null, t("toggle_theme"));
    };
    render(
      createElement(
        I18nextProvider,
        { i18n: instance },
        createElement(RecordingLabel),
      ),
    );

    await act(async () => {
      await addVertexTranslations(instance);
    });

    expect(screen.getByText("Toggle theme")).toBeDefined();
    expect(translators.at(-1)).not.toBe(translators[0]);
  });

  it("re-renders a mounted component once it fills an empty bundle after a switch", async () => {
    const instance = await freshInstance();
    await addVertexTranslations(instance);
    instance.addResourceBundle("de", VERTEX_NAMESPACE, {});
    render(
      createElement(
        I18nextProvider,
        { i18n: instance },
        createElement(ToggleThemeLabel),
      ),
    );

    await act(async () => {
      await instance.changeLanguage("de");
    });

    expect(await screen.findByText("Design umschalten")).toBeDefined();
  });

  it("re-renders a mounted component when the app removes the bundle it shows", async () => {
    const instance = await freshInstance();
    await addVertexTranslations(instance);
    await instance.changeLanguage("de");
    await vi.waitFor(() =>
      expect(instance.t("toggle_theme", { ns: VERTEX_NAMESPACE })).toBe(
        "Design umschalten",
      ),
    );
    render(
      createElement(
        I18nextProvider,
        { i18n: instance },
        createElement(ToggleThemeLabel),
      ),
    );

    act(() => {
      instance.removeResourceBundle("de", VERTEX_NAMESPACE);
    });

    expect(screen.getByText("Toggle theme")).toBeDefined();
  });

  it("adds a newer copy's keys to an older copy's language on a switch, keeping its strings", async () => {
    const instance = await freshInstance();
    const olderGerman = {
      ...Object.fromEntries(
        Object.entries(german).filter(([key]) => key !== "toggle_theme"),
      ),
      sign_out: "Abmeldung",
    };
    instance.on("languageChanged", (language: string) => {
      if (instance.hasResourceBundle(language, VERTEX_NAMESPACE)) return;
      if (language === "de") {
        instance.addResourceBundle("de", VERTEX_NAMESPACE, olderGerman);
      }
    });
    await addVertexTranslations(instance);
    const added = vi.fn<(language: string, namespace: string) => void>();
    instance.store.on("added", added);

    await instance.changeLanguage("de");

    await vi.waitFor(() =>
      expect(instance.t("toggle_theme", { ns: VERTEX_NAMESPACE })).toBe(
        "Design umschalten",
      ),
    );
    expect(instance.t("sign_out", { ns: VERTEX_NAMESPACE })).toBe("Abmeldung");
    expect(
      added.mock.calls.filter(
        ([language, namespace]) =>
          language === "de" && namespace === VERTEX_NAMESPACE,
      ),
    ).toHaveLength(2);
  });

  it("lets a slower language switch finish when strings land meanwhile", async () => {
    const instance = createInstance();
    await instance
      .use({
        type: "backend",
        read(_language: string, _namespace: string, callback: ReadCallback) {
          setTimeout(() => {
            callback(null, {});
          }, 50);
        },
      })
      .init({ lng: "en", fallbackLng: "en" });
    await addVertexTranslations(instance);
    let switched = false;
    instance.on("languageChanged", (language: string) => {
      if (language !== "de" || switched) return;
      switched = true;
      void instance.changeLanguage("fr");
    });

    await instance.changeLanguage("de");

    await vi.waitFor(() => expect(instance.language).toBe("fr"));
  });

  it("adds the strings again when the app replaces a language's bundle", async () => {
    const instance = await freshInstance();
    await addVertexTranslations(instance);
    await instance.changeLanguage("de");
    await vi.waitFor(() =>
      expect(instance.t("sign_out", { ns: VERTEX_NAMESPACE })).toBe("Abmelden"),
    );

    instance.removeResourceBundle("de", VERTEX_NAMESPACE);
    instance.addResourceBundle("de", VERTEX_NAMESPACE, {
      sign_out: "Abmeldung",
    });
    await instance.changeLanguage("en");
    await instance.changeLanguage("de");

    await vi.waitFor(() =>
      expect(instance.t("toggle_theme", { ns: VERTEX_NAMESPACE })).toBe(
        "Design umschalten",
      ),
    );
    expect(instance.t("sign_out", { ns: VERTEX_NAMESPACE })).toBe("Abmeldung");
  });

  it("settles when the app re-selects the language on every store addition", async () => {
    const instance = await freshInstance();
    vi.resetModules();
    const firstCopy = await import("./i18n");
    vi.resetModules();
    const secondCopy = await import("./i18n");
    await firstCopy.addVertexTranslations(instance);
    await firstCopy.addVertexTranslations(instance);
    await secondCopy.addVertexTranslations(instance);
    instance.store.on("added", () => {
      void instance.changeLanguage(instance.language);
    });
    const changeLanguage = vi.spyOn(instance, "changeLanguage");

    await instance.changeLanguage("de");

    await vi.waitFor(() =>
      expect(instance.t("sign_out", { ns: VERTEX_NAMESPACE })).toBe("Abmelden"),
    );
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(changeLanguage).toHaveBeenCalledTimes(2);
  });
});

describe("loadVertexTranslations", () => {
  it("loads again after a failed load", async () => {
    const instance = await freshInstance();
    vi.spyOn(instance, "addResourceBundle").mockImplementationOnce(() => {
      throw new Error("offline");
    });

    const off = vi.spyOn(instance, "off");

    await expect(loadVertexTranslations(instance)).rejects.toThrow("offline");
    await loadVertexTranslations(instance);

    expect(hasVertexTranslations(instance)).toBe(true);
    expect(off).toHaveBeenCalledWith("languageChanged", expect.any(Function));
  });
});
