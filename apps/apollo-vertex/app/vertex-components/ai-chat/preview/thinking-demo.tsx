"use client";

import { useState } from "react";
import { AiChatThinking } from "@/registry/ai-chat/components/ai-chat-thinking";
import { Button } from "@/registry/button/button";

export function ThinkingDemo() {
  const [isThinking, setIsThinking] = useState(false);
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
        <span
          style={{
            opacity: isThinking ? 1 : 0,
            transform: isThinking ? "translateX(0)" : "translateX(-8px)",
            transition: isThinking
              ? "opacity 300ms ease-out 900ms, transform 300ms ease-out 900ms"
              : "opacity 200ms ease-out, transform 200ms ease-out",
            marginLeft: "-7px",
            fontSize: "14px",
            fontWeight: 500,
            backgroundImage:
              "linear-gradient(90deg, var(--muted-foreground) 0%, var(--muted-foreground) 30%, #6C5AEF 42%, var(--foreground) 50%, #69C7DD 58%, var(--muted-foreground) 70%, var(--muted-foreground) 100%)",
            backgroundSize: "200% 100%",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            animation: "ap-chat-shimmer-thinking 2.4s linear infinite",
          }}
        >
          Thinking…
        </span>
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
