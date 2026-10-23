import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { Home } from "lucide-react";
import type { ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ApolloShell } from "./shell";
import { AuthContext, type AuthContextValue } from "./shell-auth-provider";
import { ThemeProvider } from "./shell-theme-provider";

afterEach(cleanup);

beforeAll(() => {
  // jsdom has no matchMedia; the sidebar reads it to detect mobile.
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

const signedOut: AuthContextValue = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: () => Promise.resolve(),
  logout: vi.fn(),
  accessToken: null,
};

const configureI18n = () => Promise.resolve();

function renderShell(
  auth: AuthContextValue,
  props: { unauthenticatedElement?: ReactNode } = {},
) {
  // The shell layout renders router links, so mount it as a route.
  const rootRoute = createRootRoute({
    component: () => (
      <ThemeProvider>
        <AuthContext.Provider value={auth}>
          <ApolloShell
            companyName="UiPath"
            productName="Invoices"
            navItems={[{ path: "/", label: "dashboard", icon: Home }]}
            configureI18n={configureI18n}
            {...props}
          >
            <p>{"app content"}</p>
          </ApolloShell>
        </AuthContext.Provider>
      </ThemeProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("ApolloShell auth gate", () => {
  it("shows the sign-in screen while signed out", async () => {
    renderShell(signedOut);

    expect(await screen.findByRole("button")).toBeDefined();
    expect(screen.queryByText("app content")).toBeNull();
  });

  it("renders unauthenticatedElement instead of the sign-in screen", async () => {
    renderShell(signedOut, {
      unauthenticatedElement: <p>{"redirecting"}</p>,
    });

    expect(await screen.findByText("redirecting")).toBeDefined();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders the app for a session without an access token", async () => {
    renderShell({
      ...signedOut,
      isAuthenticated: true,
      user: { name: "Ada Lovelace", email: "ada@example.com", sub: "ada" },
    });

    expect(await screen.findByText("app content")).toBeDefined();
    expect(screen.getByText("ada@example.com")).toBeDefined();
  });

  it("does not show the sign-in screen while loading", async () => {
    renderShell(
      { ...signedOut, isLoading: true },
      { unauthenticatedElement: <p>{"redirecting"}</p> },
    );

    // Let LocaleProvider finish configuring before asserting.
    await Promise.resolve();
    expect(screen.queryByText("redirecting")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
