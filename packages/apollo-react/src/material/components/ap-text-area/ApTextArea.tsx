import React, { useCallback, useRef, useState } from 'react';
import { Box, TextareaAutosize } from '@mui/material';
import { styled } from '@mui/material/styles';
import token, { FontVariantToken } from '@uipath/apollo-core';

import { ApTypography } from '../ap-typography';
import type { ApTextAreaProps } from './ApTextArea.types';

interface StyledTextareaAutosizeProps {
    hasError?: boolean;
    width?: string | number;
    resize?: 'both' | 'horizontal' | 'vertical' | 'none';
}

const StyledTextareaAutosize = styled(TextareaAutosize, {
    shouldForwardProp: (prop) =>
        prop !== 'hasError' && prop !== 'width' && prop !== 'resize',
})<StyledTextareaAutosizeProps>(({ hasError, width, resize = 'vertical' }) => ({
    width: width || '100%',
    padding: `${token.Spacing.SpacingXs} ${token.Spacing.SpacingS}`,
    fontSize: token.FontFamily.FontMSize,
    lineHeight: token.FontFamily.FontMLineHeight,
    fontFamily: token.FontFamily.FontMFamily,
    color: 'var(--color-foreground)',
    backgroundColor: 'var(--color-background-primary)',
    border: `${token.Border.BorderThickS} solid ${hasError ? 'var(--color-error-border)' : 'var(--color-border-primary)'}`,
    borderRadius: token.Border.BorderRadiusS,
    resize,
    outline: 'none',
    transition: 'border-color 0.2s ease-in-out',

    '&::placeholder': {
        color: 'var(--color-foreground-de-emp)',
    },

    '&:hover:not(:disabled):not(:focus)': {
        borderColor: hasError ? 'var(--color-error-border)' : 'var(--color-border-hover)',
    },

    '&:focus': {
        borderColor: hasError ? 'var(--color-error-border)' : 'var(--color-focus-indicator)',
        boxShadow: hasError
            ? `0 0 0 ${token.Border.BorderThickS} var(--color-error-border)`
            : `0 0 0 ${token.Border.BorderThickS} var(--color-focus-indicator)`,
    },

    '&:disabled': {
        backgroundColor: 'var(--color-background-disabled)',
        color: 'var(--color-foreground-de-emp)',
        cursor: 'not-allowed',
    },

    '&:read-only': {
        backgroundColor: 'var(--color-background-secondary)',
        cursor: 'default',
    },
}));

/**
 * ApTextArea is a multi-line text input component with support for auto-resize,
 * character limits, error states, and helper text.
 */
export const ApTextArea = React.forwardRef<HTMLTextAreaElement, ApTextAreaProps>(
    (
        {
            label,
            value,
            placeholder,
            readOnly = false,
            required = false,
            disabled = false,
            errorMessage,
            helperText,
            width,
            rows = 4,
            minRows,
            maxRows,
            characterLimit,
            resize = 'vertical',
            dataTestid,
            onChange,
            ...restProps
        },
        ref
    ) => {
        const [cursorPosition, setCursorPosition] = useState<number | null>(null);
        const textareaRef = useRef<HTMLTextAreaElement | null>(null);

        const hasError = Boolean(errorMessage);
        const stringValue = typeof value === 'string' ? value : (value?.toString() || '');
        const currentLength = stringValue.length;
        const showCharacterCounter = characterLimit !== undefined;
        const isOverLimit = characterLimit !== undefined && currentLength > characterLimit;

        const handleChange = useCallback(
            (event: React.ChangeEvent<HTMLTextAreaElement>) => {
                const newValue = event.target.value;
                const textarea = event.target;

                if (characterLimit !== undefined && newValue.length > characterLimit) {
                    // Store cursor position before enforcing limit
                    const start = textarea.selectionStart;

                    // Trim to character limit and update the event value
                    const trimmedValue = newValue.slice(0, characterLimit);
                    event.target.value = trimmedValue;

                    // Restore cursor position
                    setCursorPosition(Math.min(start, characterLimit));
                }

                onChange?.(event);
            },
            [characterLimit, onChange]
        );

        // Restore cursor position after render if it was set
        React.useEffect(() => {
            if (cursorPosition !== null && textareaRef.current) {
                textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
                setCursorPosition(null);
            }
        }, [cursorPosition]);

        // Combine refs
        const combinedRef = useCallback(
            (node: HTMLTextAreaElement | null) => {
                textareaRef.current = node;
                if (typeof ref === 'function') {
                    ref(node);
                } else if (ref) {
                    ref.current = node;
                }
            },
            [ref]
        );

        const labelId = label ? `textarea-label-${dataTestid || 'default'}` : undefined;
        const helperId = (helperText || errorMessage)
            ? `textarea-helper-${dataTestid || 'default'}`
            : undefined;

        return (
            <Box sx={{ width: width || '100%' }}>
                {label && (
                    <Box sx={{ marginBottom: token.Spacing.SpacingMicro }}>
                        <ApTypography
                            variant={FontVariantToken.fontSizeM}
                            id={labelId}
                            style={{ color: 'var(--color-foreground)' }}
                        >
                            {label}
                            {required && (
                                <Box
                                    component="span"
                                    sx={{
                                        color: 'var(--color-error-text)',
                                        marginLeft: token.Spacing.SpacingMicro,
                                    }}
                                >
                                    *
                                </Box>
                            )}
                        </ApTypography>
                    </Box>
                )}

                <StyledTextareaAutosize
                    ref={combinedRef}
                    value={stringValue}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    disabled={disabled}
                    hasError={hasError}
                    width={width}
                    minRows={minRows !== undefined ? minRows : rows}
                    maxRows={maxRows !== undefined ? maxRows : (rows !== undefined ? rows : undefined)}
                    resize={resize}
                    onChange={handleChange}
                    data-testid={dataTestid}
                    aria-labelledby={labelId}
                    aria-describedby={helperId}
                    aria-invalid={hasError}
                    aria-required={required}
                    {...restProps}
                />

                {(errorMessage || helperText || showCharacterCounter) && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginTop: token.Spacing.SpacingMicro,
                            gap: token.Spacing.SpacingXs,
                        }}
                    >
                        <Box sx={{ flex: 1 }}>
                            {errorMessage && (
                                <ApTypography
                                    variant={FontVariantToken.fontSizeS}
                                    id={helperId}
                                    style={{ color: 'var(--color-error-text)' }}
                                >
                                    {errorMessage}
                                </ApTypography>
                            )}
                            {!errorMessage && helperText && (
                                <ApTypography
                                    variant={FontVariantToken.fontSizeS}
                                    id={helperId}
                                    style={{ color: 'var(--color-foreground-de-emp)' }}
                                >
                                    {helperText}
                                </ApTypography>
                            )}
                        </Box>

                        {showCharacterCounter && (
                            <ApTypography
                                variant={FontVariantToken.fontSizeS}
                                style={{
                                    color: isOverLimit
                                        ? 'var(--color-error-text)'
                                        : 'var(--color-foreground-de-emp)',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {currentLength}/{characterLimit}
                            </ApTypography>
                        )}
                    </Box>
                )}
            </Box>
        );
    }
);

ApTextArea.displayName = 'ApTextArea';
