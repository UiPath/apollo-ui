import { ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/registry/button/button";
import { Textarea } from "@/registry/textarea/textarea";

type FeedbackVoteWidgetBaseProps = {
  /** Current vote state. `"up"` / `"down"` shows selection; `null` means no vote yet. */
  value: "up" | "down" | null;
  onVoteChange: (vote: "up" | "down") => void;
  upLabel: string;
  downLabel: string;
  disabled?: boolean;
  size?: "default" | "sm";
};

type FeedbackVoteWidgetWithComment = FeedbackVoteWidgetBaseProps & {
  showComment: true;
  comment: string;
  onCommentChange: (value: string) => void;
  commentPlaceholder: string;
};

type FeedbackVoteWidgetWithoutComment = FeedbackVoteWidgetBaseProps & {
  showComment?: false;
};

type FeedbackVoteWidgetProps =
  | FeedbackVoteWidgetWithComment
  | FeedbackVoteWidgetWithoutComment;

function FeedbackVoteWidget(props: FeedbackVoteWidgetProps) {
  const {
    value,
    onVoteChange,
    upLabel,
    downLabel,
    disabled,
    size = "default",
  } = props;
  const buttonSize = size === "sm" ? "icon-sm" : "icon";

  return (
    <div data-slot="feedback-vote-widget" className="flex flex-col gap-2">
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
          onClick={() => onVoteChange("up")}
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
          onClick={() => onVoteChange("down")}
        >
          <ThumbsDown />
        </Button>
      </div>
      {props.showComment && (
        <Textarea
          data-slot="feedback-vote-widget-comment"
          value={props.comment}
          onChange={(e) => props.onCommentChange(e.target.value)}
          placeholder={props.commentPlaceholder}
          disabled={disabled}
          rows={2}
        />
      )}
    </div>
  );
}

export { FeedbackVoteWidget };
export type { FeedbackVoteWidgetProps };
