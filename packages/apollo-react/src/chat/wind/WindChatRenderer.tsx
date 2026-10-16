import { PortalContainerProvider, TooltipProvider } from '@uipath/apollo-wind';
import React from 'react';
import { createPortal } from 'react-dom';

import { type ChatLayout, resolveChatLayout } from '../headless/layout/chat-layout';
import { useChatState } from '../headless/providers/chat-state-provider';
import { useChatWidth } from '../headless/providers/chat-width-provider';
import { useTheme } from '../headless/providers/theme-provider';
import { AutopilotChatMode, CHAT_CONTAINER_ANIMATION_DURATION } from '../service';
import { useOpenTransition } from './hooks/use-open-transition';
import { EmbeddedLayout } from './layout/embedded-layout';
import { FullScreenLayout } from './layout/full-screen-layout';
import { SideBySidePlaceholder } from './layout/side-by-side-placeholder';

// Same footprint as the Material renderer per mode, so switching renderers does not move the host.
const ROOT_SIZE: Record<Exclude<AutopilotChatMode, AutopilotChatMode.Closed>, string> = {
  [AutopilotChatMode.Embedded]: 'absolute inset-0',
  [AutopilotChatMode.FullScreen]:
    'relative w-screen border-r border-b border-border-de-emp h-[calc(100vh-48px)] data-full-height:h-screen',
  [AutopilotChatMode.SideBySide]:
    'relative w-[var(--chat-width)] border-r border-b border-border-de-emp h-[calc(100vh-48px)] data-full-height:h-screen',
};

function LayoutForMode({ layout }: { layout: ChatLayout }) {
  switch (layout.mode) {
    case AutopilotChatMode.FullScreen:
      return <FullScreenLayout layout={layout} />;
    case AutopilotChatMode.SideBySide:
      return <SideBySidePlaceholder />;
    default:
      return <EmbeddedLayout layout={layout} />;
  }
}

/**
 * The Wind chat renderer. Mounted by `ChatRoot`, which provides the headless state.
 */
export function WindChatRenderer() {
  const { theme } = useTheme();
  const { chatMode, disabledFeatures, readOnly, spacing, portalContainer } = useChatState();
  const { width } = useChatWidth();
  const { present, state } = useOpenTransition(
    chatMode !== AutopilotChatMode.Closed,
    CHAT_CONTAINER_ANIMATION_DURATION
  );

  // Keep showing the last open layout while the exit animation runs.
  const lastOpenMode = React.useRef(chatMode);
  if (chatMode !== AutopilotChatMode.Closed) {
    lastOpenMode.current = chatMode;
  }
  const renderedMode =
    lastOpenMode.current === AutopilotChatMode.Closed
      ? AutopilotChatMode.Embedded
      : lastOpenMode.current;
  const layout = resolveChatLayout({ chatMode: renderedMode, disabledFeatures, readOnly });

  // `ApChatTheme` values are the apollo-core / apollo-wind theme class names (future-light and
  // future-dark included), so the chat themes itself whatever the host's body class.
  const themeClass = theme;
  const density = spacing.compactMode ? 'compact' : undefined;
  const rootRef = React.useRef<HTMLDivElement>(null);

  // Not focusable or clickable while it fades out; Material hides instantly.
  React.useLayoutEffect(() => {
    rootRef.current?.toggleAttribute('inert', state === 'closed');
  }, [state]);
  // A host-provided portal target (e.g. inside a shadow root) is not under the themed root, so
  // overlays go into a themed node placed there instead.
  const [hostPortalNode, setHostPortalNode] = React.useState<HTMLElement | null>(null);

  if (!present) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      data-slot="wind-chat"
      data-mode={renderedMode}
      data-state={state}
      data-density={density}
      data-full-height={layout.fullHeight ? '' : undefined}
      style={
        {
          '--chat-width': `${width}px`,
          '--chat-transition-duration': `${CHAT_CONTAINER_ANIMATION_DURATION}ms`,
        } as React.CSSProperties
      }
      className={`${themeClass} ${ROOT_SIZE[renderedMode]} flex flex-col overflow-hidden bg-background text-foreground transition-[opacity,translate] duration-(--chat-transition-duration) ease-out data-[state=closed]:translate-y-2 data-[state=closed]:opacity-0 motion-reduce:transition-none`}
    >
      <PortalContainerProvider container={portalContainer ? hostPortalNode : undefined}>
        <TooltipProvider delayDuration={300}>
          <LayoutForMode layout={layout} />
        </TooltipProvider>
      </PortalContainerProvider>
      {portalContainer &&
        createPortal(
          <div ref={setHostPortalNode} className={themeClass} data-density={density} />,
          portalContainer
        )}
    </div>
  );
}

export default WindChatRenderer;
