"use client";

import dynamic from "next/dynamic";
import { WorkspaceSettings } from "./WorkspaceSettings";

function SettingsTemplateContent() {
  return (
    <div className="h-full bg-background dark:bg-sidebar overflow-y-auto custom-scrollbar">
      <WorkspaceSettings />
    </div>
  );
}

export const SettingsTemplate = dynamic(
  () => Promise.resolve(SettingsTemplateContent),
  { ssr: false },
);
