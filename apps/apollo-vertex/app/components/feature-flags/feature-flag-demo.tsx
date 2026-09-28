"use client";

import { useRef, useState } from "react";
import type { FeatureFlagProviderConfig } from "@/lib/feature-flag-provider/types";
import { FeatureFlagProvider } from "@/lib/feature-flag-provider";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { FeatureFlagGuard } from "@/registry/feature-flag-guard/feature-flag-guard";
import { Badge } from "@/registry/badge/badge";
import { Switch } from "@/registry/switch/switch";
import { Label } from "@/registry/label/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/card/card";
import { Separator } from "@/registry/separator/separator";

// ---------------------------------------------------------------------------
// Static in-memory provider for demo purposes
// ---------------------------------------------------------------------------

type Listener = (value: boolean) => void;

function createDemoProvider(
  initialFlags: Record<string, boolean>,
): FeatureFlagProviderConfig & {
  setFlag: (key: string, value: boolean) => void;
} {
  const flags = { ...initialFlags };
  const listeners = new Map<string, Set<Listener>>();

  return {
    getFeatureFlagValue: (key) => flags[key] ?? false,
    on: (event, cb) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)?.add(cb);
    },
    off: (event, cb) => {
      listeners.get(event)?.delete(cb);
    },
    initialize: () => Promise.resolve(),
    setFlag: (key, value) => {
      const old = flags[key];
      flags[key] = value;
      if (old !== value) {
        listeners.get(key)?.forEach((cb) => cb(value));
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Demo sub-components
// ---------------------------------------------------------------------------

function FlagStatus({ flag, label }: { flag: string; label: string }) {
  const value = useFeatureFlag(flag);
  return (
    <div className="flex items-center gap-2">
      <Badge variant={value ? "default" : "outline"}>
        {value ? "ON" : "OFF"}
      </Badge>
      <span className="text-sm">{label}</span>
    </div>
  );
}

function NewDashboardPreview() {
  const isEnabled = useFeatureFlag("NewDashboard");
  return (
    <div className="rounded-lg border p-4 transition-colors">
      <p className="text-sm font-medium">
        Dashboard: {isEnabled ? "v2 (redesigned)" : "v1 (classic)"}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        This preview reacts to the NewDashboard flag in real time.
      </p>
    </div>
  );
}

function GuardDemo() {
  return (
    <FeatureFlagGuard
      featureFlag="NewOnboarding"
      fallback={
        <p className="text-sm text-muted-foreground italic">
          New onboarding is disabled — enable it above to reveal the content.
        </p>
      }
    >
      <div className="rounded-lg border border-dashed border-green-500 bg-green-50 dark:bg-green-950 p-4">
        <p className="text-sm font-medium text-green-700 dark:text-green-300">
          New Onboarding Experience
        </p>
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          This content is only visible when the &quot;NewOnboarding&quot; flag
          is enabled.
        </p>
      </div>
    </FeatureFlagGuard>
  );
}

function RouteGuardDemo() {
  const isBeta = useFeatureFlag("BetaApi");
  return (
    <div className="rounded-lg border p-4">
      {isBeta ? (
        <div className="text-sm">
          <p className="font-medium text-green-700 dark:text-green-300">
            Route accessible
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ProtectedFeatureRoute would render children normally.
          </p>
        </div>
      ) : (
        <div className="text-sm">
          <p className="font-medium text-destructive">Route blocked</p>
          <p className="text-xs text-muted-foreground mt-1">
            ProtectedFeatureRoute would throw:{" "}
            <code className="text-xs">
              Feature &quot;BetaApi&quot; is disabled for your account.
            </code>
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main demo
// ---------------------------------------------------------------------------

const INITIAL_FLAGS: Record<string, boolean> = {
  NewDashboard: false,
  NewOnboarding: true,
  BetaApi: false,
};

export function FeatureFlagDemo() {
  const providerRef = useRef(createDemoProvider(INITIAL_FLAGS));
  const [flags, setFlags] = useState(INITIAL_FLAGS);

  function toggle(key: string) {
    setFlags((prev) => {
      const next = !prev[key];
      providerRef.current.setFlag(key, next);
      return { ...prev, [key]: next };
    });
  }

  const provider = providerRef.current;

  return (
    <FeatureFlagProvider provider={provider}>
      <div className="space-y-6">
        {/* Control panel */}
        <Card className="py-6">
          <CardHeader>
            <CardTitle className="text-base">Flag Control Panel</CardTitle>
            <CardDescription>
              Toggle flags to see components react in real time.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {Object.entries(flags).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={key} className="cursor-pointer">
                  {key}
                </Label>
                <Switch
                  id={key}
                  checked={value}
                  onCheckedChange={() => toggle(key)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Separator />

        {/* useFeatureFlag demo */}
        <Card className="py-6">
          <CardHeader>
            <CardTitle className="text-base">useFeatureFlag</CardTitle>
            <CardDescription>
              Hook reads flag values and re-renders when they change.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <FlagStatus flag="NewDashboard" label="NewDashboard" />
            <FlagStatus flag="NewOnboarding" label="NewOnboarding" />
            <FlagStatus flag="BetaApi" label="BetaApi" />
            <Separator className="my-3" />
            <NewDashboardPreview />
          </CardContent>
        </Card>

        {/* FeatureFlagGuard demo */}
        <Card className="py-6">
          <CardHeader>
            <CardTitle className="text-base">FeatureFlagGuard</CardTitle>
            <CardDescription>
              Conditionally renders children based on &quot;NewOnboarding&quot;
              flag.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <GuardDemo />
          </CardContent>
        </Card>

        {/* ProtectedFeatureRoute demo */}
        <Card className="py-6">
          <CardHeader>
            <CardTitle className="text-base">ProtectedFeatureRoute</CardTitle>
            <CardDescription>
              Simulates route-level guard behavior for the &quot;BetaApi&quot;
              flag.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <RouteGuardDemo />
          </CardContent>
        </Card>
      </div>
    </FeatureFlagProvider>
  );
}
