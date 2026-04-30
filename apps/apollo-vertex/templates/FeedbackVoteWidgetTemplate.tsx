"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { FeedbackVoteWidget } from "@/components/ui/feedback-vote-widget";

export function FeedbackVoteWidgetTemplate() {
  const { t } = useTranslation();
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");

  const upLabel = t("feedback_vote_up");
  const downLabel = t("feedback_vote_down");

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          {t("feedback_demo_default_label")}
        </p>
        <FeedbackVoteWidget
          value={vote}
          onVoteChange={setVote}
          upLabel={upLabel}
          downLabel={downLabel}
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          {t("feedback_demo_with_comment_label")}
        </p>
        <FeedbackVoteWidget
          value={vote}
          onVoteChange={setVote}
          upLabel={upLabel}
          downLabel={downLabel}
          showComment
          comment={comment}
          onCommentChange={setComment}
          commentPlaceholder={t("feedback_comment_placeholder")}
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          {t("feedback_demo_small_size_label")}
        </p>
        <FeedbackVoteWidget
          value={vote}
          onVoteChange={setVote}
          upLabel={upLabel}
          downLabel={downLabel}
          size="sm"
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          {t("feedback_demo_disabled_label")}
        </p>
        <FeedbackVoteWidget
          value="up"
          onVoteChange={setVote}
          upLabel={upLabel}
          downLabel={downLabel}
          disabled
        />
      </div>
    </div>
  );
}
