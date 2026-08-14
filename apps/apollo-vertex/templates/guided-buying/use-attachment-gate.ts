"use client";

import { useState } from "react";

/**
 * Gates a composer's send control on attachment presence rather than typed
 * text, for J3's document-led entry points. AiChatInput owns pendingFiles
 * internally and exposes no way to read it, so this reads the one signal it
 * does expose (onPendingFilesChange) and turns it into a boolean a caller
 * can feed straight back into AiChatInput's own existing `disabled` prop,
 * rather than a new disabled mechanism of this component's own.
 */
export function useAttachmentGate() {
  const [hasAttachment, setHasAttachment] = useState(false);

  const onPendingFilesChange = (count: number) => setHasAttachment(count > 0);

  return { hasAttachment, onPendingFilesChange };
}
