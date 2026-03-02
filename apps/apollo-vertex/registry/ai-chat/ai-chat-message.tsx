"use client";

import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/ai-chat-types";

interface AiChatMessageProps {
  message: ChatMessage;
  renderToolCall?: (toolCall: ChatMessage["toolCalls"]) => ReactNode;
  assistantName?: string;
}

export function AiChatMessage({
  message,
  renderToolCall,
  assistantName,
}: AiChatMessageProps) {
  const { t } = useTranslation();
  const isUser = message.role === "user";
  const displayName = assistantName ?? t("ai_assistant");

  if (isUser) {
    return (
      <div className="flex w-full justify-end">
        <div className="max-w-[80%] px-4 py-3 text-sm rounded-lg border border-border bg-muted/50">
          {message.content && (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
          {message.attachments && message.attachments.length > 0 && (
            <div
              className={cn("flex flex-col gap-1", message.content && "mt-2")}
            >
              {message.attachments.map((attachment, index) => (
                <p key={index} className="text-xs text-muted-foreground">
                  📎 {attachment.fileName}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-start gap-3">
      <div className="size-8 flex items-center justify-center flex-shrink-0 rounded-full bg-primary">
        <Sparkles className="size-4 text-primary-foreground" />
      </div>
      <div className="flex flex-col gap-1 w-[85%]">
        <span className="text-xs text-muted-foreground font-medium">
          {displayName}
        </span>
        {message.content && (
          <div className="px-4 py-3 text-sm rounded-lg bg-primary/10 prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }: { children?: ReactNode }) => (
                  <p className="mb-2 last:mb-0">{children}</p>
                ),
                ul: ({ children }: { children?: ReactNode }) => (
                  <ul className="mb-2 last:mb-0 ml-4 list-disc">{children}</ul>
                ),
                ol: ({ children }: { children?: ReactNode }) => (
                  <ol className="mb-2 last:mb-0 ml-4 list-decimal">{children}</ol>
                ),
                li: ({ children }: { children?: ReactNode }) => <li className="mb-1">{children}</li>,
                code: ({ inline, children, ...props }: any) =>
                  inline ? (
                    <code
                      className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <code
                      className="block p-3 rounded bg-muted text-foreground font-mono text-xs overflow-x-auto"
                      {...props}
                    >
                      {children}
                    </code>
                  ),
                pre: ({ children }: { children?: ReactNode }) => (
                  <pre className="mb-2 last:mb-0">{children}</pre>
                ),
                a: ({ children, ...props }: { children?: ReactNode; href?: string }) => (
                  <a className="text-primary hover:underline" {...props}>
                    {children}
                  </a>
                ),
                strong: ({ children }: { children?: ReactNode }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
                em: ({ children }: { children?: ReactNode }) => <em className="italic">{children}</em>,
                blockquote: ({ children }: { children?: ReactNode }) => (
                  <blockquote className="border-l-2 border-muted-foreground/30 pl-3 italic my-2">
                    {children}
                  </blockquote>
                ),
                h1: ({ children }: { children?: ReactNode }) => (
                  <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>
                ),
                h2: ({ children }: { children?: ReactNode }) => (
                  <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>
                ),
                h3: ({ children }: { children?: ReactNode }) => (
                  <h3 className="text-sm font-bold mb-2 mt-2 first:mt-0">{children}</h3>
                ),
                hr: () => <hr className="my-3 border-border" />,
                table: ({ children }: { children?: ReactNode }) => (
                  <div className="overflow-x-auto my-2">
                    <table className="min-w-full divide-y divide-border">{children}</table>
                  </div>
                ),
                thead: ({ children }: { children?: ReactNode }) => (
                  <thead className="bg-muted">{children}</thead>
                ),
                tbody: ({ children }: { children?: ReactNode }) => (
                  <tbody className="divide-y divide-border">{children}</tbody>
                ),
                tr: ({ children }: { children?: ReactNode }) => <tr>{children}</tr>,
                th: ({ children }: { children?: ReactNode }) => (
                  <th className="px-3 py-2 text-left text-xs font-semibold">{children}</th>
                ),
                td: ({ children }: { children?: ReactNode }) => (
                  <td className="px-3 py-2 text-xs">{children}</td>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        {message.toolCalls && renderToolCall && (
          <div className="mt-2">{renderToolCall(message.toolCalls)}</div>
        )}
      </div>
    </div>
  );
}
