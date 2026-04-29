import { ThumbsDown, ThumbsUp } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/registry/button/button";
import { Textarea } from "@/registry/textarea/textarea";
import { cn } from "@/lib/utils";

interface FeedbackVoteWidgetProps
  extends Omit<ComponentProps<"div">, "onChange"> {
  /** Current vote state. `"up"` or `"down"` shows selection; `null`/`undefined` means no vote yet. */
  value?: "up" | "down" | null;
  /** Called when the user clicks a vote button. */
  onVoteChange?: (vote: "up" | "down") => void;
  /** Show the optional comment textarea below the vote buttons. */
  showComment?: boolean;
  /** Comment value (controlled). */
  comment?: string;
  /** Called when the comment textarea changes. */
  onCommentChange?: (value: string) => void;
  /** Placeholder text for the comment textarea. */
  commentPlaceholder?: string;
  /** Disable both vote buttons and the comment textarea. */
  disabled?: boolean;
  /** Visual size of the vote buttons. */
  size?: "default" | "sm";
  /** Accessible label for the up-vote button. */
  upLabel?: string;
  /** Accessible label for the down-vote button. */
  downLabel?: string;
}

function FeedbackVoteWidget({
  className,
  value,
  onVoteChange,
  showComment = false,
  comment,
  onCommentChange,
  commentPlaceholder = "Tell us what could be better (optional)",
  disabled,
  size = "default",
  upLabel = "Vote up",
  downLabel = "Vote down",
  ...props
}: FeedbackVoteWidgetProps) {
  const buttonSize = size === "sm" ? "icon-sm" : "icon";

  return (
    <div
      data-slot="feedback-vote-widget"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      <div
        className="flex items-center gap-1"
        data-slot="feedback-vote-widget-buttons"
      >
        <Button
          type="button"
          variant={value === "up" ? "success" : "ghost"}
          size={buttonSize}
          aria-label={upLabel}
          aria-pressed={value === "up"}
          data-vote="up"
          disabled={disabled}
          onClick={() => onVoteChange?.("up")}
        >
          <ThumbsUp />
        </Button>
        <Button
          type="button"
          variant={value === "down" ? "destructive" : "ghost"}
          size={buttonSize}
          aria-label={downLabel}
          aria-pressed={value === "down"}
          data-vote="down"
          disabled={disabled}
          onClick={() => onVoteChange?.("down")}
        >
          <ThumbsDown />
        </Button>
      </div>
      {showComment && (
        <Textarea
          data-slot="feedback-vote-widget-comment"
          value={comment ?? ""}
          onChange={(e) => onCommentChange?.(e.target.value)}
          placeholder={commentPlaceholder}
          disabled={disabled}
          rows={2}
        />
      )}
    </div>
  );
}

export { FeedbackVoteWidget };
export type { FeedbackVoteWidgetProps };
