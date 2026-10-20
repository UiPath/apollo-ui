import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodeBlock as SourceBlock } from '@/components/ui/code-block';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Divider,
  GuidanceItem,
  GuidanceList,
  GuidancePage,
  InfoCallout,
  InlineCode,
  SectionDescription,
  SectionTitle,
} from './guidance-primitives';

/**
 * How the apollo-wind chat primitives are consumed by ApChat's Wind renderer
 * (`packages/apollo-react/src/chat/wind`). The live examples embed the Apollo React Chat
 * playground from this Storybook instead of rebuilding a panel here, so the page cannot drift
 * from the shipped chat.
 */
const meta = {
  title: 'Apollo Wind/Chat/Patterns',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Live examples ──────────────────────────────────────────────────────────

const PLAYGROUND = 'apollo-react-chat-playground';

interface Embed {
  title: string;
  caption: string;
  storyId: string;
  /** Storybook's URL args, `key:value` pairs joined by `;`. */
  args?: string;
  height: number;
}

const EMBEDS: Embed[] = [
  {
    title: 'Embedded',
    caption:
      'The Wind renderer in Embedded mode, in a host-owned container, running the Tool calls scenario: one call per display mode, a failed call, and a trace waiting on escalation task links, which opens by itself. The action bar sits under the latest reply, with the composer below.',
    storyId: `${PLAYGROUND}--embedded`,
    args: 'scenario:tool-call',
    height: 760,
  },
  {
    title: 'Embedded, compact',
    caption:
      'The same panel with spacing.compactMode on, running the Citations scenario: replies with URL and PDF citations and a Sources list under each. The chat root carries data-density="compact" and the primitives inside follow it; ChatHero and PromptSuggestions get density as a prop.',
    storyId: `${PLAYGROUND}--embedded`,
    args: 'scenario:citations;compactMode:!true',
    height: 760,
  },
  {
    title: 'Full screen',
    caption:
      'FullScreen mode running the Chat history scenario: the transcript stays empty, so the centered first-run hero and its suggestion row sit around the composer, and the history popover is open under its header button.',
    storyId: `${PLAYGROUND}--full-screen`,
    args: 'scenario:history',
    height: 760,
  },
  {
    title: 'Compare renderers',
    caption:
      'Wind and Material side by side, each on its own service, replaying the same short conversation. Use it to check parity.',
    storyId: `${PLAYGROUND}--compare-renderers`,
    height: 760,
  },
];

// The `globals` query param works in Storybook 10 (checked in this Storybook) but is not in its
// docs. If it stops working the frames fall back to the default theme, and "Open story" still
// opens each example in the manager.
function storyQuery(embed: Embed, theme: string) {
  const params = [`id=${embed.storyId}`, 'viewMode=story', `globals=theme:${theme}`];
  if (embed.args) params.push(`args=${embed.args}`);
  return params.join('&');
}

function managerHref(embed: Embed, theme: string) {
  const params = [`path=/story/${embed.storyId}`, `globals=theme:${theme}`];
  if (embed.args) params.push(`args=${embed.args}`);
  return `./?${params.join('&')}`;
}

function LiveExample({ embed, theme }: { embed: Embed; theme: string }) {
  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-foreground">{embed.title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{embed.caption}</p>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          {/* The page itself runs in Storybook's preview frame, so the link targets the manager. */}
          <a
            href={managerHref(embed, theme)}
            target="_top"
            aria-label={`Open the ${embed.title} story`}
          >
            Open story
            <ArrowUpRight aria-hidden />
          </a>
        </Button>
      </figcaption>
      <iframe
        title={`Apollo React Chat playground: ${embed.title}`}
        src={`iframe.html?${storyQuery(embed, theme)}`}
        loading="lazy"
        className="w-full rounded-lg border border-border bg-background"
        style={{ height: embed.height }}
      />
    </figure>
  );
}

// ─── Primitives and contracts ───────────────────────────────────────────────

interface Contract {
  primitive: string;
  feature: string;
  contract: string;
}

