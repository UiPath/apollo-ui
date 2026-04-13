"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { AiChatThinking } from "@/registry/ai-chat/components/ai-chat-thinking";
import { useThinkingLabel } from "@/registry/ai-chat/hooks/use-thinking-label";
import { Button } from "@/registry/button/button";

const ENTRANCE_EASE = [0.22, 1, 0.36, 1] as const;
const LABEL_SLIDE = 6;

const shimmerStyle = {
  display: "inline-block",
  whiteSpace: "nowrap",
  lineHeight: 1,
  fontSize: "14px",
  fontWeight: 500,
  backgroundImage:
    "linear-gradient(90deg, var(--muted-foreground) 0%, var(--muted-foreground) 30%, #6C5AEF 42%, var(--foreground) 50%, #69C7DD 58%, var(--muted-foreground) 70%, var(--muted-foreground) 100%)",
  backgroundSize: "200% 100%",
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  color: "transparent",
  animation: "ap-chat-shimmer-thinking 2.4s linear infinite",
} as const;

export function ThinkingDemo() {
  const [isThinking, setIsThinking] = useState(false);
  const { label, key: labelKey } = useThinkingLabel();

  return (
    <div className="flex flex-col items-center gap-6">
      <style>{`
        @keyframes ap-chat-shimmer-thinking {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className="flex items-center gap-0 h-14">
        <AiChatThinking size={40} isThinking={isThinking} />
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{
            opacity: isThinking ? 1 : 0,
            x: isThinking ? 0 : -8,
          }}
          transition={{
            duration: 0.3,
            delay: isThinking ? 0.9 : 0,
            ease: ENTRANCE_EASE,
          }}
          style={{ marginLeft: "-7px", display: "flex", alignItems: "center" }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={isThinking ? labelKey : "idle"}
              initial={{ opacity: 0, y: LABEL_SLIDE }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -LABEL_SLIDE }}
              transition={{ duration: 0.22, ease: ENTRANCE_EASE }}
              style={shimmerStyle}
            >
              {isThinking ? label : "Thinking…"}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsThinking((v) => !v)}
      >
        {isThinking ? "Stop thinking" : "Start thinking"}
      </Button>
    </div>
  );
}
