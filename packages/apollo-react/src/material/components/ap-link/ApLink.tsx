import React, { useCallback } from 'react';

import { Link } from '@mui/material';
import { FontVariantToken } from '@uipath/apollo-core';

import { ApTypography } from '../ap-typography';
import type { ApLinkProps } from './ApLink.types';

/**
 * ApLink - Hyperlink component with Apollo design system styling
 */
export const ApLink = React.forwardRef<HTMLAnchorElement, ApLinkProps>(
    (
        {
            href,
            target = '_self',
            label,
            color,
            variant = FontVariantToken.fontSizeLink,
            tabIndex,
            onClick,
            'data-testid': dataTestid,
            className,
            children,
            ...restProps
        },
        ref
    ) => {
        const handleKeyDown = useCallback(
            (event: React.KeyboardEvent<HTMLAnchorElement | HTMLButtonElement>) => {
                if (event.key === ' ' || event.key === 'Enter') {
                    event.preventDefault();
                    event.stopPropagation();
                    // For keyboard events, just navigate - onClick is for mouse events only
                    if (href) {
                        if (target === '_blank') {
                            window.open(href, '_blank');
                        } else {
                            window.location.href = href;
                        }
                    }
                }
            },
            [href, target]
        );

        return (
            <Link
                ref={ref}
                href={href}
                target={target}
                aria-label={label}
                tabIndex={tabIndex}
                onClick={onClick}
                onKeyDown={handleKeyDown}
                data-testid={dataTestid}
                className={className}
                component={!href ? 'button' : 'a'}
                sx={{
                    color: color || 'var(--color-foreground-link)',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    '&:hover': {
                        textDecoration: 'underline',
                    },
                    '&:focus-visible': {
                        outline: '2px solid var(--color-focus-indicator)',
                        outlineOffset: '2px',
                    },
                }}
                {...restProps}
            >
                <ApTypography variant={variant} style={{ color: 'inherit' }}>
                    {children}
                </ApTypography>
            </Link>
        );
    }
);

ApLink.displayName = 'ApLink';
