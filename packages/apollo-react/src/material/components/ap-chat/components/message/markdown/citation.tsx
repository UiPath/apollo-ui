import React from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import {
  Box,
  Tooltip,
} from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core';

import { ApTypography } from '../../../ap-typography';
import { useChatScroll } from '../../../providers/chat-scroll-provider';
import { useChatService } from '../../../providers/chat-service.provider';
import { useChatState } from '../../../providers/chat-state-provider';
import {
  AutopilotChatPreHookAction,
  CHAT_CITATION_START,
  PdfCitation,
  UrlCitation,
} from '../../../service';

// Helpers for additive range highlighting
const getNearestStartMarker = (id: string | number, container: Element, endEl: Element): HTMLElement | null => {
    const candidates = Array.from(container.querySelectorAll(`.${CHAT_CITATION_START}[data-citation-ids~="${id}"]`)) as HTMLElement[];
    if (candidates.length === 0) {
        return null;
    }
    let nearest: HTMLElement | null = null;
    for (const marker of candidates) {
        const rel = marker.compareDocumentPosition(endEl);
        const isBefore = !!(rel & Node.DOCUMENT_POSITION_FOLLOWING) || !!(rel & Node.DOCUMENT_POSITION_CONTAINS);
        if (isBefore) {
            nearest = marker;
        }
    }
    return nearest;
};

type HighlightState = { highlightedElements: HTMLElement[]; wrappedTextSpans: HTMLElement[] };

const highlightRange = (startMarker: HTMLElement, endEl: HTMLElement, container: Element, color: string): HighlightState => {
    const highlightedElements: HTMLElement[] = [];
    const wrappedTextSpans: HTMLElement[] = [];

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    // Position walker just before start marker: iterate until startMarker found
    while (walker.nextNode()) {
        if (walker.currentNode === startMarker) {
            break;
        }
    }

    // Now advance and highlight until we reach endEl
    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node === endEl) {
            break;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (el === startMarker) {
                continue;
            }
            // Do not highlight our citation superscripts or anything inside them
            if (el.closest('[data-citation-sup="true"]')) {
                continue;
            }
            el.style.transition = 'background-color 0.2s';
            el.style.backgroundColor = color;
            highlightedElements.push(el);
        } else if (node.nodeType === Node.TEXT_NODE) {
            const text = node as Text;
            if (
                text.textContent &&
                text.textContent.trim().length > 0 &&
                text.parentElement &&
                // Skip text that lives inside citation superscripts
                !text.parentElement.closest('[data-citation-sup="true"]')
            ) {
                const span = document.createElement('span');
                span.style.backgroundColor = color;
                text.parentElement.insertBefore(span, text);
                span.appendChild(text);
                wrappedTextSpans.push(span);
            }
        }
    }

    return {
        highlightedElements,
        wrappedTextSpans,
    };
};

const clearHighlightRange = (state?: HighlightState) => {
    if (!state) {
        return;
    }
    state.highlightedElements.forEach(el => {
        el.style.backgroundColor = '';
        el.style.transition = '';
    });
    state.wrappedTextSpans.forEach(span => {
        const parent = span.parentNode;
        while (span.firstChild) {
            parent?.insertBefore(span.firstChild, span);
        }
        parent?.removeChild(span);
    });
};

