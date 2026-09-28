"use client";

import { useTextSelection } from "@mantine/hooks";
import { AnimatePresence, motion } from "framer-motion";
import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  POP_ANIMATE,
  POP_EXIT,
  POP_INITIAL,
  POP_TRANSITION,
} from "../animations";
import { AutopilotIcon } from "./icons/autopilot";

const EDGE_PADDING_X = 80;
const MENU_OFFSET_Y = 8;

interface AiChatSelectionMenuProps {
  onAskAi: (selectedText: string) => void;
  containerRef?: RefObject<HTMLElement | null>;
}

interface MenuState {
  text: string;
  x: number;
  y: number;
}

function deriveMenuState(
  selection: Selection | null,
  container: HTMLElement | null,
): MenuState | null {
  if (
    !container ||
    !selection ||
    selection.isCollapsed ||
    selection.rangeCount === 0
  ) {
    return null;
  }
  const text = selection.toString().trim();
  if (!text) return null;

  const range = selection.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) return null;

  const rangeRect = range.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  const x =
    rangeRect.left +
    rangeRect.width / 2 -
    containerRect.left +
    container.scrollLeft;
  const y = rangeRect.top - containerRect.top + container.scrollTop;

  return {
    text,
    x: Math.min(
      Math.max(x, EDGE_PADDING_X),
      container.clientWidth - EDGE_PADDING_X,
    ),
    y: y - MENU_OFFSET_Y,
  };
}

export function AiChatSelectionMenu({
  onAskAi,
  containerRef,
}: AiChatSelectionMenuProps) {
  const { t } = useTranslation();
  const selection = useTextSelection();
  const menu = deriveMenuState(selection, containerRef?.current ?? null);

  return (
    <AnimatePresence>
      {menu && (
        <motion.div
          key="ai-chat-ask-ai"
          initial={POP_INITIAL}
          animate={POP_ANIMATE}
          exit={POP_EXIT}
          transition={POP_TRANSITION}
          className="absolute z-50 -translate-x-1/2 -translate-y-full"
          style={{ left: menu.x, top: menu.y }}
        >
          <Button
            type="button"
            size="sm"
            // Preserve the active selection until the click commits
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => {
              onAskAi(menu.text);
              selection?.removeAllRanges();
            }}
            className="rounded-full text-white shadow-lg hover:opacity-90 hover:text-white"
            style={{ background: "var(--ai-gradient-strong)" }}
          >
            <AutopilotIcon size={14} aria-hidden="true" />
            {t("ask_ai")}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
