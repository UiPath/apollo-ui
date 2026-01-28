"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquareText } from 'lucide-react';
import { EvaluationBadges } from './EvaluationBadges';
import { IdentifiedFields } from './IdentifiedFields';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { ValidationItem as ValidationItemType, HumanEvaluationStatus } from '@/lib/types';

interface ValidationItemProps {
  item: ValidationItemType;
  onHumanEvaluation: (status: HumanEvaluationStatus) => void;
  onAddComment: (text: string) => void;
  isExpanded?: boolean;
  onClick?: () => void;
}

const expandTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
};

export function ValidationItem({
  item,
  onHumanEvaluation,
  onAddComment,
  isExpanded = false,
  onClick,
}: ValidationItemProps) {
  const [commentText, setCommentText] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleSaveComment = () => {
    if (commentText.trim()) {
      onAddComment(commentText.trim());
      setCommentText('');
      setIsPopoverOpen(false);
    }
  };

  const handleCancelComment = () => {
    setCommentText('');
    setIsPopoverOpen(false);
  };

  return (
    <div
      className="w-[308px] cursor-pointer rounded-md -ml-2 pl-2 hover:bg-muted/30 transition-colors"
      onClick={onClick}
    >
      {/* Item Name - Always visible */}
      <div className="flex gap-1 items-start w-full pb-3 pt-3">
        <div className="shrink-0 size-5 flex items-center justify-center">
          <div className={`size-2 rounded-full ${item.humanEvaluation ? 'bg-input' : 'bg-primary'}`} />
        </div>
        <p className="text-sm font-bold text-foreground leading-normal">
          {item.title}
        </p>
      </div>

      {/* Badges - Always visible */}
      <div className="flex gap-2 items-center pl-6 pb-3">
        <EvaluationBadges
          aiStatus={item.aiEvaluation.status}
          humanStatus={item.humanEvaluation}
        />
      </div>

      {/* Expanded content - Animates in/out */}
      <motion.div
        animate={
          isExpanded
            ? { gridTemplateRows: "1fr" }
            : { gridTemplateRows: "0fr" }
        }
        initial={false}
        transition={expandTransition}
        className="grid pb-4"
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-6">
            {/* Agent Response */}
            <div className="flex flex-col gap-2 items-start pl-6 w-full text-muted-foreground">
              <p className="text-xs font-semibold leading-4">
                Agent evaluation: {item.aiEvaluation.status.toUpperCase()}
              </p>
              <p className="text-xs font-normal leading-4 tracking-[0.12px] w-full whitespace-pre-wrap">
                {item.details.agentReasoning}
              </p>

              {/* Identified Fields - New flexible pattern */}
              {item.details.identifiedFields && item.details.identifiedFields.length > 0 && (
                <IdentifiedFields fields={item.details.identifiedFields} />
              )}

              {/* Legacy support for sourceText/targetText */}
              {!item.details.identifiedFields && (item.details.sourceText || item.details.targetText) && (
                <p className="text-xs font-normal leading-4 tracking-[0.12px] w-full whitespace-pre-wrap">
                  {item.details.sourceText && (
                    <>
                      <span className="leading-4">Grantor: </span>
                      <span className="font-semibold leading-4">{item.details.sourceText}</span>
                      <br />
                    </>
                  )}
                  {item.details.targetText && (
                    <>
                      <span className="leading-4">Borrower Name: </span>
                      <span className="font-semibold leading-4">{item.details.targetText}</span>
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Human Evaluation Section */}
            <div
              className="flex flex-col gap-3 items-start pl-6 w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-2 w-full">
                <p className="text-xs font-semibold leading-4 text-muted-foreground">
                  Human evaluation
                </p>

                <div className="flex gap-2 items-center">
                  {/* Toggle Group */}
                  <ToggleGroup
                    type="single"
                    value={item.humanEvaluation || ""}
                    onValueChange={(newValue) => {
                      // onValueChange fires with empty string when clicking selected item again
                      onHumanEvaluation(newValue === "" ? null : (newValue as HumanEvaluationStatus));
                    }}
                    variant="outline"
                    spacing={0}
                    className="shadow-[0px_1px_2px_0px_var(--shadow-xs)]"
                  >
                    <ToggleGroupItem value="yes" className="px-4 py-2.5 text-sm font-medium leading-5">
                      Yes
                    </ToggleGroupItem>
                    <ToggleGroupItem value="no" className="px-4 py-2.5 text-sm font-medium leading-5">
                      No
                    </ToggleGroupItem>
                    <ToggleGroupItem value="na" className="px-4 py-2.5 text-sm font-medium leading-5">
                      N/A
                    </ToggleGroupItem>
                  </ToggleGroup>

                  {/* Comment Popover */}
                  <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-input"
                      >
                        <MessageSquareText className="size-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-80">
                      <div className="flex flex-col gap-4">
                        <h4 className="text-sm leading-none font-medium">Add a note</h4>
                        <Textarea
                          placeholder="Add a note"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="min-h-[120px] bg-background"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="secondary"
                            onClick={handleCancelComment}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveComment}
                            disabled={!commentText.trim()}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Display Comments */}
              {item.comments.length > 0 && (
                <div className="flex flex-col gap-2 w-full">
                  {item.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex flex-col gap-1 text-xs text-muted-foreground bg-muted/30 rounded-md p-2"
                    >
                      <p className="text-foreground">{comment.text}</p>
                      <p className="text-[10px]">
                        {comment.author && `${comment.author} • `}
                        {new Date(comment.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
