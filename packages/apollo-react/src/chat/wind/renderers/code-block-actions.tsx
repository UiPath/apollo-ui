import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import {
  Button,
  CodeBlock,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  type MarkdownCodeBlock,
} from '@uipath/apollo-wind';
import { Code, Eye, Maximize2, X } from 'lucide-react';
import React from 'react';

import { buildHtmlPreviewDocument } from '../../headless/markdown/html-preview';
import { useDialogContainer } from '../common/dialog-container';

type View = 'code' | 'preview';

// Inline styles and scripts, and images and fonts from data: or https:, cover ordinary snippets;
// nothing else loads (no fetch, no external scripts or stylesheets, no nested frames).
const PREVIEW_CSP =
  "default-src 'none'; img-src data: https:; font-src data: https:; style-src 'unsafe-inline'; script-src 'unsafe-inline'";

interface CodeBlockActionsProps {
  block: MarkdownCodeBlock;
  /** `disabledFeatures.htmlPreview` is off, so HTML blocks offer a preview. */
  htmlPreview: boolean;
  /** The message is still streaming: the block may be incomplete, so it is not previewed yet. */
  streaming: boolean;
}

/**
 * Header actions for a fenced code block, as in Material: expand to a large view and, for HTML
 * when enabled, a preview. The preview is a sandboxed iframe that may run scripts but never shares
 * the host's origin.
 */
export function CodeBlockActions({ block, htmlPreview, streaming }: CodeBlockActionsProps) {
  const { _ } = useLingui();
  const [view, setView] = React.useState<View | null>(null);
  const dialogContainer = useDialogContainer();
  // Two buttons open the dialog and neither is a DialogTrigger, so focus returns by hand.
  const opener = React.useRef<HTMLButtonElement | null>(null);
  const openAs = (next: View) => (event: React.MouseEvent<HTMLButtonElement>) => {
    opener.current = event.currentTarget;
    setView(next);
  };
  const previewable = htmlPreview && block.language?.trim().toLowerCase() === 'html';
  // Falls back to the code if the flag is turned off or the block streams again while open.
  const showPreview = view === 'preview' && previewable && !streaming;
  const codeLabel = _(msg({ id: 'autopilot-chat.message.code-block-code', message: `Show code` }));
  const previewLabel = _(
    msg({ id: 'autopilot-chat.message.code-block-preview', message: `Preview` })
  );
  const previewTitle = _(
    msg({ id: 'autopilot-chat.message.html-preview', message: `HTML preview` })
  );
  const expandLabel = _(msg({ id: 'autopilot-chat.message.expand', message: `Expand` }));
  const closeLabel = _(msg({ id: 'autopilot-chat.message.dialog-close', message: `Close` }));

  return (
    <>
      {previewable && (
        <Button
          variant="ghost"
          size="2xs"
          icon
          aria-label={previewLabel}
          title={previewLabel}
          disabled={streaming}
          onClick={openAs('preview')}
        >
          <Eye aria-hidden />
        </Button>
      )}
      <Button
        variant="ghost"
        size="2xs"
        icon
        aria-label={expandLabel}
        title={expandLabel}
        onClick={openAs('code')}
      >
        <Maximize2 aria-hidden />
      </Button>
      <Dialog open={view !== null} onOpenChange={(open) => !open && setView(null)}>
        <DialogContent
          container={dialogContainer}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
          showCloseButton={false}
          aria-describedby={undefined}
          className="flex h-[90vh] max-h-[900px] w-[95vw] max-w-[1400px] flex-col gap-3 p-4 sm:max-w-[1400px]"
        >
          <div className="flex items-center gap-2">
            <DialogTitle className="min-w-0 flex-1 truncate text-sm">
              {showPreview ? previewTitle : block.language?.trim() || codeLabel}
            </DialogTitle>
            {previewable && (
              <Button
                variant="ghost"
                size="2xs"
                icon
                aria-label={showPreview ? codeLabel : previewLabel}
                title={showPreview ? codeLabel : previewLabel}
                disabled={streaming}
                onClick={() => setView(showPreview ? 'code' : 'preview')}
              >
                {showPreview ? <Code aria-hidden /> : <Eye aria-hidden />}
              </Button>
            )}
            <DialogClose asChild>
              <Button variant="ghost" size="2xs" icon aria-label={closeLabel} title={closeLabel}>
                <X aria-hidden />
              </Button>
            </DialogClose>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {showPreview ? (
              <iframe
                data-slot="wind-chat-html-preview"
                // Scripts may run, but without allow-same-origin the page cannot reach the host.
                sandbox="allow-scripts"
                srcDoc={buildHtmlPreviewDocument(block.code, {
                  contentSecurityPolicy: PREVIEW_CSP,
                })}
                title={previewTitle}
                className="size-full rounded-lg border border-border-subtle bg-white"
              />
            ) : (
              <CodeBlock code={block.code} language={block.language} wrap hideHeader />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
