import { act, cleanup, render, screen } from "@testing-library/react";
import i18next, {
  createInstance,
  type i18n as I18n,
  type ReadCallback,
} from "i18next";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  getI18n,
  I18nextProvider,
  initReactI18next,
  setI18n,
} from "react-i18next";
import { afterEach, describe, expect, it, vi } from "vitest";
import { addVertexTranslations, configurei18n } from "@/lib/i18n";
import { VERTEX_NAMESPACE } from "@/lib/vertex-translation";
import { LocaleProvider } from "./shell-locale-provider";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const neverConfigured = () => new Promise<void>(vi.fn());

async function initialisedInstance(lng = "en"): Promise<I18n> {
  const instance = createInstance();
  await instance
    .use(initReactI18next)
    .init({ lng, resources: { [lng]: { [VERTEX_NAMESPACE]: {} } } });
  return instance;
}

function renderProvider(contextInstance?: I18n) {
  const provider = (
    <LocaleProvider
      configureI18n={neverConfigured}
      loadingElement={<p>{"loading"}</p>}
    >
      <p>{"app content"}</p>
    </LocaleProvider>
  );
  render(
    contextInstance ? (
      <I18nextProvider i18n={contextInstance}>{provider}</I18nextProvider>
    ) : (
      provider
    ),
  );
}

describe("LocaleProvider", () => {
  it("renders its children on the first render when i18n already has the Vertex strings", async () => {
    setI18n(await initialisedInstance());

    renderProvider();

    expect(screen.getByText("app content")).toBeDefined();
    expect(screen.queryByText("loading")).toBeNull();
  });

  it("shows the loading element until i18n is configured", () => {
    setI18n(createInstance());

    renderProvider();

    expect(screen.getByText("loading")).toBeDefined();
    expect(screen.queryByText("app content")).toBeNull();
  });

  it("renders its children once the app initialises i18n after it mounts", async () => {
    const appInstance = createInstance();
    setI18n(appInstance);
    renderProvider();
    expect(screen.getByText("loading")).toBeDefined();

    await act(async () => {
      await appInstance.init({
        lng: "en",
        resources: { en: { [VERTEX_NAMESPACE]: {} } },
      });
    });

    expect(screen.getByText("app content")).toBeDefined();
  });

  it("keeps the loading element until the Vertex strings arrive after init", async () => {
    const appInstance = createInstance();
    setI18n(appInstance);
    renderProvider();

    await act(async () => {
      await appInstance.init({ lng: "en", resources: {} });
    });
    expect(screen.getByText("loading")).toBeDefined();

    await act(async () => {
      await addVertexTranslations(appInstance);
    });

    expect(screen.getByText("app content")).toBeDefined();
  });

  it("keeps the loading element while only the fallback language has the Vertex strings", async () => {
    const appInstance = createInstance();
    await appInstance.init({ lng: "de", fallbackLng: "en", resources: {} });
    setI18n(appInstance);
    renderProvider();

    act(() => {
      appInstance.addResourceBundle("en", VERTEX_NAMESPACE, {});
    });
    expect(screen.getByText("loading")).toBeDefined();

    act(() => {
      appInstance.addResourceBundle("de", VERTEX_NAMESPACE, {});
    });

    expect(screen.getByText("app content")).toBeDefined();
  });

  it("waits for an app instance that is still initialising, keeping it registered", async () => {
    const appInstance = createInstance();
    const initialising = appInstance
      .use({
        type: "backend",
        read(_language: string, _namespace: string, callback: ReadCallback) {
          setTimeout(() => {
            callback(null, {});
          }, 50);
        },
      })
      .use(initReactI18next)
      .init({ lng: "en" });
    render(
      <LocaleProvider loadingElement={<p>{"loading"}</p>}>
        <p>{"app content"}</p>
      </LocaleProvider>,
    );

    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 10);
      });
    });
    expect(screen.getByText("loading")).toBeDefined();

    await act(async () => {
      await initialising;
    });

    expect(await screen.findByText("app content")).toBeDefined();
    expect(getI18n()).toBe(appInstance);
  });

  it("hydrates the server's loading element when i18n is initialised before hydration", async () => {
    const appInstance = createInstance();
    setI18n(appInstance);
    const provider = (
      <LocaleProvider
        configureI18n={neverConfigured}
        loadingElement={<p>{"loading"}</p>}
      >
        <p>{"app content"}</p>
      </LocaleProvider>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(provider);
    await appInstance.init({
      lng: "en",
      resources: { en: { [VERTEX_NAMESPACE]: {} } },
    });
    const onRecoverableError = vi.fn();

    let root: Root | undefined;
    act(() => {
      root = hydrateRoot(container, provider, { onRecoverableError });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.textContent).toBe("app content");
    act(() => {
      root?.unmount();
    });
  });

  it("goes by the I18nextProvider instance when it is ready and the global one isn't", async () => {
    const contextInstance = await initialisedInstance();
    setI18n(createInstance());

    renderProvider(contextInstance);

    expect(screen.getByText("app content")).toBeDefined();
  });

  it("goes by the I18nextProvider instance when it isn't ready and the global one is", async () => {
    setI18n(await initialisedInstance());

    renderProvider(createInstance());

    expect(screen.getByText("loading")).toBeDefined();
  });
});

describe("configurei18n", () => {
  it("leaves an app's own initialised instance registered", async () => {
    const appInstance = await initialisedInstance();
    setI18n(appInstance);

    await configurei18n();

    expect(getI18n()).toBe(appInstance);
  });

  it("adds the Vertex strings to an app's own initialised instance", async () => {
    const appInstance = createInstance();
    await appInstance.use(initReactI18next).init({ lng: "en", resources: {} });

    await configurei18n();

    expect(appInstance.t("sign_out", { ns: VERTEX_NAMESPACE })).toBe(
      "Sign out",
    );
  });

  it("does not initialise again once it has", async () => {
    setI18n(createInstance());
    await configurei18n();
    const init = vi.spyOn(i18next, "init");

    await configurei18n();

    expect(init).not.toHaveBeenCalled();
  });

  it("sets the document language from an instance that is already initialised", async () => {
    setI18n(await initialisedInstance("fr"));
    document.documentElement.lang = "en";

    await configurei18n();

    expect(document.documentElement.lang).toBe("fr");
  });
});
