"use client";

import { useState } from "react";
import { Button } from "@/registry/button/button";
import {
  MembershipDenied,
  VerifyingMembership,
} from "@/registry/shell/group-membership-screens";
import type { UserInfo } from "@/registry/shell/shell-auth-provider";

type DemoState = "loading" | "denied" | "granted";

const DEMO_USER: UserInfo = {
  name: "Alex Doe",
  email: "alex.doe@example.com",
  sub: "demo-user",
};

// oxlint-disable-next-line no-empty-function
const noop = () => {};

export function GroupMembershipGuardTemplate() {
  const [state, setState] = useState<DemoState>("denied");

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-2 p-3 border-b border-border bg-muted/30">
        {(["loading", "denied", "granted"] as const).map((option) => (
          <Button
            key={option}
            size="sm"
            variant={state === option ? "default" : "outline"}
            onClick={() => setState(option)}
          >
            {option}
          </Button>
        ))}
      </div>
      <div className="flex-1 relative" key={state}>
        {state === "loading" && <VerifyingMembership />}
        {state === "denied" && (
          <MembershipDenied user={DEMO_USER} onLogout={noop} />
        )}
        {state === "granted" && (
          <div className="flex h-full items-center justify-center bg-background">
            <p className="text-muted-foreground">
              Your application content renders here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