// From packages/apollo-react/src/chat/wind and src/chat/DOCS.md; refresh a row when its source changes.
const CONTRACTS: Contract[] = [
  {
    primitive: 'Every primitive with copy',
    feature: 'All chrome labels, translated through Lingui',
    contract:
      'Pass copy through the strings prop (XStrings interface, DEFAULT_X_STRINGS defaults). The renderer maps its catalog into strings, for example MessageActions label and more, MessageActionCopy copy and copied, Markdown footnote and task labels. No label is hard-coded in the host.',
  },
  {
    primitive:
      'Density-aware primitives (Markdown, CodeBlock, Message, Bubble, ToolCall, Sources, Citation, ThinkingIndicator, MessageActions, DisclosureTree, Attachment, EmptyState, ChatComposer)',
    feature: 'spacing.compactMode',
    contract:
      'The chat root sets data-density="compact"; primitives follow that ancestor with no prop, and a host className on a primitive root wins in both densities. ChatComposer follows it, and ApChat passes it no density. EmptyState follows it unless given a size; the history passes size="compact" in both densities (see the EmptyState row). ChatHero and PromptSuggestions do not read the ancestor yet, so ApChat passes them density.',
  },
  {
    primitive: 'All primitives',
    feature: 'theme prop and setTheme',
    contract:
      'The chat root carries the theme class (light, dark, light-hc, dark-hc, future-light, future-dark), so the primitives theme from that ancestor whatever the host body class.',
  },
  {
    primitive: 'Popover, Tooltip, DropdownMenu, Dialog',
    feature: 'History popover, header menus, tooltips, code block expand',
    contract:
      'Without portalContainer, menus, tooltips and popovers stay inside the chat root, and only modal dialogs (the code block expand) portal, to a themed node in document.body at z-index 1300. With portalContainer, every overlay portals to that themed node, placed in portalContainer. Wired through PortalContainerProvider and the container prop of DialogContent.',
  },
  {
    primitive: 'MessageScroller',
    feature: 'Transcript, autoScroll, older messages',
    contract:
      'MessageScrollerProvider with autoScroll and defaultScrollPosition="end". Each group is a MessageScrollerItem; user turns set scrollAnchor so a new turn scrolls to its start. The start edge from useMessageScrollerScrollable drives loading older messages.',
  },
  {
    primitive: 'Markdown, CodeBlock',
    feature: 'Assistant messages, code blocks, HTML preview',
    contract:
      'renderCodeBlock wraps each fenced block. HTML preview is off by default (disabledFeatures.htmlPreview); when a host turns it on, an HTML block puts its preview in CodeBlock body, so the toggle swaps source and preview in place. The preview is click-to-preview: it consents to that code only, so changed or streamed-again code shows its source until clicked again, and nothing previews while streaming. One live frame at a time: the inline frame unmounts while the expand dialog shows the preview. The frame is sandbox="allow-scripts" only, with a no-referrer meta and a CSP (default-src none, inline styles and scripts, data and https images and fonts).',
  },
  {
    primitive: 'ToolCall, DisclosureTree',
    feature: 'Agent tool calls, Traces section, tree messages',
    contract:
      'ToolCall with its sections, each section\'s open state held by the renderer. Traces and tree messages are DisclosureTree, an ARIA tree: give it aria-label (ApChat uses the section title, or "Details" for a tree message) and memoize items. Traces build children lazily as a function and hold open rows with expanded and onExpandedChange, so they survive the section closing. Tree messages build their children up front and open rows with defaultExpanded.',
  },
  {
    primitive: 'Icons in any primitive slot',
    feature: 'Custom header actions, message actions, resource items, tree spans',
    contract:
      'Service icons are lucide names (kebab-case or PascalCase), loaded on first use; an unknown name shows a neutral box. Material takes Material Icons names, so a host that switches renderers keeps one set per renderer.',
  },
  {
    primitive: 'DropzoneOverlay',
    feature: 'Dropping and pasting attachments on the panel',
    contract:
      'Pass what is left of maxCount as maxFiles, since the overlay counts each drop on its own. ApChat passes typesHint, sizeHint and countHint (formatted by the host, countHint empty unless several files are allowed) and the overlay lists them under the drop hint. With enablePaste the overlay takes pasted files too: a paste that attaches a file does not paste its name, and one whose files are all refused keeps its text.',
  },
  {
    primitive: 'Attachment, ChatComposerAttachments',
    feature: 'Composer chips and message attachments',
    contract:
      'Chips are 30px tall in both densities: message chips are xs, and composer chips follow the ancestor (xs when compact, sm with the xs padding otherwise, since ChatComposerAttachments has no chip size option yet). A cut-off name shows in full in the tooltip AttachmentTitle renders by default; ApChat adds no title of its own.',
  },
  {
    primitive: 'EmptyState',
    feature: 'Empty states in panels such as history',
    contract:
      'size="compact", or no size under a compact ancestor, renders no heading element. The history popover uses size="compact" in both densities, so its empty and no-results states add nothing to the page outline.',
  },
  {
    primitive: 'ThinkingIndicator',
    feature: 'Loading messages while a reply is pending',
    contract:
      "ThinkingIndicator rotates its messages itself, every interval ms, and stops rotating under reduced motion. ApChat supplies the loading provider's messages and duration as messages and interval, and a stable label for screen readers.",
  },
];

