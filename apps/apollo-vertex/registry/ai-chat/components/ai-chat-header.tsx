"use client";

import { useClipboard } from "@mantine/hooks";
import { MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AutopilotGradientIcon } from "./icons/autopilot-gradient";

interface AiChatHeaderProps {
  title: string;
  hasMessages: boolean;
  conversationText: string;
  onClearChat?: () => void;
}

export function AiChatHeader({
  title,
  hasMessages,
  conversationText,
  onClearChat,
}: AiChatHeaderProps) {
  const { t } = useTranslation();
  const { copied, error, copy } = useClipboard({ timeout: 2000 });

  const copyLabel = copied
    ? t("copied")
    : error
      ? t("copy_conversation_failed")
      : t("copy_conversation");

  return (
    <div className="relative z-10 py-3 px-4 flex items-center justify-between gap-2 bg-background">
      <div className="flex items-center gap-1.5 min-w-0">
        <AutopilotGradientIcon
          size={21}
          className="shrink-0"
          aria-hidden="true"
        />
        <span className="text-sm font-bold tracking-tight bg-clip-text text-transparent truncate pt-0.5 [background-image:var(--ai-chat-brand-gradient)]">
          {title}
        </span>
      </div>
      {hasMessages && (
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="hover:bg-ai-chat-muted shrink-0"
                aria-label={t("more_options")}
              >
                <MoreHorizontal
                  className="size-4 text-ai-chat-muted-foreground"
                  aria-hidden="true"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => copy(conversationText)}>
                {copyLabel}
              </DropdownMenuItem>
              {onClearChat && (
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem>{t("new_conversation")}</DropdownMenuItem>
                </AlertDialogTrigger>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("new_conversation_confirm_title")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("new_conversation_confirm_description")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={() => onClearChat?.()}>
                {t("new_conversation")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
