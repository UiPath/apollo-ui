import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import {
  Button,
  CodeBlock,
  type CodeBlockProps,
  cn,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  type MarkdownCodeBlock,
} from '@uipath/apollo-wind';
import { Code, Eye, Maximize2 } from 'lucide-react';
import React from 'react';

import { buildHtmlPreviewDocument } from '../../headless/markdown/html-preview';
import { useDialogContainer } from '../common/dialog-container';

// Inline styles and scripts, and images and fonts from data: or https:, cover ordinary snippets;
// nothing else loads (no fetch, no external scripts or stylesheets, no nested frames).
const PREVIEW_CSP =
  "default-src 'none'; img-src data: https:; font-src data: https:; style-src 'unsafe-inline'; script-src 'unsafe-inline'";

interface ChatCodeBlockProps {
  block: MarkdownCodeBlock;
  /** What Markdown would pass `CodeBlock`. */
  codeBlockProps: CodeBlockProps;
  /** `disabledFeatures.htmlPreview` is off, so HTML blocks offer a preview. */
  htmlPreview: boolean;
  /** The message is still streaming: the block may be incomplete, so it is not previewed yet. */
  streaming: boolean;
}

function HtmlPreviewFrame({
  code,
  title,
  className,
}: {
  code: string;
  title: string;
  className?: string;
}) {
  return (
    <iframe
      data-slot="wind-chat-html-preview"
      // Scripts may run, but without allow-same-origin the page cannot reach the host.
      sandbox="allow-scripts"
      srcDoc={buildHtmlPreviewDocument(code, { contentSecurityPolicy: PREVIEW_CSP })}
      title={title}
      className={cn('block size-full bg-white', className)}
    />
  );
}

/**
 * A fenced code block with Material's header actions: for HTML when enabled, a toggle between the
 * source and a sandboxed preview in place, and an expand to a large view of whichever is shown.
 * The preview may run scripts but never shares the host's origin, and only renders once asked.
 */
export function ChatCodeBlock({
  block,
  codeBlockProps,
  htmlPreview,
  streaming,
}: ChatCodeBlockProps) {
  const { _ } = useLingui();
  const dialogContainer = useDialogContainer();
  const previewable = htmlPreview && block.language?.trim().toLowerCase() === 'html';
  // Unlike Material, the preview waits for the reader: the frame runs the snippet's scripts, so
  // model output never executes unasked. The click consents to this code only; react-markdown
  // reuses the block by position, so new code in it (replaced or streamed again) needs a new
  // click, and so does turning the flag back on.
  const [previewedCode, setPreviewedCode] = React.useState<string | null>(null);
  if (!previewable && previewedCode !== null) {
    setPreviewedCode(null);
  }
  const showPreview = previewable && !streaming && previewedCode === block.code;
  // One live frame at a time: the inline one gives way while the dialog shows the preview.
  const [expanded, setExpanded] = React.useState(false);
  const codeLabel = _(msg({ id: 'autopilot-chat.message.code-block-code', message: `Show code` }));
  const previewLabel = _(
    msg({ id: 'autopilot-chat.message.code-block-preview', message: `Preview` })
  );
  const previewTitle = _(
    msg({ id: 'autopilot-chat.message.html-preview', message: `HTML preview` })
  );
  const expandLabel = _(msg({ id: 'autopilot-chat.message.expand', message: `Expand` }));
  const closeLabel = _(msg({ id: 'autopilot-chat.message.dialog-close', message: `Close` }));
  const toggleLabel = showPreview ? codeLabel : previewLabel;

  const actions = (
    <>
      {previewable && (
        <Button
          variant="ghost"
          size="2xs"
          icon
          aria-label={toggleLabel}
          title={toggleLabel}
          disabled={streaming}
          onClick={() => setPreviewedCode(showPreview ? null : block.code)}
        >
          {showPreview ? <Code aria-hidden /> : <Eye aria-hidden />}
        </Button>
      )}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="2xs" icon aria-label={expandLabel} title={expandLabel}>
            <Maximize2 aria-hidden />
          </Button>
        </DialogTrigger>
        <DialogContent
          container={dialogContainer}
          strings={{ close: closeLabel }}
          // Not into the preview: keys pressed inside the frame never reach the dialog, so
          // Escape would not close it.
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            (event.currentTarget as HTMLElement | null)?.focus();
          }}
          aria-describedby={undefined}
          className="flex h-[90vh] max-h-[900px] w-[95vw] max-w-[1400px] flex-col gap-3 p-4 sm:max-w-[1400px]"
        >
          {/* Clear of the primitive's close button in the top corner. */}
          <DialogTitle className="truncate pr-8 text-sm leading-4">
            {showPreview ? previewTitle : block.language?.trim() || codeLabel}
          </DialogTitle>
          <div className="min-h-0 flex-1 overflow-auto">
            {showPreview ? (
              <HtmlPreviewFrame
                code={block.code}
                title={previewTitle}
                className="rounded-lg border border-border-subtle"
              />
            ) : (
              <CodeBlock code={block.code} language={block.language} wrap hideHeader />
            )}
          </div>
        </DialogContent>
      </Dialog>
      {codeBlockProps.actions}
    </>
  );

  return (
    <CodeBlock
      {...codeBlockProps}
      actions={actions}
      body={
        showPreview && (
          // Material's height, resizable by the reader.
          <div className="h-100 resize-y overflow-hidden">
            {!expanded && <HtmlPreviewFrame code={block.code} title={previewTitle} />}
          </div>
        )
      }
    />
  );
}
