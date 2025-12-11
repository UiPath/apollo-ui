import React from 'react';

export interface ApTextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'width' | 'resize'> {
    /** Label text displayed above the textarea */
    label?: string;
    /** Error message to display */
    errorMessage?: string;
    /** Helper text to display below the textarea */
    helperText?: string;
    /** Width of the textarea */
    width?: string | number;
    /** Number of rows (default: 4) */
    rows?: number;
    /** Minimum number of rows (auto-resize) */
    minRows?: number;
    /** Maximum number of rows (auto-resize) */
    maxRows?: number;
    /** Character limit for the input */
    characterLimit?: number;
    /** Resize behavior */
    resize?: 'both' | 'horizontal' | 'vertical' | 'none';
    /** Test ID for the textarea element */
    dataTestid?: string;
}
