"use client";

import dynamic from "next/dynamic";

export const GroupMembershipGuardTemplate = dynamic(
  () =>
    import("./GroupMembershipGuardTemplate").then((mod) => ({
      default: mod.GroupMembershipGuardTemplate,
    })),
  { ssr: false },
);