// ─── Compositions from the renderer ─────────────────────────────────────────

interface Snippet {
  title: string;
  source: string;
  note: string;
  code: string;
  /** A playground story that shows the snippet running. */
  story?: { id: string; label: string };
}

// Lifted from the renderer and trimmed; `// ...` marks omitted lines.
const SNIPPETS: Snippet[] = [
  {
    title: 'Message row with action bar',
    source: 'wind/messages/chat-message.tsx, wind/messages/message-action-bar.tsx',
    note: 'The user message sits in a Bubble, the reply as prose. The action bar lives inside MessageContent so it follows the message alignment, and always shows on the latest reply.',
    code: `<Message align={isUser ? 'end' : 'start'} data-role={message.role} className="text-foreground">
  <MessageContent className={cn('@container gap-0', injected && 'w-full')}>
    {/* ... attachments row, injected renderers */}
    {isUser ? (
      <Bubble variant="secondary" className={USER_BUBBLE}>
        <BubbleContent>
          <Body message={message} />
        </BubbleContent>
      </Bubble>
    ) : (
      <div className="min-w-0 pr-8 text-sm leading-relaxed">
        <Body message={message} />
      </div>
    )}
    {isLastInGroup && !isUser && <MessageSources message={message} />}
    {showActions && (
      <MessageActionBar message={message} isLatestReply={isLatestReply} copyText={copyText} />
    )}
  </MessageContent>
</Message>

// MessageActionBar
<MessageActions
  visibility={isLatestReply ? 'always' : 'hover'}
  actions={[...inBar, ...inMenu].map(toItem)}
  maxVisible={inBar.length}
  className="mt-1 -mb-7 px-0"
  strings={{ label: _(msg\`Message actions\`), more: _(msg\`More actions\`) }}
>
  {copy && (
    <MessageActionCopy
      text={copyText}
      onClick={() => runAction(copy)}
      strings={{ copy: copy.label, copied: _(msg\`Copied\`) }}
    />
  )}
  {(good || bad) && (
    <MessageActionFeedback value={/* ... */} onChange={/* ... */} strings={/* ... */} />
  )}
</MessageActions>`,
  },
  {
    title: 'Composer with attachments and the panel dropzone',
    source: 'wind/composer/chat-composer.tsx, wind/composer/chat-dropzone.tsx',
    note: 'The renderer holds the draft and passes it as a controlled value; ChatComposer holds the status and chips for its parts, which read them from context, and takes its density from the chat root. The whole panel is the drop and paste target, with maxFiles set to what is left of the total and the limits as structured hints.',
    code: `<ChatComposer
  value={value}
  onValueChange={changeValue}
  onSubmit={(content) => { /* send, clear */ }}
  status={isResponseInFlight ? 'streaming' : 'idle'}
  onStop={canStopResponse ? stop : undefined}
  submitDisabled={/* ... */}
  attachments={items}
  onRemoveAttachment={(item) => { /* ... */ }}
  strings={strings}
>
  {/* ... ChatComposerError when the service reports one */}
  <ChatComposerInputGroup>
    <ChatComposerAttachments /* ... */ />
    <ChatComposerTextarea ref={textarea} minRows={spacing.promptBox.minRows} maxRows={spacing.promptBox.maxRows} />
    <ChatComposerToolbar>
      {/* ... only when disabledFeatures.attachments is off, with the limits in a tooltip */}
      <ChatComposerAttachButton accept={accept} maxSize={allowedAttachments.maxSize} /* ... */ />
      <ChatComposerSubmit variant="default" />
    </ChatComposerToolbar>
  </ChatComposerInputGroup>
  <ChatComposerFooter className="text-[10px]">{footerDisclaimer}</ChatComposerFooter>
</ChatComposer>

// WindChatDropzone, around the whole panel
<DropzoneOverlay
  disabled={inactive}
  accept={accept}
  maxSize={allowedAttachments.maxSize}
  maxFiles={remaining}
  // A paste of refused files keeps its text; one that attaches a file does not paste its name.
  enablePaste
  onFiles={(accepted, rejected) => { void takeFiles(accepted, rejected); }}
  strings={{ dropHint: _(msg\`Drop files here\`), ...limitHints }} // countHint, sizeHint, typesHint
>
  {children}
</DropzoneOverlay>`,
  },
  {
    title: 'Tool call with a traces tree',
    source: 'wind/renderers/tool-call-renderer.tsx',
    note: 'Sections start closed, except the escalation task links, which open with the card the first time a call waits on people. Their open state is held by the renderer, so it survives the card closing. Traces are a DisclosureTree whose levels are built only when their row opens, with open rows held above it.',
    code: `<ToolCall status={STATUS[state ?? 'unknown']} open={open} onOpenChange={setOpen}
  strings={strings.toolCall} jsonTreeStrings={strings.jsonTree} className="px-0">
  <ToolCallHeader name={getToolCallName({ toolName, span })} duration={/* ... */} />
  {displayMode !== 'ToolNameOnly' && (
    <ToolCallContent>
      <ToolCallInput value={values.input} renderValue={renderValue} {...sectionProps('input')} />
      {showTraces && span && (
        <ToolCallSection title={strings.traces} {...sectionProps('traces')}>
          <TraceList span={span} label={strings.traces} expanded={openTraceRows} onExpandedChange={onTraceRowChange} />
        </ToolCallSection>
      )}
      {/* ... escalation task links */}
      <ToolCallError value={values.error} renderValue={renderValue} {...sectionProps('errors')} />
      <ToolCallOutput value={values.output} renderValue={renderValue} {...sectionProps('output')} />
    </ToolCallContent>
  )}
</ToolCall>

// Built level by level as rows open, so a large trace costs nothing until someone looks.
function toTraceItems(nodes: readonly ToolCallSpanNode[]): DisclosureTreeItem[] {
  return nodes.map((node) => {
    const children = getVisibleTraceChildren(node);
    return {
      id: node.key,
      label: node.name.replace('_', ' '),
      icon: /* the span's own SVG icon */,
      expandable: children.length > 0,
      children: () => toTraceItems(children),
    };
  });
}

// TraceList: the top rows, built only while the Traces section is open
const items = React.useMemo(() => toTraceItems(getVisibleTraceChildren(span)), [span]);
<DisclosureTree items={items} aria-label={label} expanded={expanded} onExpandedChange={onExpandedChange} />`,
  },
  {
    title: 'First-run hero with suggestions',
    source: 'wind/first-run/first-run.tsx, wind/first-run/suggestion-list.tsx',
    note: 'Docked in a panel, centered in FullScreen with a logo and one horizontal suggestion row.',
    code: `<ChatHero layout={layout} density={density} data-first-run={shown || undefined}>
  {shown && (
    <ChatHeroHeader>
      {centered && (
        <ChatHeroLogo>
          <AutopilotLogo className="size-10" />
        </ChatHeroLogo>
      )}
      <ChatHeroTitle>{firstRunExperience?.title}</ChatHeroTitle>
      <ChatHeroDescription>{firstRunExperience?.description}</ChatHeroDescription>
    </ChatHeroHeader>
  )}
  {shown && suggestions.length > 0 && (
    <SuggestionList
      suggestions={suggestions}
      sendOnClick={firstRunExperience?.sendOnClick ?? false}
      orientation={centered ? 'horizontal' : 'vertical'}
    />
  )}
  {shown && showLoading && <ThinkingRow />}
  {children /* the composer, when centered */}
</ChatHero>

// SuggestionList
<PromptSuggestions
  suggestions={suggestions}
  density={spacing.compactMode ? 'compact' : 'comfortable'}
  onSelect={({ label, prompt }) => select({ label, prompt: prompt ?? label }, sendOnClick)}
  strings={{ label: _(msg\`Suggestions\`) }}
/>`,
  },
  {
    title: 'Code blocks with expand and HTML preview',
    source: 'wind/renderers/markdown-renderer.tsx, wind/renderers/chat-code-block.tsx',
    story: { id: `${PLAYGROUND}--html-preview`, label: 'HTML preview' },
    note: 'Every fenced block goes through renderCodeBlock. HTML preview is off by default (disabledFeatures.htmlPreview). With it on, an HTML block shows its source until the reader clicks Preview, then the preview replaces it in the block body; the expand dialog shows whichever view is on, and the inline frame unmounts meanwhile.',
    code: `const renderCodeBlock = React.useCallback(
  (block: MarkdownCodeBlock, props: CodeBlockProps) => (
    <ChatCodeBlock block={block} codeBlockProps={props} htmlPreview={htmlPreview} streaming={streaming} />
  ),
  [htmlPreview, streaming]
);

<Markdown streaming={streaming} codeWrap remarkPlugins={REMARK_PLUGINS} components={COMPONENTS}
  renderCodeBlock={renderCodeBlock} strings={strings}>
  {content}
</Markdown>

// ChatCodeBlock: the click consents to this code only
const [previewedCode, setPreviewedCode] = React.useState<string | null>(null);
const showPreview = previewable && !streaming && previewedCode === block.code;
const [expanded, setExpanded] = React.useState(false);

<CodeBlock
  {...codeBlockProps}
  actions={
    <>
      {previewable && (
        <Button variant="ghost" size="2xs" icon aria-label={toggleLabel} disabled={streaming}
          onClick={() => setPreviewedCode(showPreview ? null : block.code)}>
          {showPreview ? <Code aria-hidden /> : <Eye aria-hidden />}
        </Button>
      )}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        {/* ... expand trigger; DialogContent container={dialogContainer} with the preview or the code */}
      </Dialog>
      {codeBlockProps.actions}
    </>
  }
  body={
    showPreview && (
      <div className="h-100 resize-y overflow-hidden">
        {!expanded && <HtmlPreviewFrame code={block.code} title={previewTitle} />}
      </div>
    )
  }
/>

// HtmlPreviewFrame: scripts may run, but without allow-same-origin the page cannot reach the host
const PREVIEW_CSP =
  "default-src 'none'; img-src data: https:; font-src data: https:; style-src 'unsafe-inline'; script-src 'unsafe-inline'";

<iframe
  sandbox="allow-scripts"
  srcDoc={buildHtmlPreviewDocument(code, { contentSecurityPolicy: PREVIEW_CSP })}
  title={title}
/>`,
  },
  {
    title: 'History popover',
    source:
      'wind/history/chat-history.tsx, wind/common/panel-popover.tsx, wind/history/history-panel.tsx',
    note: 'A popover under the header button, held inside the panel. It is not modal, so a host dialog opened from a rename or delete pre-hook stays usable. Search keeps its clear button with chat strings, and the empty states are compact EmptyState.',
    code: `<Popover open={open && !!anchor} onOpenChange={(next) => { if (!next) onClose(); }}>
  <PopoverAnchor virtualRef={virtualAnchor} />
  <PopoverContent
    aria-label={label}
    align="start"
    collisionBoundary={boundary}
    collisionPadding={PANEL_INSET}
    onPointerDownOutside={/* keep open for the anchor and host dialogs */}
    className={cn('flex flex-col p-0 motion-reduce:animate-none!', className)}
  >
    {children}
  </PopoverContent>
</Popover>

// HistoryPanel
<Search
  ref={searchInput}
  value={searchQuery}
  onChange={setSearchQuery}
  // The clear button goes away with the query; keep focus in the field.
  onClear={() => searchInput.current?.focus()}
  strings={{ clear: _(msg\`Clear search\`) }}
  placeholder={searchLabel}
  aria-label={searchLabel}
  disabled={!historyOpen}
/>

// Empty and no-results states
<EmptyState size="compact" title={_(msg\`No chat history\`)} className="flex-1" />`,
  },
];

