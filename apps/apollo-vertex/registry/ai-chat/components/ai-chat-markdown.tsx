"use client";

import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type NodeProps = { children?: ReactNode };
type CodeProps = { inline?: boolean; children?: ReactNode; className?: string };
type AnchorProps = { children?: ReactNode; href?: string };

const components: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  p: ({ children }: NodeProps) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }: NodeProps) => (
    <ul className="mb-2 last:mb-0 ml-4 list-disc">{children}</ul>
  ),
  ol: ({ children }: NodeProps) => (
    <ol className="mb-2 last:mb-0 ml-4 list-decimal">{children}</ol>
  ),
  li: ({ children }: NodeProps) => <li className="mb-1">{children}</li>,
  code: ({ inline, children, ...props }: CodeProps) =>
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
  pre: ({ children }: NodeProps) => (
    <pre className="mb-2 last:mb-0">{children}</pre>
  ),
  a: ({ children, ...props }: AnchorProps) => (
    <a className="text-primary hover:underline" {...props}>
      {children}
    </a>
  ),
  strong: ({ children }: NodeProps) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }: NodeProps) => <em className="italic">{children}</em>,
  blockquote: ({ children }: NodeProps) => (
    <blockquote className="border-l-2 border-muted-foreground/30 pl-3 italic my-2">
      {children}
    </blockquote>
  ),
  h1: ({ children }: NodeProps) => (
    <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>
  ),
  h2: ({ children }: NodeProps) => (
    <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>
  ),
  h3: ({ children }: NodeProps) => (
    <h3 className="text-sm font-bold mb-2 mt-2 first:mt-0">{children}</h3>
  ),
  hr: () => <hr className="my-3 border-border" />,
  table: ({ children }: NodeProps) => (
    <div className="overflow-x-auto my-2">
      <table className="min-w-full divide-y divide-border">{children}</table>
    </div>
  ),
  thead: ({ children }: NodeProps) => (
    <thead className="bg-muted">{children}</thead>
  ),
  tbody: ({ children }: NodeProps) => (
    <tbody className="divide-y divide-border">{children}</tbody>
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
    <div className="px-4 py-3 text-sm rounded-lg bg-primary/10 prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
