"use client";

import { useLocalStorage } from "@mantine/hooks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LogIn, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ShellAuthProvider,
  useAuth,
} from "@/registry/shell/shell-auth-provider";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";
import {
  AICHAT_CLIENT_ID,
  AICHAT_SCOPE,
} from "@/templates/ai-chat/ai-chat-example-utils";
import { BASE_URL, DEFAULT_SOURCE_TYPE, STORAGE_KEY } from "./constants";
import { TestInsightsAdapterCharts } from "./test-insights-adapter-charts";

interface InsightsConfig {
  sourceType: string;
}

const initialConfig: InsightsConfig = {
  sourceType: DEFAULT_SOURCE_TYPE,
};

function TestInsightsLoginGate({
  children,
}: {
  children: (accessToken: string) => React.ReactNode;
}) {
  const { isAuthenticated, isLoading, login, logout, user, accessToken } =
    useAuth();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Signing in…</p>;
  }

  if (!isAuthenticated || !accessToken) {
    return (
      <div className="flex flex-col items-start gap-3 border rounded-md p-4 bg-card">
        <p className="text-sm text-muted-foreground">
          Sign in to UiPath to load Insights data.
        </p>
        <Button onClick={() => void login()}>
          <LogIn className="size-4 mr-2" />
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
        {user?.name && <span>{user.name}</span>}
        <Button variant="outline" size="sm" onClick={() => logout()}>
          <LogOut className="size-4 mr-2" />
          Sign out
        </Button>
      </div>
      {children(accessToken)}
    </div>
  );
}

function TestInsightsAdapterInner({ accessToken }: { accessToken: string }) {
  const [config, setConfig] = useLocalStorage<InsightsConfig>({
    key: STORAGE_KEY,
    defaultValue: initialConfig,
    getInitialValueInEffect: true,
  });
  const [activeConfig, setActiveConfig] = useState<InsightsConfig | null>(null);

  const isReady = !!activeConfig?.sourceType;

  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex flex-col gap-4 border rounded-md p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setActiveConfig({ ...config });
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Source type</span>
          <input
            type="text"
            className="border rounded px-2 py-1"
            value={config.sourceType}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, sourceType: e.target.value }))
            }
            placeholder="AO"
          />
        </label>
        <div>
          <Button type="submit">Load charts</Button>
        </div>
      </form>

      {isReady && activeConfig ? (
        <TestInsightsAdapterCharts
          key={`${activeConfig.sourceType}|${accessToken}`}
          baseUrl={BASE_URL}
          accessToken={accessToken}
          sourceType={activeConfig.sourceType}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Fill in the fields and click <strong>Load charts</strong>.
        </p>
      )}
    </div>
  );
}

export default function TestInsightsAdapterPage() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">Test: Insights Adapter</h1>
        <p className="text-sm text-muted-foreground">
          Internal test page — delete this folder when finished.
        </p>
      </header>

      <QueryClientProvider client={queryClient}>
        <ShellAuthProvider
          clientId={AICHAT_CLIENT_ID}
          scope={AICHAT_SCOPE}
          baseUrl=""
          redirectPath="/auth_callback"
        >
          <LocaleProvider>
            <TestInsightsLoginGate>
              {(accessToken) => (
                <TestInsightsAdapterInner accessToken={accessToken} />
              )}
            </TestInsightsLoginGate>
          </LocaleProvider>
        </ShellAuthProvider>
      </QueryClientProvider>
    </div>
  );
}
