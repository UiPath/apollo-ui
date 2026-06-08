"use client";

import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  parseUserMessages,
  worstSeverity,
  severityIcons,
  severityColors,
  categoryBorderStyles,
} from "./user-messages";

export const UserMessagesView = ({ messages }: { messages: unknown }) => {
  const { t } = useTranslation();
  const parsed = parseUserMessages(messages);
  if (parsed.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {parsed.map((msg) => {
        // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- runtime message key isn't in the typed i18n catalog
        const translated = t(msg.key as never, msg.details);
        const displayText = translated === msg.key ? msg.message : translated;

        return (
          <div
            key={`${msg.key}-${msg.timestamp}`}
            className={`rounded-md border-l-4 p-3 text-sm ${categoryBorderStyles[msg.category] ?? "bg-muted/50"}`}
          >
            {displayText}
          </div>
        );
      })}
    </div>
  );
};

export const UserMessagesIcon = ({ messages }: { messages: unknown }) => {
  const { t } = useTranslation();
  const parsed = parseUserMessages(messages);
  const severity = worstSeverity(parsed);
  if (!severity) return null;

  const Icon = severityIcons[severity];
  const colorClass = severityColors[severity];

  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        aria-label={t("view_messages")}
        className="inline-flex items-center"
      >
        <Icon className={`size-3.5 ${colorClass}`} />
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-sm">
        <div className="flex flex-col gap-1.5">
          {parsed.map((msg) => {
            // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- runtime message key isn't in the typed i18n catalog
            const translated = t(msg.key as never, msg.details);
            const displayText =
              translated === msg.key ? msg.message : translated;
            const MIcon = severityIcons[msg.category] ?? Info;
            return (
              <div
                key={`${msg.key}-${msg.timestamp}`}
                className="flex items-start gap-1.5"
              >
                <MIcon
                  className={`mt-0.5 size-3 shrink-0 ${severityColors[msg.category] ?? ""}`}
                />
                <span className="text-xs">{displayText}</span>
              </div>
            );
          })}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
