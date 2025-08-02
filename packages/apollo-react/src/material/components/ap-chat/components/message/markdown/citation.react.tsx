/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    Box,
    Tooltip,
    useTheme,
} from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core';
import { CHAT_CITATION_MARKER } from '@uipath/portal-shell-util';
import React from 'react';

import { t } from '../../../../../utils/localization/loc';
import { useChatScroll } from '../../../providers/chat-scroll-provider.react';

// Helper function to find elements within a specific container
const findElementsWithinContainer = (selector: string, container: Element): Set<HTMLElement> => {
    const matchingElements: HTMLElement[] = [];

    container.querySelectorAll(selector).forEach(el => {
        matchingElements.push(el as HTMLElement);
    });

    // Mark only the immediate parents that contain actual text content
    const elementsSet = new Set<HTMLElement>();

    matchingElements.forEach(marker => {
        if (marker.parentElement) {
            // Only mark if the parent has some text content (not just whitespace)
            const parentText = marker.parentElement.textContent?.trim();
            if (parentText && parentText.length > 0) {
                elementsSet.add(marker.parentElement);
            }
        }
    });

    return elementsSet;
};

export const Citation = React.memo(({
    id,
    title,
    url,
    page_number,
    download_url,
    messageId,
}: any) => {
    const pageText = page_number ? ` (${t('autopilot-chat-page-number', { page_number })})` : '';
    const theme = useTheme();
    const { overflowContainer } = useChatScroll();
    const ref = React.useRef<HTMLDivElement>(null);
    const [ open, setOpen ] = React.useState(false);

    const handleOpen = React.useCallback(() => {
        setOpen(true);

        if (id && ref.current) {
            // Highlight citation markers
            const citationMarkers = findElementsWithinContainer(
                `[data-citation-id="${id}"].${CHAT_CITATION_MARKER}`,
                ref.current.closest(`[id="${messageId}"]`)!,
            );
            citationMarkers.forEach(el => {
                el.style.backgroundColor = theme.palette.semantic.colorBackgroundHighlight;
                el.style.transition = 'background-color 0.2s';
            });
        }
    }, [ id, messageId, theme ]);

    const handleClose = React.useCallback(() => {
        setOpen(false);

        if (id && ref.current) {
            // Remove citation highlights
            const citationMarkers = findElementsWithinContainer(
                `[data-citation-id="${id}"].${CHAT_CITATION_MARKER}`,
                ref.current.closest(`[id="${messageId}"]`)!,
            );
            citationMarkers.forEach(el => {
                el.style.backgroundColor = '';
            });
        }
    }, [ id, messageId ]);

    const handleClick = React.useCallback(() => {
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    }, [ url ]);

    // Close tooltip on scroll
    React.useEffect(() => {
        const handleScroll = () => {
            if (open) {
                setOpen(false);

                // Also remove highlights when closing due to scroll
                if (id && ref.current) {
                    const citationMarkers = findElementsWithinContainer(
                        `[data-citation-id="${id}"].${CHAT_CITATION_MARKER}`,
                        ref.current.closest(`[id="${messageId}"]`)!,
                    );
                    citationMarkers.forEach(el => {
                        el.style.backgroundColor = '';
                    });
                }
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
    }, [ open, overflowContainer, id, messageId ]);

    return (
        <Tooltip
            open={open}
            placement="left-start"
            onOpen={handleOpen}
            onClose={handleClose}
            title={
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: token.Spacing.SpacingS,
                        cursor: (url || download_url) ? 'pointer' : 'default',
                        padding: `${token.Spacing.SpacingXs} ${token.Spacing.SpacingS}`,
                    }}
                    onClick={handleClick}
                >
                    <ap-icon
                        variant={ url ? 'custom' : 'outlined'}
                        name={ url ? 'website' : 'file_open'}
                        size={token.Icon.IconXs}
                        color={theme.palette.semantic.colorPrimary}
                    />
                    <ap-typography
                        color="inherit"
                        style={{ fontWeight: 500 }}
                        variant={FontVariantToken.fontSizeMBold}
                    >
                        {title}{pageText}
                    </ap-typography>
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
                                padding: 8,
                                altAxis: true,
                            },
                        },
                        {
                            name: 'flip',
                            enabled: true,
                            options: {
                                fallbackPlacements: [ 'bottom', 'left', 'right' ],
                                padding: 8,
                            },
                        },
                    ],
                },
                tooltip: {
                    sx: {
                        backgroundColor: theme.palette.semantic.colorBackgroundRaised,
                        color: theme.palette.semantic.colorForeground,
                        boxShadow: theme.shadows[2],
                        fontSize: theme.typography.body2.fontSize,
                    },
                },
            }}
        >
            <Box
                component="sup"
                ref={ref}
                sx={{
                    background: theme.palette.semantic.colorBackgroundDisabled,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: `0 ${token.Spacing.SpacingMicro}`,
                    marginLeft: token.Spacing.SpacingMicro,
                    borderRadius: token.Border.BorderRadiusM,
                }}
                onClick={handleClick}
            >
                <ap-typography color={theme.palette.semantic.colorForeground}>
                    {id}
                </ap-typography>
            </Box>
        </Tooltip>
    );
});
