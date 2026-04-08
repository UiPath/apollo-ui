"use client";

import { AiChat } from "@/registry/ai-chat/components/ai-chat";
import { AiChatCodeBlock } from "@/registry/ai-chat/components/ai-chat-code-block";
import { AiChatEmptyState } from "@/registry/ai-chat/components/ai-chat-empty-state";
import { AiChatInput } from "@/registry/ai-chat/components/ai-chat-input";
import { AiChatLoading } from "@/registry/ai-chat/components/ai-chat-loading";
import { AiChatMarkdown } from "@/registry/ai-chat/components/ai-chat-markdown";
import { AiChatMessage } from "@/registry/ai-chat/components/ai-chat-message";
import { AiChatSuggestions } from "@/registry/ai-chat/components/ai-chat-suggestions";
import {
  MOCK_CHOICE_OPTIONS,
  MOCK_MESSAGES_BASIC,
  MOCK_MESSAGES_CONVERSATION,
  MOCK_MESSAGES_MARKDOWN,
  MOCK_MESSAGES_WITH_CHOICES,
} from "./mock-data";

function noop() {
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
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border rounded-lg bg-background overflow-hidden ${className ?? ""}`}
    >
      {children}
    </div>
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
        <PreviewCard className="h-[400px]">
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
        <PreviewCard className="h-[400px]">
          <AiChat
            messages={[]}
            isLoading={false}
            onSendMessage={noop}
            onStop={noop}
            emptyState={
              <AiChatEmptyState
                title="Project Helper"
                description="I can help you scaffold projects, debug code, and write docs."
                suggestions={[
                  "Create a React app",
                  "Debug my code",
                  "Write tests",
                ]}
                onSuggestionClick={noop}
              />
            }
          />
        </PreviewCard>
      </section>

      {/* ── 3. Basic Conversation with timestamps ──────────── */}
      <section>
        <SectionHeader
          title="Basic Conversation"
          description="User/assistant exchange with avatars, timestamps, and hover actions."
        />
        <PreviewCard className="h-[400px]">
          <AiChat
            messages={MOCK_MESSAGES_BASIC}
            isLoading={false}
            onSendMessage={noop}
            onStop={noop}
            title="Autopilot"
            showTimestamps
            showMessageActions
          >
            {MOCK_MESSAGES_BASIC.map((msg) => (
              <AiChatMessage key={msg.id} message={msg} />
            ))}
          </AiChat>
        </PreviewCard>
      </section>

      {/* ── 4. Multi-turn Conversation ─────────────────────── */}
      <section>
        <SectionHeader
          title="Multi-turn Conversation"
          description="Longer back-and-forth with scrollable content and custom assistant name."
        />
        <PreviewCard className="h-[500px]">
          <AiChat
            messages={MOCK_MESSAGES_CONVERSATION}
            isLoading={false}
            onSendMessage={noop}
            onStop={noop}
            title="Project Setup Wizard"
            assistantName="Setup Bot"
            showTimestamps
          >
            {MOCK_MESSAGES_CONVERSATION.map((msg) => (
              <AiChatMessage
                key={msg.id}
                message={msg}
                assistantName="Setup Bot"
              />
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
        <PreviewCard className="h-[600px]">
          <AiChat
            messages={MOCK_MESSAGES_MARKDOWN}
            isLoading={false}
            onSendMessage={noop}
            onStop={noop}
            title="Markdown Demo"
          >
            {MOCK_MESSAGES_MARKDOWN.map((msg) => (
              <AiChatMessage key={msg.id} message={msg} />
            ))}
          </AiChat>
        </PreviewCard>
      </section>

      {/* ── 6. Loading States ──────────────────────────────── */}
      <section>
        <SectionHeader
          title="Loading States"
          description="Skeleton (default) and dots loading variants."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PreviewCard className="h-[300px]">
            <AiChat
              messages={[MOCK_MESSAGES_BASIC[0]]}
              isLoading
              onSendMessage={noop}
              onStop={noop}
              title="Skeleton Loading"
            >
              <AiChatMessage message={MOCK_MESSAGES_BASIC[0]} />
            </AiChat>
          </PreviewCard>
          <PreviewCard className="p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
              {"Dots variant (standalone)"}
            </h3>
            <AiChatLoading loadingVariant="dots" />
          </PreviewCard>
        </div>
      </section>

      {/* ── 7. Error + Retry ───────────────────────────────── */}
      <section>
        <SectionHeader
          title="Error State with Retry"
          description="Inline error banner with retry button."
        />
        <PreviewCard className="h-[400px]">
          <AiChat
            messages={MOCK_MESSAGES_BASIC}
            isLoading={false}
            onSendMessage={noop}
            onStop={noop}
            onRetry={noop}
            title="Autopilot"
            error={
              new Error(
                "Failed to connect to the AI service. Please check your network connection.",
              )
            }
          >
            {MOCK_MESSAGES_BASIC.map((msg) => (
              <AiChatMessage key={msg.id} message={msg} />
            ))}
          </AiChat>
        </PreviewCard>
      </section>

      {/* ── 8. Suggestion Buttons ──────────────────────────── */}
      <section>
        <SectionHeader
          title="Suggestion Buttons"
          description="Choice buttons with recommended badge and hover animation."
        />
        <PreviewCard className="h-[400px]">
          <AiChat
            messages={MOCK_MESSAGES_WITH_CHOICES}
            isLoading={false}
            onSendMessage={noop}
            onStop={noop}
            title="Presentation Advisor"
          >
            {MOCK_MESSAGES_WITH_CHOICES.map((msg) => (
              <AiChatMessage key={msg.id} message={msg} />
            ))}
          </AiChat>
        </PreviewCard>
      </section>

      {/* ── 9. Variant Comparison ──────────────────────────── */}
      <section>
        <SectionHeader
          title="Variant Comparison"
          description="Default, compact, and embedded layout variants side by side."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PreviewCard className="h-[350px]">
            <AiChat
              messages={MOCK_MESSAGES_BASIC}
              isLoading={false}
              onSendMessage={noop}
              onStop={noop}
              variant="default"
              title="Default"
            >
              {MOCK_MESSAGES_BASIC.map((msg) => (
                <AiChatMessage key={msg.id} message={msg} />
              ))}
            </AiChat>
          </PreviewCard>
          <PreviewCard className="h-[350px]">
            <AiChat
              messages={MOCK_MESSAGES_BASIC}
              isLoading={false}
              onSendMessage={noop}
              onStop={noop}
              variant="compact"
              title="Compact"
            >
              {MOCK_MESSAGES_BASIC.map((msg) => (
                <AiChatMessage key={msg.id} message={msg} />
              ))}
            </AiChat>
          </PreviewCard>
          <PreviewCard className="h-[350px] p-4">
            <AiChat
              messages={MOCK_MESSAGES_BASIC}
              isLoading={false}
              onSendMessage={noop}
              onStop={noop}
              variant="embedded"
            >
              {MOCK_MESSAGES_BASIC.map((msg) => (
                <AiChatMessage key={msg.id} message={msg} />
              ))}
            </AiChat>
          </PreviewCard>
        </div>
      </section>

      {/* ── 10. Isolated Sub-Components ────────────────────── */}
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
              onClear={noop}
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
