"use client";

import { useState, useCallback } from 'react';
import type { ViewMode } from '@/lib/types';

export function useDocumentView() {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [activeDocument, setActiveDocument] = useState<string | null>(null);

  const enterImmersiveMode = useCallback((documentId: string) => {
    setActiveDocument(documentId);
    setViewMode(documentId === 'doc-1' ? 'immersive-left' : 'immersive-right');
  }, []);

  const exitImmersiveMode = useCallback(() => {
    setViewMode('split');
    setActiveDocument(null);
  }, []);

  const toggleDocumentView = useCallback(
    (documentId: string) => {
      if (activeDocument === documentId) {
        exitImmersiveMode();
      } else {
        enterImmersiveMode(documentId);
      }
    },
    [activeDocument, enterImmersiveMode, exitImmersiveMode],
  );

  const switchDocument = useCallback((documentId: string) => {
    setActiveDocument(documentId);
  }, []);

  return {
    viewMode,
    activeDocument,
    enterImmersiveMode,
    exitImmersiveMode,
    toggleDocumentView,
    switchDocument,
  };
}
