"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { AiChat } from "@/registry/ai-chat/components/ai-chat";
import { AiChatCodeBlock } from "@/registry/ai-chat/components/ai-chat-code-block";
import { AiChatEmptyState } from "@/registry/ai-chat/components/ai-chat-empty-state";
import { AiChatInput } from "@/registry/ai-chat/components/ai-chat-input";
import { AiChatMarkdown } from "@/registry/ai-chat/components/ai-chat-markdown";
import { AiChatMessage } from "@/registry/ai-chat/components/ai-chat-message";
import { AiChatSuggestions } from "@/registry/ai-chat/components/ai-chat-suggestions";
import { Button } from "@/registry/button/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/registry/dialog/dialog";
import {
  MOCK_ATTACHMENTS_BASIC,
  MOCK_CHOICE_OPTIONS,
  MOCK_MESSAGES_BASIC,
  MOCK_MESSAGES_CONVERSATION,
  MOCK_MESSAGES_MARKDOWN,
  MOCK_MESSAGES_WITH_CHOICES,
  MOCK_SOURCES_BASIC,
} from "./mock-data";
import { ThinkingDemo } from "./thinking-demo";

// biome-ignore lint/suspicious/noExplicitAny: preview no-op accepts any args
function noop(..._args: any[]) {
  // no-op for preview
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

function PreviewCard({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const baseClass = `border rounded-lg bg-background overflow-hidden ${className ?? ""}`;

  if (!title) {
    return <div className={baseClass}>{children}</div>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className={`relative group ${baseClass}`}>
        {!isOpen && children}
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon-sm"
            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-300 bg-background/80 backdrop-blur-sm"
            aria-label="Enter full screen"
            title="Enter full screen"
          >
            <Maximize2 className="size-4" />
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent fullscreen showCloseButton={false}>
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogClose asChild>
          <Button
            variant="outline"
            size="icon-sm"
            className="absolute top-4 right-4 z-20"
            aria-label="Exit full screen"
            title="Exit full screen"
          >
            <Minimize2 className="size-4" />
          </Button>
        </DialogClose>
        <div className="h-full">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

function renderBasicMsg(msg: (typeof MOCK_MESSAGES_BASIC)[number]) {
  return (
    <AiChatMessage
      key={msg.id}
      message={msg}
      sources={MOCK_SOURCES_BASIC[msg.id as keyof typeof MOCK_SOURCES_BASIC]}
      attachments={MOCK_ATTACHMENTS_BASIC[msg.id as keyof typeof MOCK_ATTACHMENTS_BASIC]}
    />
  );
}

export default function AiChatPreviewPage() {
  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {"AI Chat — Component Preview"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {"All visual states and sub-components rendered with mock data."}
        </p>
      </div>

      {/* ── 1. Empty State (default) ────────────────────────── */}
      <section>
        <SectionHeader
          title="Empty State (Default)"
          description="Default empty state with AI gradient icon."
        />
        <PreviewCard className="h-[400px]" title="Empty State (Default)">
          <AiChat
            messages={[]}
            isLoading={false}
            onSendMessage={noop}
            onStop={noop}
            title="Autopilot"
          />
        </PreviewCard>
      </section>

      {/* ── 2. Empty State (with suggestions) ──────────────── */}
      <section>
        <SectionHeader
          title="Empty State (Custom with Suggestions)"
          description="AiChatEmptyState component with quick-start prompts."
        />
        <PreviewCard className="h-[400px]" title="Empty State (Custom with Suggestions)">
          <AiChat
            messages={[]}
            isLoading={false}
            onSendMessage={noop}
            onStop={noop}
            title="Autopilot"
            emptyState={
              <AiChatEmptyState
                title="What would you like to do?"
                description="I can help you review, fix, or complete your work."
              />
            }
            suggestions={["Create a React app", "Debug my code", "Write tests"]}
          />
        </PreviewCard>
      </section>

      {/* ── 3. Basic Conversation with timestamps ──────────── */}
      <section>
        <SectionHeader
          title="Basic Conversation"
          description="User/assistant exchange with avatars, timestamps, and hover actions."
        />
        <PreviewCard className="h-[400px]" title="Basic Conversation">
          <AiChat
            messages={MOCK_MESSAGES_BASIC}
            isLoading={false}
            onSendMessage={noop}
            onStop={noop}
            title="Autopilot"
            showTimestamps
            showMessageActions
            onEditMessage={noop}
          >
            {MOCK_MESSAGES_BASIC.map(renderBasicMsg)}
          </AiChat>
        </PreviewCard>
      </section>

      {/* ── 4. Multi-turn Conversation ─────────────────────── */}
      <section>
        <SectionHeader
          title="Multi-turn Conversation"
          description="Longer back-and-forth with scrollable content and custom assistant name."
        />
        <PreviewCard className="h-[500px]" title="Multi-turn Conversation">
          <AiChat
            messages={MOCK_MESSAGES_CONVERSATION}
            isLoading={false}
            onSendMessage={noop}
            onStop={noop}
            title="Autopilot"
            showTimestamps
            onEditMessage={noop}
          >
            {MOCK_MESSAGES_CONVERSATION.map((msg) => (
              <AiChatMessage key={msg.id} message={msg} />
            ))}
          </AiChat>
        </PreviewCard>
      </section>

      {/* ── 5. Markdown + Code Block ───────────────────────── */}
      <section>
        <SectionHeader
          title="Markdown Rendering"
          description="All markdown elements including code blocks with copy button."
        />
        <PreviewCard className="h-[600px]" title="Markdown Rendering">
          <AiChat
            messages={MOCK_MESSAGES_MARKDOWN}
            isLoading={false}
            onSendMessage={noop}
            onStop={noop}
            title="Autopilot"
            onEditMessage={noop}
          >
            {MOCK_MESSAGES_MARKDOWN.map((msg) => (
              <AiChatMessage key={msg.id} message={msg} />
            ))}
          </AiChat>
        </PreviewCard>
      </section>

      {/* ── 6. Loading State ───────────────────────────────── */}
      <section>
        <SectionHeader
          title="Loading State"
          description="Thinking indicator that appears while the assistant generates a response."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PreviewCard className="h-[300px]" title="Loading State">
            <AiChat
              messages={[MOCK_MESSAGES_BASIC[0]]}
              isLoading
              onSendMessage={noop}
              onStop={noop}
              title="Autopilot"
              onEditMessage={noop}
            >
              {renderBasicMsg(MOCK_MESSAGES_BASIC[0])}
            </AiChat>
          </PreviewCard>
          <PreviewCard className="p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
              {"Thinking indicator (interactive)"}
            </h3>
            <ThinkingDemo />
          </PreviewCard>
        </div>
      </section>

      {/* ── 7. Error + Retry ───────────────────────────────── */}
      <section>
        <SectionHeader
          title="Error State with Retry"
          description="Inline error banner with retry button."
        />
        <PreviewCard className="h-[400px]" title="Error State with Retry">
          <AiChat
            messages={MOCK_MESSAGES_BASIC}
            isLoading={false}
            onSendMessage={noop}
            onStop={noop}
            onRetry={noop}
            onEditMessage={noop}
            title="Autopilot"
            error={
              new Error(
                "Failed to connect to the AI service. Please check your network connection.",
              )
            }
          >
            {MOCK_MESSAGES_BASIC.map(renderBasicMsg)}
          </AiChat>
        </PreviewCard>
      </section>

      {/* ── 8. Suggestion Buttons ──────────────────────────── */}
      <section>
        <SectionHeader
          title="Suggestion Buttons"
          description="Choice buttons with recommended badge and hover animation."
        />
        <PreviewCard className="h-[400px]" title="Suggestion Buttons">
          <AiChat
            messages={MOCK_MESSAGES_WITH_CHOICES}
            isLoading={false}
            onSendMessage={noop}
            onStop={noop}
            onEditMessage={noop}
            title="Autopilot"
          >
            {MOCK_MESSAGES_WITH_CHOICES.map((msg) => (
              <AiChatMessage key={msg.id} message={msg} />
            ))}
          </AiChat>
        </PreviewCard>
      </section>

      {/* ── 9. Isolated Sub-Components ────────────────────── */}
      <section>
        <SectionHeader
          title="Isolated Sub-Components"
          description="Each sub-component rendered standalone."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PreviewCard className="p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
              {"AiChatSuggestions (with recommended)"}
            </h3>
            <AiChatSuggestions
              prompt="Choose your preferred approach:"
              options={MOCK_CHOICE_OPTIONS}
              onSelect={noop}
            />
          </PreviewCard>

          <PreviewCard className="p-0">
            <h3 className="text-sm font-semibold text-muted-foreground px-6 pt-6 uppercase tracking-wide">
              {"AiChatInput (with text + clear)"}
            </h3>
            <AiChatInput
              value="How do I install Apollo components?"
              onChange={noop}
              onSubmit={noop}
              onStop={noop}
              isLoading={false}
              hasMessages
            />
          </PreviewCard>

          <PreviewCard className="p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
              {"AiChatCodeBlock"}
            </h3>
            <AiChatCodeBlock language="typescript">
              {`import { AiChat } from "@/components/ui/ai-chat";

function App() {
  return <AiChat messages={[]} isLoading={false} />;
}`}
            </AiChatCodeBlock>
          </PreviewCard>

          <PreviewCard className="p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
              {"AiChatMarkdown (standalone)"}
            </h3>
            <AiChatMarkdown>
              {`Here's a quick example with **bold**, *italic*, \`code\`, and a [link](https://example.com).\n\n| Feature | Supported |\n|---------|----------|\n| Tables | Yes |\n| Code | Yes |`}
            </AiChatMarkdown>
          </PreviewCard>
        </div>
      </section>
    </div>
  );
}
