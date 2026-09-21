'use client';

import type * as React from 'react';
import { PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib';

export interface PickerPopupProps {
  /** Optional fixed width. Defaults to the trigger's width. */
  width?: number | string;
  align?: React.ComponentProps<typeof PopoverContent>['align'];
  side?: React.ComponentProps<typeof PopoverContent>['side'];
  sideOffset?: number;
  /** Renders above the listbox (e.g. search input). */
  header?: React.ReactNode;
  /** Renders below the listbox (e.g. the "Use custom model" CTA). */
  footer?: React.ReactNode;
  /** Optional className forwarded to the content for host overrides. */
  className?: string;
  /**
   * Portal target. Hosts rendering inside a shadow root or a VS Code
   * webview must pass their container so the popup — and the CSS
   * variables scoped to that root — resolve correctly.
   */
  container?: React.ComponentProps<typeof PopoverContent>['container'];
  onKeyDown?: (e: React.KeyboardEvent) => void;
  /**
   * Keeps DOM focus on the search input instead of letting Radix move it
   * to the content root on open — `aria-activedescendant` navigation
   * depends on focus staying put.
   */
  onOpenAutoFocus?: (e: Event) => void;
  'data-testid'?: string;
  children: React.ReactNode;
}

/**
 * Dropdown chrome for the ModelPicker: the popover surface plus its
 * header/footer slots. Must be rendered inside a `<Popover>` — the
 * trigger, open state and click-outside behaviour belong to Radix.
 *
 * Header and footer are slots so consumers can compose their own
 * pickers without rewriting the popup structure.
 */
export const PickerPopup: React.FC<PickerPopupProps> = ({
  width,
  align = 'start',
  side = 'bottom',
  sideOffset = 6,
  header,
  footer,
  className,
  container,
  onKeyDown,
  onOpenAutoFocus,
  'data-testid': dataTestId,
  children,
}) => (
  <PopoverContent
    align={align}
    className={cn('flex flex-col overflow-hidden rounded-[10px] p-0 shadow-lg', className)}
    container={container}
    data-slot="model-picker-popup"
    data-testid={dataTestId}
    onKeyDown={onKeyDown}
    onOpenAutoFocus={onOpenAutoFocus}
    side={side}
    sideOffset={sideOffset}
    // Default to the trigger's width so the popup lines up with the field.
    style={{ width: width ?? 'var(--radix-popover-trigger-width)' }}
  >
    {header}
    <div className="min-h-0 flex-1">{children}</div>
    {footer && <div className="border-t border-border bg-popover">{footer}</div>}
  </PopoverContent>
);
