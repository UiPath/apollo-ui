import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { Home } from "lucide-react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ApolloShell, type ShellNavItem } from "./shell";
import { ThemeProvider } from "./shell-theme-provider";

afterEach(cleanup);

beforeAll(() => {
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

function renderSidebar(path: string, navItems: ShellNavItem[]) {
  const rootRoute = createRootRoute({
    component: () => (
      <ThemeProvider>
        <ApolloShell
          companyName="UiPath"
          productName="Invoices"
          navItems={navItems}
        >
          <p>{"app content"}</p>
        </ApolloShell>
      </ThemeProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("ShellSidebar highlighting", () => {
  it("highlights only the most specific item when a group's child prefixes it", async () => {
    renderSidebar("/invoices/rejected", [
      {
        path: "/work",
        label: "Work",
        icon: Home,
        subItems: [{ path: "/invoices", label: "Invoices" }],
      },
      { path: "/invoices/rejected", label: "Rejected", icon: Home },
    ]);

    const rejected = await screen.findByRole("link", { name: "Rejected" });
    const invoices = screen.getByRole("link", { name: "Invoices" });
    expect(rejected.dataset.active).toBe("true");
    expect(invoices.dataset.active).toBe("false");
  });

  it("highlights only the most specific child when two children of one group overlap", async () => {
    renderSidebar("/invoices/rejected/42", [
      {
        path: "/work",
        label: "Work",
        icon: Home,
        subItems: [
          { path: "/invoices", label: "Invoices" },
          { path: "/invoices/rejected", label: "Rejected" },
        ],
      },
    ]);

    const rejected = await screen.findByRole("link", { name: "Rejected" });
    const invoices = screen.getByRole("link", { name: "Invoices" });
    expect(rejected.dataset.active).toBe("true");
    expect(invoices.dataset.active).toBe("false");
  });

  it("keeps a group current when its own path beats a less specific child", async () => {
    renderSidebar("/acme/projects", [
      { path: "/acme", label: "Acme", icon: Home },
      {
        path: "/acme/projects",
        label: "Projects",
        icon: Home,
        subItems: [{ path: "/acme", label: "Overview" }],
      },
    ]);

    const projects = await screen.findByRole("link", { name: "Projects" });
    expect(screen.getByRole("link", { name: "Overview" }).dataset.active).toBe(
      "false",
    );
    expect(screen.getByRole("link", { name: "Acme" }).dataset.active).toBe(
      "false",
    );
    expect(projects.parentElement?.className).toContain("bg-primary-100/40");
  });

  it("highlights a child that shares its group's path, not the group", async () => {
    renderSidebar("/invoices", [
      {
        path: "/invoices",
        label: "Invoices",
        icon: Home,
        subItems: [
          { path: "/invoices", label: "All" },
          { path: "/invoices/rejected", label: "Rejected" },
        ],
      },
    ]);

    const all = await screen.findByRole("link", { name: "All" });
    const invoices = screen.getByRole("link", { name: "Invoices" });
    expect(all.dataset.active).toBe("true");
    expect(invoices.parentElement?.className).not.toContain(
      "bg-primary-100/40",
    );
  });
});
