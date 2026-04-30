"use client";

import { useState } from "react";

import { FeedbackVoteWidget } from "@/components/ui/feedback-vote-widget";

export function FeedbackVoteWidgetTemplate() {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Default — buttons only</p>
        <FeedbackVoteWidget
          value={vote}
          onVoteChange={setVote}
          upLabel="Vote up"
          downLabel="Vote down"
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">With comment textarea</p>
        <FeedbackVoteWidget
          value={vote}
          onVoteChange={setVote}
          upLabel="Vote up"
          downLabel="Vote down"
          showComment
          comment={comment}
          onCommentChange={setComment}
          commentPlaceholder="What could the AI have done better?"
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Small size</p>
        <FeedbackVoteWidget
          value={vote}
          onVoteChange={setVote}
          upLabel="Vote up"
          downLabel="Vote down"
          size="sm"
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Disabled</p>
        <FeedbackVoteWidget
          value="up"
          onVoteChange={setVote}
          upLabel="Vote up"
          downLabel="Vote down"
          disabled
        />
      </div>
    </div>
  );
}
