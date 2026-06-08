import { PanelRightClose } from "lucide-react";
import { AiChat } from "@/registry/ai-chat/components/ai-chat";
import { AutopilotIcon } from "@/registry/ai-chat/components/icons/autopilot";
import { Button } from "@/components/ui/button";
import { useConversation } from "./conversation-context";
import { MatchCarousel, ReviewCta } from "./MatchCarousel";
import { RequestEnvelope } from "./RequestEnvelope";

interface ChatRailProps {
  onCollapse: () => void;
}

/**
 * Docked assistant rail — the same <AiChat> and the same conversation as
 * Intake/Bridge, so typing a fresh request here just continues the thread.
 */
export function ChatRail({ onCollapse }: ChatRailProps) {
  const { messages, status, sendCatalogRequest, stop } = useConversation();

  return (
    <div className="flex h-full w-[360px] min-h-0 flex-col">
      <AiChat
        messages={messages}
        status={status}
        onSendMessage={(content) => sendCatalogRequest(content)}
        onStop={stop}
        renderToolPart={(part) =>
          part.name === "presentEnvelope" ? (
            <RequestEnvelope />
          ) : part.name === "presentMatches" ? (
            <MatchCarousel output={part.output} />
          ) : part.name === "reviewCta" ? (
            <ReviewCta />
          ) : null
        }
        placeholder="Ask about catalog items…"
        header={
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <span
                className="flex size-7 items-center justify-center rounded-full text-white"
                style={{ background: "var(--ai-gradient-strong)" }}
              >
                <AutopilotIcon size={16} aria-hidden />
              </span>
              <span className="font-semibold text-foreground">Autopilot</span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onCollapse}
              aria-label="Collapse assistant"
            >
              <PanelRightClose className="size-4" />
            </Button>
          </div>
        }
      />
    </div>
  );
}
