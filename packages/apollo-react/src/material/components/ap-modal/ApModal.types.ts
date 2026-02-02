import type { ModalProps } from '@mui/material/Modal';
import type React from 'react';

export type ModalSize = 'small' | 'medium' | 'large';

export type ApModalCloseReason = 'backdropClick' | 'escapeKeyDown' | 'closeButtonClick';

export interface ApModalProps extends Omit<ModalProps, 'onClose' | 'children'> {
  /**
   * Callback fired when the modal should close
   *
   * Note: Extends Material UI's onClose to include 'closeButtonClick' reason for the custom close button
   *
   * @param event - The event source of the callback
   * @param reason - The reason for closing (backdropClick, escapeKeyDown, or closeButtonClick)
   */
  onClose?: (event: {}, reason: ApModalCloseReason) => void;

  /**
   * Modal content (alternative to message prop)
   */
  children?: React.ReactNode;

  /**
   * Header text displayed at the top of the modal
   */
  header?: React.ReactNode;

  /**
   * Optional message text displayed in the content area (alternative to children)
   */
  message?: React.ReactNode;

  /**
   * If true, prevents the modal from being closed by clicking backdrop or close button
   */
  preventClose?: boolean;

  /**
   * If true, hides the close button in the top-right corner
   * @default false
   */
  hideCloseButton?: boolean;

  /**
   * Size of the modal (affects width)
   * @default 'small'
   */
  size?: ModalSize;

  /**
   * Primary action button configuration
   */
  primaryAction?: {
    label: string;
    onClick?: () => void;
    loading?: boolean;
    disabled?: boolean;
    id?: string;
  };

  /**
   * Secondary action button configuration
   */
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    loading?: boolean;
    id?: string;
  };

  /**
   * ID for the close button
   */
  closeButtonId?: string;
}
