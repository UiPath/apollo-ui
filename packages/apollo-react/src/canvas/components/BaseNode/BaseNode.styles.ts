import { css, keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import type { NodeShape } from '../../schema';

// Grid-aligned node heights (multiples of 16px)
const GRID_UNIT = 16;
const NODE_HEIGHT_DEFAULT = GRID_UNIT * 6; // 96px
const NODE_HEIGHT_FOOTER_BUTTON = GRID_UNIT * 9; // 144px
const NODE_HEIGHT_FOOTER_SINGLE = GRID_UNIT * 10; // 160px
const NODE_HEIGHT_FOOTER_DOUBLE = GRID_UNIT * 11; // 176px

const pulseAnimation = (cssVar: string) => keyframes`
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(${cssVar}) 20%, transparent);
  }
  70% {
    box-shadow: 0 0 0 10px color-mix(in srgb, var(${cssVar}) 0%, transparent);
  }
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(${cssVar}) 0%, transparent);
  }
`;

const getExecutionStatusBorder = (executionStatus?: string) => {
  switch (executionStatus) {
    case 'NotExecuted':
    case 'INFO':
      return css`
        border-color: var(--uix-canvas-border-de-emp);
      `;
    case 'InProgress': {
      return css`
        border-color: var(--uix-canvas-info-icon);
        animation: ${pulseAnimation('--uix-canvas-info-icon')} 2s infinite;
      `;
    }
    case 'Completed':
      return css`
        border-color: var(--uix-canvas-success-icon);
      `;
    case 'Paused':
    case 'WARNING': {
      return css`
        border-color: var(--uix-canvas-warning-icon);
        animation: ${pulseAnimation('--uix-canvas-warning-icon')} 2s infinite;
      `;
    }
    case 'Cancelled':
    case 'Failed':
    case 'Terminated':
    case 'ERROR':
    case 'CRITICAL': {
      return css`
        border-color: var(--uix-canvas-error-icon);
        background: var(--uix-canvas-error-background);
        animation: ${pulseAnimation('--uix-canvas-error-icon')} 2s infinite;
      `;
    }
    default:
      return css`
        border-color: var(--uix-canvas-border-de-emp);
      `;
  }
};

const getInteractionStateBorder = (interactionState?: string) => {
  switch (interactionState) {
    case 'hover':
      return css`
        outline: 4px solid var(--uix-canvas-secondary-focused);
      `;
    case 'disabled':
      return css`
        opacity: 0.5;
        cursor: not-allowed;
      `;
    case 'drag':
      return css`
        cursor: grabbing;
        opacity: 0.8;
      `;
    default:
      return null;
  }
};

const getSuggestionTypeBorder = (suggestionType?: string) => {
  const borderColorVar = getSuggestionTypeBorderColorVar(suggestionType);
  const backgroundColorVar = getSuggestionTypeBackgroundColorVar(suggestionType);

  if (!borderColorVar || !backgroundColorVar) return null;

  return css`
    border-color: var(${borderColorVar});
    background: var(${backgroundColorVar});
    animation: ${pulseAnimation(borderColorVar)} 2s infinite;
  `;
};

const getSuggestionTypeBorderColorVar = (suggestionType?: string) => {
  switch (suggestionType) {
    case 'add':
      return '--uix-canvas-success-icon';
    case 'update':
      return '--uix-canvas-warning-icon';
    case 'delete':
      return '--uix-canvas-error-icon';
    default:
      return null;
  }
};

const getSuggestionTypeBackgroundColorVar = (suggestionType?: string) => {
  switch (suggestionType) {
    case 'add':
      return '--uix-canvas-success-background';
    case 'update':
      return '--uix-canvas-warning-background';
    case 'delete':
      return '--uix-canvas-error-background';
    default:
      return null;
  }
};

export const BaseContainer = styled.div<{
  selected?: boolean;
  backgroundColor?: string;
  shape?: NodeShape;
  executionStatus?: string;
  interactionState?: string;
  suggestionType?: string;
  width?: number;
  height?: number;
  hasFooter?: boolean;
  footerVariant?: 'none' | 'button' | 'single' | 'double';
}>`
  position: relative;
  width: ${({ shape, width }) => {
    const defaultWidth = shape === 'rectangle' ? 288 : 96;
    if (width && width !== 96 && width !== 288) {
      return `${width}px`;
    }
    return `${defaultWidth}px`;
  }};
  height: ${({ height, hasFooter, footerVariant }) => {
    if (hasFooter) {
      switch (footerVariant) {
        case 'button':
          return `${NODE_HEIGHT_FOOTER_BUTTON}px`;
        case 'single':
          return `${NODE_HEIGHT_FOOTER_SINGLE}px`;
        case 'double':
          return `${NODE_HEIGHT_FOOTER_DOUBLE}px`;
        default:
          return 'auto';
      }
    }
    return height ? `${height}px` : `${NODE_HEIGHT_DEFAULT}px`;
  }};
  background: ${({ backgroundColor }) => backgroundColor || 'var(--uix-canvas-background)'};
  border: 1.5px solid var(--uix-canvas-border-de-emp);
  border-radius: ${({ shape }) => {
    if (shape === 'circle') return '50%';
    return '16px';
  }};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: ${({ shape }) => (shape === 'rectangle' ? 'row' : 'column')};
  flex-wrap: ${({ hasFooter }) => (hasFooter ? 'wrap' : 'nowrap')};
  align-items: center;
  justify-content: ${({ shape }) => (shape === 'rectangle' ? 'flex-start' : 'center')};
  gap: ${({ shape }) => (shape === 'rectangle' ? '12px' : '0')};
  padding: ${({ shape, height, hasFooter }) => {
    if (shape === 'rectangle') {
      if (hasFooter) return '16px';
      const scaleFactor = height ? height / 100 : 1;
      return `${14 * scaleFactor}px`;
    }
    return '0';
  }};
  cursor: pointer;

  ${({ executionStatus }) => getExecutionStatusBorder(executionStatus)}
  ${({ interactionState }) => getInteractionStateBorder(interactionState)}
  ${({ suggestionType }) => getSuggestionTypeBorder(suggestionType)}

  ${({ selected, suggestionType }) => {
    if (selected && suggestionType) {
      const borderColorVar = getSuggestionTypeBorderColorVar(suggestionType);
      return css`
        border-color: var(${borderColorVar});
        outline: 4px solid color-mix(in srgb, var(${borderColorVar}) 40%, transparent);
      `;
    }

    if (selected) {
      return css`
        border-color: var(--uix-canvas-primary);
        outline: 4px solid var(--uix-canvas-secondary-pressed);
      `;
    }

    return '';
  }}
`;

export const BaseIconWrapper = styled.div<{
  color?: string;
  backgroundColor?: string;
  shape?: NodeShape;
  height?: number;
  width?: number;
}>`
  width: ${({ height, width, shape }) => {
    // Use default 3/4 scaling, derived from the height for rectangle, and use width for other shapes
    const dimension = height !== width && shape === 'rectangle' ? height : width;
    const scaleFactor = dimension ? dimension / 96 : 1;
    return `${72 * scaleFactor}px`;
  }};
  height: ${({ height, width, shape }) => {
    // Use 7/8 scaling for a vertical rectangle, and use default 3/4 scaling for other shapes
    const scaleFactor = height ? height / 96 : 1;
    return height !== width && shape !== 'rectangle' // True for only a expandable node
      ? `${84 * scaleFactor}px`
      : `${72 * scaleFactor}px`;
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ color }) => color || 'var(--uix-canvas-foreground)'};
  background: ${({ backgroundColor }) =>
    backgroundColor || 'var(--uix-canvas-background-secondary)'};
  border-radius: ${({ shape }) => {
    if (shape === 'circle') return '50%';
    return '8px';
  }};

  svg {
    width: ${({ width }) => {
      const scaleFactor = width ? width / 96 : 1;
      return `${40 * scaleFactor}px`;
    }};
    height: ${({ height }) => {
      const scaleFactor = height ? height / 96 : 1;
      return `${40 * scaleFactor}px`;
    }};
  }

  img {
    width: ${({ width }) => {
      const scaleFactor = width ? width / 96 : 1;
      return `${40 * scaleFactor}px`;
    }};
    height: ${({ height }) => {
      const scaleFactor = height ? height / 96 : 1;
      return `${40 * scaleFactor}px`;
    }};
    object-fit: contain;
  }
`;

export const BaseTextContainer = styled.div<{ hasBottomHandles?: boolean; shape?: NodeShape }>`
  ${({ shape, hasBottomHandles }) =>
    shape === 'rectangle'
      ? css`
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        `
      : css`
          position: absolute;
          bottom: ${hasBottomHandles ? '-40px' : '-8px'};
          width: 150%;
          left: 50%;
          transform: translateX(-50%) translateY(100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          z-index: 10;
          transition: transform 0.2s ease-in-out;

          /* When there's a bottom handle, offset text to the right to avoid overlapping */
          ${
            hasBottomHandles &&
            css`
            transform: translateX(20%) translateY(50%);
            text-align: left;
          `
          }
        `}
`;

export const BaseHeader = styled.div<{ shape?: NodeShape; backgroundColor?: string }>`
  font-weight: 600;
  font-size: 13px;
  color: var(--uix-canvas-foreground);
  ${({ backgroundColor }) =>
    backgroundColor &&
    css`
      background-color: ${backgroundColor};
      padding: 2px 6px;
      border-radius: 4px;
    `}
  line-height: 1.4;
  margin-bottom: 2px;
  ${({ shape }) =>
    shape === 'rectangle'
      ? css`
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `
      : css`
          word-break: break-word;
        `}
`;

export const BaseSubHeader = styled.div<{ shape?: NodeShape }>`
  font-size: 11px;
  color: var(--uix-canvas-foreground-de-emp);
  line-height: 1.3;
  word-break: break-word;
  ${({ shape }) =>
    shape === 'rectangle'
      ? css`
          width: 100%;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
        `
      : ''}
`;

export const EditableLabel = styled.textarea<{
  shape?: NodeShape;
  backgroundColor?: string;
  variant: 'normal' | 'subtext';
}>`
  resize: none;
  field-sizing: ${({ shape }) => (shape === 'rectangle' ? 'fixed' : 'content')};
  font-weight: ${({ variant }) => (variant === 'subtext' ? '400' : '600')};
  font-size: ${({ variant }) => (variant === 'subtext' ? '11px' : '13px')};
  line-height: ${({ variant }) => (variant === 'subtext' ? '1.3' : '1.4')};
  font-family: inherit;
  color: var(--uix-canvas-foreground);
  border: none;
  border-radius: 4px;
  outline: 1px dashed var(--uix-canvas-border-de-emp);
  margin-bottom: ${({ variant }) => (variant === 'subtext' ? 0 : '2px')};
  max-width: 100%;

  ${({ backgroundColor }) =>
    backgroundColor
      ? css`
          background-color: ${backgroundColor};
          padding: 2px 6px;
        `
      : 'background-color: color-mix(in srgb, var(--uix-canvas-background) 10%, transparent);'}

  ${({ shape }) =>
    shape === 'rectangle'
      ? css`
          width: 100%;
        `
      : css`
          text-align: center;
        `}
`;

export const EmptyLabelPlaceholder = styled.div`
  font-weight: 600;
  font-size: 13px;
  line-height: 1.4;
  color: var(--uix-canvas-foreground-de-emp);
  background: transparent;
  border: 1px dashed var(--uix-canvas-border-de-emp);
  border-radius: 4px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
  min-width: 20px;
  min-height: 20px;

  &:hover {
    opacity: 1;
    background-color: color-mix(in srgb, var(--uix-canvas-background) 10%, transparent);
  }
`;

export const BaseBadgeSlot = styled.div<{
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  shape?: NodeShape;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: transparent;
  position: absolute;
  ${({ position, shape }) => {
    const offset = shape === 'circle' ? '12px' : '6px';
    switch (position) {
      case 'top-left':
        return `top: ${offset}; left: ${offset};`;
      case 'top-right':
        return `top: ${offset}; right: ${offset};`;
      case 'bottom-left':
        return `bottom: ${offset}; left: ${offset};`;
      case 'bottom-right':
        return `bottom: ${offset}; right: ${offset};`;
    }
  }}
`;