export const Citation = React.memo(({
    id,
    title,
    url,
    page_number,
    download_url,
    messageId,
}: any) => {
    const { _ } = useLingui();
    const pageNumber = page_number;
    const pageText = page_number ? ` (${_(msg({ id: 'autopilot-chat.message.page-number', message: `Page ${pageNumber}` }))})` : '';
    const chatService = useChatService();
    const { spacing } = useChatState();
    const { overflowContainer } = useChatScroll();
    const ref = React.useRef<HTMLDivElement>(null);
    const [ open, setOpen ] = React.useState(false);
    const highlightStateRef = React.useRef<HighlightState>();
    const finalUrl = url || `${download_url}${page_number ? `#page=${page_number}` : ''}`;

    const handleOpen = React.useCallback(() => {
        setOpen(true);

        if (id && ref.current) {
            const container = ref.current.closest(`[id="${messageId}"]`)!;
            const startMarker = getNearestStartMarker(id, container, ref.current);
            if (startMarker) {
                highlightStateRef.current = highlightRange(
                    startMarker,
                    ref.current,
                    container,
                    'var(--color-background-highlight)',
                );
            }
        }
    }, [ id, messageId ]);

    const handleClose = React.useCallback(() => {
        setOpen(false);
        clearHighlightRange(highlightStateRef.current);
        highlightStateRef.current = undefined;
    }, []);

    const handleClick = React.useCallback(() => {
        if (!chatService) {
            return;
        }

        const source: UrlCitation | PdfCitation = url ? {
            id,
            title,
            url,
        } : {
            id,
            title,
            download_url,
            page_number,
        };

        chatService.getPreHook(AutopilotChatPreHookAction.CitationClick)({ citation: source })
            .then((proceed) => {
                if (!proceed || !finalUrl) {
                    return;
                }
                window.open(finalUrl, '_blank', 'noopener,noreferrer');
            });
    }, [ chatService, id, title, url, download_url, page_number, finalUrl ]);

    const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClick();
        }
    }, [ handleClick ]);

    // Close tooltip on scroll
    React.useEffect(() => {
        const handleScroll = () => {
            if (open) {
                setOpen(false);
                clearHighlightRange(highlightStateRef.current);
                highlightStateRef.current = undefined;
            }
        };

        if (open && overflowContainer) {
            // Listen to scroll events on the chat overflow container
            overflowContainer.addEventListener('scroll', handleScroll, { passive: true });
        }

        return () => {
            if (overflowContainer) {
                overflowContainer.removeEventListener('scroll', handleScroll);
            }
        };
    }, [ open, overflowContainer ]);

    return (
        <Tooltip
            open={open}
            placement="bottom-end"
            onOpen={handleOpen}
            onClose={handleClose}
            title={
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: token.Spacing.SpacingS,
                        cursor: finalUrl ? 'pointer' : 'default',
                        padding: `${token.Spacing.SpacingXs} ${token.Spacing.SpacingS}`,
                    }}
                    onClick={handleClick}
                >
                    <ap-icon
                        variant={ url ? 'custom' : 'outlined'}
                        name={ url ? 'website' : 'file_open'}
                        size={token.Icon.IconXs}
                        color={'var(--color-primary)'}
                    />
                    <ApTypography
                        color="inherit"
                        style={{ fontWeight: 500 }}
                        variant={FontVariantToken.fontSizeMBold}
                    >
                        {title}{pageText}
                    </ApTypography>
                </Box>
            }
            slotProps={{
                popper: {
                    modifiers: [
                        {
                            name: 'preventOverflow',
                            enabled: true,
                            options: {
                                boundary: 'clippingParents',
                                rootBoundary: 'viewport',
                                padding: token.Spacing.SpacingXs,
                                altAxis: true,
                            },
                        },
                        {
                            name: 'flip',
                            enabled: true,
                            options: {
                                fallbackPlacements: [ 'bottom', 'left', 'right' ],
                                padding: token.Spacing.SpacingS,
                            },
                        },
                    ],
                },
                tooltip: {
                    sx: {
                        backgroundColor: 'var(--color-background-raised)',
                        color: 'var(--color-foreground)',
                        boxShadow: token.Shadow.ShadowDp6,
                    },
                },
            }}
        >
            <Box
                component="sup"
                ref={ref}
                sx={{
                    background: 'var(--color-background-disabled)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: `0 ${token.Spacing.SpacingMicro}`,
                    marginLeft: token.Spacing.SpacingMicro,
                    borderRadius: token.Border.BorderRadiusM,
                    marginTop: `-${token.Spacing.SpacingMicro}`,
                    outline: 'none',
                    '&:focus-visible': { outline: `1px solid var(--color-focus-indicator)` },
                }}
                data-citation-sup="true"
                tabIndex={0}
                role="button"
                aria-label={_(msg({ id: 'autopilot-chat.message.citation-aria-label', message: `Citation ${id}: ${title}${pageText}` }))}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
            >
                <ApTypography color={'var(--color-foreground)'} variant={spacing.markdownTokens.citation}>
                    {id}
                </ApTypography>
            </Box>
        </Tooltip>
    );
});
