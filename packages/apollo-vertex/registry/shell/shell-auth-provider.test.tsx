import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ensureValidToken } from "@/lib/auth";
import { ShellAuthProvider, useAuth } from "./shell-auth-provider";

vi.mock("@/lib/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth")>()),
  ensureValidToken: vi.fn(),
}));

afterEach(cleanup);

function AuthState() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return <p>{isAuthenticated ? "signed in" : "signed out"}</p>;
}

describe("ShellAuthProvider", () => {
  it("treats an empty stored token as signed out", async () => {
    vi.mocked(ensureValidToken).mockResolvedValue("");

    render(
      <QueryClientProvider client={new QueryClient()}>
        <ShellAuthProvider
          clientId="client"
          scope="openid"
          baseUrl="https://cloud.example.com"
        >
          <AuthState />
        </ShellAuthProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("signed out")).toBeDefined();
  });
});
