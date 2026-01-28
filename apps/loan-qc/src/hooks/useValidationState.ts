"use client";

import { useState, useCallback } from 'react';
import type { ValidationItem, HumanEvaluationStatus, Comment } from '@/lib/types';
import { mockValidationItems } from '@/lib/validation-data';

export function useValidationState() {
  const [items, setItems] = useState<ValidationItem[]>(mockValidationItems);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(mockValidationItems[0]?.id || null);

  const updateHumanEvaluation = useCallback(
    (itemId: string, status: HumanEvaluationStatus) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, humanEvaluation: status } : item,
        ),
      );
    },
    [],
  );

  const addComment = useCallback((itemId: string, commentText: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      text: commentText,
      timestamp: new Date(),
      author: 'Current User',
    };

    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, comments: [...item.comments, newComment] }
          : item,
      ),
    );
  }, []);

  const clearComment = useCallback((itemId: string, commentId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              comments: item.comments.filter((c) => c.id !== commentId),
            }
          : item,
      ),
    );
  }, []);

  return {
    items,
    expandedItemId,
    setExpandedItemId,
    updateHumanEvaluation,
    addComment,
    clearComment,
  };
}