// ─── Primitive index ────────────────────────────────────────────────────────

interface PrimitivePage {
  name: string;
  storyId: string;
  role: string;
}

const PRIMITIVES: PrimitivePage[] = [
  {
    name: 'Message',
    storyId: 'apollo-wind-chat-components-message--assistant',
    role: 'One turn: avatar, header, body, footer',
  },
  {
    name: 'Bubble',
    storyId: 'apollo-wind-chat-components-bubble--variants',
    role: 'The user message surface',
  },
  {
    name: 'Message Scroller',
    storyId: 'apollo-wind-chat-components-message-scroller--basic',
    role: 'Auto-follow, turn anchoring, prepended history, jump to latest',
  },
  {
    name: 'Message Actions',
    storyId: 'apollo-wind-chat-components-message-actions--always-visible',
    role: 'Copy, feedback and host actions with an overflow menu',
  },
  {
    name: 'Markdown',
    storyId: 'apollo-wind-chat-components-markdown--basic',
    role: 'Assistant prose, tables, math, code, with renderCodeBlock for previews',
  },
  {
    name: 'Code Block',
    storyId: 'apollo-wind-chat-components-code-block--custom-body',
    role: 'Highlighted code, header actions and a body slot',
  },
  {
    name: 'Sources',
    storyId: 'apollo-wind-chat-components-sources--collapsed',
    role: 'The collapsible sources list under a reply',
  },
  {
    name: 'Citation',
    storyId: 'apollo-wind-chat-components-citation--in-prose',
    role: 'Inline citation markers with a source preview',
  },
  {
    name: 'Tool Call',
    storyId: 'apollo-wind-chat-components-tool-call--completed',
    role: 'Tool call status line with input, output, errors and custom sections',
  },
  {
    name: 'Disclosure Tree',
    storyId: 'apollo-wind-chat-components-disclosure-tree--basic',
    role: 'Read-only ARIA tree for traces and nested results',
  },
  {
    name: 'Chat Composer',
    storyId: 'apollo-wind-chat-components-chatcomposer--with-dropzone-limits',
    role: 'Prompt input with attachments, stop and the DropzoneOverlay',
  },
  {
    name: 'Attachment',
    storyId: 'apollo-wind-chat-components-attachment--long-names',
    role: 'File chips with upload states and a truncation tooltip',
  },
  {
    name: 'Chat Hero',
    storyId: 'apollo-wind-chat-components-chat-hero--centered',
    role: 'First-run welcome, docked or centered around the composer',
  },
  {
    name: 'Prompt Suggestions',
    storyId: 'apollo-wind-chat-components-prompt-suggestions--horizontal',
    role: 'Suggestion chips, as a list or one scrolling row',
  },
  {
    name: 'Thinking Indicator',
    storyId: 'apollo-wind-chat-components-thinking-indicator--rotating',
    role: 'The pending-reply row with host-driven labels',
  },
  {
    name: 'Empty State',
    storyId: 'apollo-wind-components-feedback-empty-state--compact',
    role: 'Compact empty messages for panels, with no heading',
  },
  {
    name: 'Modal (Dialog) strings',
    storyId: 'apollo-wind-components-overlays-modal--strings',
    role: 'Translatable close, expand and collapse labels',
  },
  {
    name: 'Sheet strings',
    storyId: 'apollo-wind-components-overlays-drawer-sheet--strings',
    role: 'Translatable close label',
  },
  {
    name: 'Search strings',
    storyId: 'apollo-wind-components-navigation-search--strings',
    role: 'Translatable clear button label',
  },
];

