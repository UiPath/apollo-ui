import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
    InputAdornment,
    TextField,
    TextFieldProps,
    Tooltip,
} from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core';

import { ApTypography } from '../ap-typography';
import type { ApTextFieldProps, InputType } from './ApTextField.types';

// Error message component
const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
    <ApTypography variant={FontVariantToken.fontSizeS} style={{ color: 'var(--color-error-text)' }}>
        {message}
    </ApTypography>
);

/**
 * ApTextField is a text input component with Apollo design system styling.
 * It wraps MUI's TextField with support for various input types, validation, and adornments.
 */
export function ApTextField<T extends InputType = 'text'>(
    props: Readonly<ApTextFieldProps<T>>,
) {
    const {
        label,
        value,
        size = 'tall',
        placeholder,
        error,
        errorMessage,
        readOnly,
        readOnlyTooltip,
        helperText,
        required,
        disabled,
        type = 'text' as T,
        startAdornment,
        endAdornment,
        customStyle,
        onChange,
        className,
        min = -Infinity,
        max = Infinity,
        step = 1,
        dataTestid,
    } = props;

    const inputRef = useRef<HTMLInputElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [compositionValue, setCompositionValue] = useState(value || '');

    const isEllipsisActive = (element: HTMLElement) => {
        return element.offsetWidth < element.scrollWidth;
    };

    useEffect(() => {
        if (inputRef.current) {
            setIsOverflowing(isEllipsisActive(inputRef.current));
        }
        setCompositionValue(value || '');
    }, [value]);

    const handleOnInput = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value;
            setCompositionValue(value);
            onChange?.(value);
        },
        [onChange],
    );

    const cachedProps = useMemo<Partial<TextFieldProps>>(() => {
        let helperTextValue: React.ReactElement;

        if (errorMessage) {
            helperTextValue = <ErrorMessage message={errorMessage} />;
        } else if (error) {
            helperTextValue = <ErrorMessage message={helperText ?? ''} />;
        } else {
            helperTextValue = (
                <ApTypography variant={FontVariantToken.fontSizeS}>
                    {helperText}
                </ApTypography>
            );
        }

        return {
            InputProps: {
                readOnly,
                startAdornment: startAdornment && (
                    <InputAdornment
                        disableTypography
                        position="start"
                        sx={{
                            marginRight: '0px',
                            width: 'unset',
                            color: 'var(--color-foreground)',
                            fontSize: token.FontFamily.FontMSize,
                        }}
                    >
                        {startAdornment}
                    </InputAdornment>
                ),
                endAdornment: endAdornment && (
                    <InputAdornment
                        disableTypography
                        position="end"
                        sx={{
                            marginLeft: '0px',
                            width: 'unset',
                            color: 'var(--color-foreground)',
                            fontSize: token.FontFamily.FontMSize,
                        }}
                    >
                        {endAdornment}
                    </InputAdornment>
                ),
            },
            sx: {
                '& .MuiInputBase-root': {
                    height: size === 'tall' ? token.Spacing.SpacingXxl : token.Spacing.SpacingXl,
                    ...((startAdornment || endAdornment) && {
                        paddingLeft: token.Padding.PadL,
                        paddingRight: token.Padding.PadL,
                    }),
                },
                '& .MuiInputBase-input': {
                    ...(size === 'small' && { height: '0px' }),
                    ...((startAdornment || endAdornment) && {
                        paddingLeft: token.Padding.PadS,
                        paddingRight: token.Padding.PadS,
                    }),
                },
                ...customStyle,
            },
            helperText: helperTextValue,
        };
    }, [
        readOnly,
        size,
        helperText,
        error,
        errorMessage,
        startAdornment,
        endAdornment,
        customStyle,
    ]);

    const getTooltipContent = useCallback(() => {
        if (readOnly && readOnlyTooltip) {
            return readOnlyTooltip;
        }
        if (isOverflowing && value) {
            return value;
        }
        return '';
    }, [readOnly, readOnlyTooltip, isOverflowing, value]);

    const shouldShowTooltip =
        (readOnly && !!readOnlyTooltip) || (isOverflowing && !!value);

    const textField = (
        <TextField
            className={className}
            label={label}
            value={compositionValue}
            onInput={handleOnInput}
            placeholder={placeholder}
            error={error || !!errorMessage}
            required={required}
            type={type}
            disabled={disabled}
            InputLabelProps={{
                shrink: label && placeholder ? true : undefined,
            }}
            inputProps={{
                'data-testid': dataTestid,
                min: type === 'number' ? min : undefined,
                max: type === 'number' ? max : undefined,
                step: type === 'number' ? step : undefined,
            }}
            {...cachedProps}
            inputRef={inputRef}
        />
    );

    if (shouldShowTooltip) {
        return (
            <Tooltip title={getTooltipContent()} arrow>
                {textField}
            </Tooltip>
        );
    }

    return textField;
}
