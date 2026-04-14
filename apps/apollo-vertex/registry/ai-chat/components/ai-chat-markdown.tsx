"use client";

import type { ComponentProps, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AiChatCodeBlock } from "./ai-chat-code-block";

type NodeProps = { children?: ReactNode };
type AnchorProps = { children?: ReactNode; href?: string };
type ImageProps = { src?: string | Blob; alt?: string; title?: string };

function extractCodeProps(props: NodeProps & { className?: string }) {
  const { className, children } = props;
  const match = /language-(\w+)/.exec(className ?? "");
  const language = match ? match[1] : "";
  const code = String(children).replace(/\n$/, "");
  return { language, code };
}

const components: ComponentProps<typeof ReactMarkdown>["components"] = {
  p: ({ children }: NodeProps) => (
    <p className="mt-5 mb-5 first:mt-0 last:mb-0">{children}</p>
  ),
  ul: ({ children }: NodeProps) => (
    <ul className="mt-5 mb-5 first:mt-0 last:mb-0 ml-4 list-disc">
      {children}
    </ul>
  ),
  ol: ({ children }: NodeProps) => (
    <ol className="mt-5 mb-5 first:mt-0 last:mb-0 ml-4 list-decimal">
      {children}
    </ol>
  ),
  li: ({ children }: NodeProps) => <li className="mb-3">{children}</li>,
  pre: ({ children }: NodeProps) => <div>{children}</div>,
  code: ({
    children,
    className,
    ...props
  }: NodeProps & { className?: string }) => {
    const isBlock =
      className?.startsWith("language-") ||
      (typeof children === "string" && children.includes("\n"));

    if (isBlock) {
      const { language, code } = extractCodeProps({
        className,
        children,
        ...props,
      });
      return <AiChatCodeBlock language={language}>{code}</AiChatCodeBlock>;
    }

    return (
      <code className="px-1.5 py-0.5 rounded bg-ai-chat-muted text-ai-chat-foreground font-mono text-xs">
        {children}
      </code>
    );
  },
  a: ({ children, ...props }: AnchorProps) => (
    <a
      className="text-primary-700 dark:text-primary-400 hover:underline"
      {...props}
    >
      {children}
    </a>
  ),
  img: ({ src, alt, title }: ImageProps) => (
    <img
      src={typeof src === "string" ? src : undefined}
      alt={alt ?? ""}
      title={title}
      loading="lazy"
      decoding="async"
      className="block max-w-full max-h-[400px] object-contain rounded-lg border border-ai-chat-border"
    />
  ),
  strong: ({ children }: NodeProps) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }: NodeProps) => <em className="italic">{children}</em>,
  blockquote: ({ children }: NodeProps) => (
    <blockquote className="border-l-2 border-ai-chat-accent pl-3 bg-ai-chat-accent/5 rounded-r italic my-2 py-1">
      {children}
    </blockquote>
  ),
  h1: ({ children }: NodeProps) => (
    <h1 className="text-2xl font-bold mb-3 mt-6 first:mt-0">{children}</h1>
  ),
  h2: ({ children }: NodeProps) => (
    <h2 className="text-xl font-bold mb-2 mt-5 first:mt-0">{children}</h2>
  ),
  h3: ({ children }: NodeProps) => (
    <h3 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h3>
  ),
  hr: () => <hr className="my-3 border-ai-chat-border" />,
  table: ({ children }: NodeProps) => (
    <div className="overflow-x-auto my-2">
      <table className="min-w-full divide-y divide-ai-chat-border">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: NodeProps) => (
    <thead className="bg-ai-chat-muted">{children}</thead>
  ),
  tbody: ({ children }: NodeProps) => (
    <tbody className="divide-y divide-ai-chat-border">{children}</tbody>
  ),
  tr: ({ children }: NodeProps) => <tr>{children}</tr>,
  th: ({ children }: NodeProps) => (
    <th className="px-3 py-2 text-left text-xs font-semibold">{children}</th>
  ),
  td: ({ children }: NodeProps) => (
    <td className="px-3 py-2 text-xs">{children}</td>
  ),
};

interface AiChatMarkdownProps {
  children: string;
}

export function AiChatMarkdown({ children }: AiChatMarkdownProps) {
  return (
    <div className="py-1 text-base leading-relaxed bg-transparent text-foreground prose dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