// ─── Page ───────────────────────────────────────────────────────────────────

function AutopilotChatGuidancePage({ globalTheme }: { globalTheme: string }) {
  return (
    <GuidancePage
      globalTheme={globalTheme}
      maxWidth="max-w-5xl"
      title="Autopilot Chat"
      intro="How the apollo-wind chat primitives are consumed inside the ApChat ecosystem: where ApChat lives, the contracts its Wind renderer relies on, compositions taken from that renderer, and the live chat embedded from the Apollo React playground."
    >
      <Divider />

      <section>
        <SectionTitle>Where ApChat lives</SectionTitle>
        <SectionDescription>
          ApChat, the service-driven Autopilot chat, ships in apollo-react. apollo-wind ships the
          primitives it is built from, and nothing service-side.
        </SectionDescription>
        <GuidanceList>
          <GuidanceItem>
            <InlineCode>@uipath/apollo-react/chat</InlineCode> renders with Wind by default. Hosts
            on <InlineCode>@uipath/apollo-react/ap-chat</InlineCode> keep Material and opt in per
            service with <InlineCode>renderer: 'wind'</InlineCode>, or later with{' '}
            <InlineCode>setRenderer('wind')</InlineCode>. The transcript and state stay, since they
            live in the service.
          </GuidanceItem>
          <GuidanceItem>
            Wind needs Tailwind utilities for its classes and the apollo-wind theme, from exactly
            one of: the host's own Tailwind v4 build with <InlineCode>@source</InlineCode> lines for
            apollo-wind and <InlineCode>@uipath/apollo-react/dist/chat</InlineCode>, or the
            precompiled <InlineCode>@uipath/apollo-react/chat/styles/tailwind.chat.css</InlineCode>.
            Do not import the precompiled sheet next to your own Tailwind build, and do not combine{' '}
            <InlineCode>tailwind.chat.css</InlineCode> with{' '}
            <InlineCode>tailwind.canvas.css</InlineCode> or apollo-wind's{' '}
            <InlineCode>styles.css</InlineCode>: each carries its own theme and utility order.
          </GuidanceItem>
          <GuidanceItem>
            apollo-wind has no chat service, no history or settings panels, no citation pre-hook,
            and no Lingui catalog. A UI built from the primitives alone owns all of that.
          </GuidanceItem>
        </GuidanceList>
      </section>

      <Divider />

      <section className="flex flex-col gap-8">
        <div>
          <SectionTitle>Live examples</SectionTitle>
          <SectionDescription>
            The Apollo React Chat playground, embedded from this Storybook. Each frame loads the
            real ApChat with a fake service, so it shows exactly what ships. In Compare renderers
            the Material side takes a few seconds longer to appear than the Wind side.
          </SectionDescription>
          <InfoCallout>
            The frames are separate Storybook previews. They take this page's theme from the toolbar
            when the page renders (through the <InlineCode>globals</InlineCode> URL parameter), but
            a theme change reloads them, and their own controls and state are not shared with this
            page. Open a story to use its controls.
          </InfoCallout>
        </div>
        {EMBEDS.map((embed) => (
          <LiveExample key={embed.title} embed={embed} theme={globalTheme} />
        ))}
      </section>

      <Divider />

      <section>
        <SectionTitle>Primitives and the contracts ApChat relies on</SectionTitle>
        <SectionDescription>
          What the Wind renderer expects from each primitive, and what a host composing the same
          primitives needs to honour to match it.
        </SectionDescription>
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-56">Primitive</TableHead>
                <TableHead className="w-56">ApChat feature</TableHead>
                <TableHead>Contract to honour</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CONTRACTS.map((row) => (
                <TableRow key={row.primitive + row.feature}>
                  <TableCell className="align-top font-medium whitespace-normal">
                    {row.primitive}
                  </TableCell>
                  <TableCell className="align-top whitespace-normal text-muted-foreground">
                    {row.feature}
                  </TableCell>
                  <TableCell className="align-top whitespace-normal text-muted-foreground">
                    {row.contract}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <Divider />

      <section className="flex flex-col gap-8">
        <div>
          <SectionTitle>Compositions from the renderer</SectionTitle>
          <SectionDescription>
            Trimmed from <InlineCode>packages/apollo-react/src/chat/wind</InlineCode>;{' '}
            <InlineCode>{'// ...'}</InlineCode> marks left-out code. The renderer's Lingui calls are
            shortened to <InlineCode>_(msg`...`)</InlineCode>; the source also passes a message id.
          </SectionDescription>
        </div>
        {SNIPPETS.map((snippet) => (
          <div key={snippet.title} className="flex flex-col gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{snippet.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{snippet.note}</p>
            </div>
            <SourceBlock code={snippet.code} language="tsx" wrap />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{snippet.source}</p>
              {snippet.story && (
                <a
                  href={`./?path=/story/${snippet.story.id}`}
                  target="_top"
                  className="inline-flex items-center gap-1 text-sm font-medium text-foreground underline underline-offset-4"
                >
                  Open the {snippet.story.label} story
                  <ArrowUpRight aria-hidden className="size-4" />
                </a>
              )}
            </div>
          </div>
        ))}
      </section>

      <Divider />

      <section>
        <SectionTitle>Primitive index</SectionTitle>
        <SectionDescription>
          Each primitive on its own page, with variants, states and options.
        </SectionDescription>
        <ul className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border-subtle">
          {PRIMITIVES.map((page) => (
            <li key={page.name} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-medium text-foreground">{page.name}</span>
                <span className="text-xs text-muted-foreground">{page.role}</span>
              </div>
              <Button variant="outline" size="sm" asChild className="shrink-0">
                {/* Relative to the iframe path so the link also works when Storybook is hosted under a subpath. */}
                <a
                  href={`./?path=/story/${page.storyId}`}
                  target="_top"
                  aria-label={`Open the ${page.name} story`}
                >
                  Open
                  <ArrowUpRight aria-hidden />
                </a>
              </Button>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Overlays (Popover, Tooltip, DropdownMenu, Dialog, Sheet) animate with the{' '}
          <InlineCode>animate-in</InlineCode>, <InlineCode>fade-*</InlineCode>,{' '}
          <InlineCode>zoom-*</InlineCode> and <InlineCode>slide-*</InlineCode> utilities defined in
          apollo-wind's stylesheet, and stop under reduced motion.
        </p>
      </section>

      <Divider />

      <section>
        <SectionTitle>What is not in apollo-wind</SectionTitle>
        <GuidanceList>
          <GuidanceItem>
            The <InlineCode>AutopilotChatService</InlineCode>: models, agent modes, streaming,
            message groups, pre-hooks, events and feature flags.
          </GuidanceItem>
          <GuidanceItem>
            History and settings panels, the header and its custom actions, first-run wiring and
            loading states.
          </GuidanceItem>
          <GuidanceItem>
            Citation and resource-token parsing, the citation pre-hook and cited-range highlights.
          </GuidanceItem>
          <GuidanceItem>Translations: the primitives take copy through strings only.</GuidanceItem>
        </GuidanceList>
        <div className="mt-6">
          <InfoCallout>
            Everything service-side is documented in{' '}
            <InlineCode>packages/apollo-react/src/chat/DOCS.md</InlineCode>: the service API, the
            setup for each renderer, the styles a host imports and the intended differences between
            the renderers.
          </InfoCallout>
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>Keeping this page honest</SectionTitle>
        <GuidanceList>
          <GuidanceItem>
            The live examples are the real Apollo React Chat playground, so what they render tracks
            the chat. Their captions and scenario args do not: update them when the playground
            scenarios change.
          </GuidanceItem>
          <GuidanceItem>
            Each snippet names its source file under{' '}
            <InlineCode>packages/apollo-react/src/chat/wind</InlineCode>, and the contract rows come
            from those renderer files and{' '}
            <InlineCode>packages/apollo-react/src/chat/DOCS.md</InlineCode>. When those files
            change, refresh the matching snippet and row in this page.
          </GuidanceItem>
        </GuidanceList>
      </section>
    </GuidancePage>
  );
}

export const AutopilotChat: Story = {
  name: 'Autopilot Chat',
  render: (_args, { globals }) => (
    <AutopilotChatGuidancePage globalTheme={globals.theme || 'future-dark'} />
  ),
};
