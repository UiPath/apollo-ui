"use client";

import { ArrowDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface AiChatScrollToBottomButtonProps {
  onClick: () => void;
}

export function AiChatScrollToBottomButton({
  onClick,
}: AiChatScrollToBottomButtonProps) {
  const { t } = useTranslation();
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      onClick={onClick}
      aria-label={t("scroll_to_bottom")}
      className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 size-8 rounded-full border-ai-chat-border bg-ai-chat shadow-md hover:bg-ai-chat-muted"
    >
      <ArrowDown className="size-4" />
    </Button>
  );
}
