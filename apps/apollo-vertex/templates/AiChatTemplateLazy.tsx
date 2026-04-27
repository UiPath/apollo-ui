"use client";

import dynamic from "next/dynamic";

const AiChatTemplate = dynamic(
  () => import("./AiChatTemplate").then((m) => m.AiChatTemplate),
  { ssr: false },
);

export function AiChatTemplateLazy() {
  return <AiChatTemplate />;
}
