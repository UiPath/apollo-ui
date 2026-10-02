import { cn } from '@uipath/apollo-wind';
import type { ReactNode } from 'react';
import { CanvasIcon } from '../../utils/icon-registry';
import { type InlineLabelValues, useInlineLabelEditing } from '../BaseNode/useInlineLabelEditing';
import { HEADER_ADORNMENT_PADDING } from './ContainerNode.constants';
import type { ContainerHeaderParts } from './ContainerNode.types';

export interface HeaderLabelEditingStrings {
  titlePlaceholder: string;
  subtitlePlaceholder: string;
  titleAriaLabel: string;
  subtitleAriaLabel: string;
}

const EDIT_INPUT_CLASS =
  'nodrag nopan nowheel block w-full min-w-0 resize-none rounded-sm border-none bg-transparent px-1 font-[inherit] outline-1 outline-dashed outline-border-de-emp field-sizing-fixed';

export function Header({
  testId,
  title,
  icon,
  iconClassName,
  subtitle,
  badges,
  end,
  renderHeader,
  loading,
  radiusClassName,
  hasTopLeftAdornment,
  hasTopRightAdornment,
  editable,
  subtitleEditable,
  editSubLabel,
  editingStrings,
  selected,
  dragging,
  discardDraftOnReadonly,
  onLabelChange,
}: {
  testId: string;
  title: string;
  icon?: string;
  iconClassName: string;
  subtitle?: ReactNode;
  badges?: ReactNode;
  end?: ReactNode;
  renderHeader?: (parts: ContainerHeaderParts) => ReactNode;
  loading: boolean;
  radiusClassName: string;
  hasTopLeftAdornment: boolean;
  hasTopRightAdornment: boolean;
  editable: boolean;
  subtitleEditable: boolean;
  editSubLabel: string;
  editingStrings: HeaderLabelEditingStrings;
  selected: boolean;
  dragging: boolean;
  discardDraftOnReadonly: boolean;
  onLabelChange: (values: Partial<InlineLabelValues>) => void;
}) {
  const {
    isEditing,
    localLabel,
    setLocalLabel,
    localSubLabel,
    setLocalSubLabel,
    labelInputRef,
    subLabelInputRef,
    handleDoubleClick,
    handleKeyDown,
    handleBlur,
  } = useInlineLabelEditing({
    label: title,
    subLabel: editSubLabel,
    selected,
    dragging,
    readonly: !editable,
    discardDraftOnReadonly,
    // Write only what changed, so saving an edited subtitle doesn't pin the
    // manifest title onto the node (and vice versa). A subtitle passed as a
    // prop is not editable, so the stored one is left alone.
    onChange: ({ label, subLabel }) =>
      onLabelChange({
        ...(label !== title ? { label } : {}),
        ...(subtitleEditable && subLabel !== editSubLabel ? { subLabel } : {}),
      }),
  });

  const titleContent = loading ? (
    <div className="h-5 w-28 animate-pulse rounded bg-(--canvas-background-overlay)" />
  ) : isEditing ? (
    <textarea
      ref={labelInputRef}
      value={localLabel}
      rows={1}
      placeholder={editingStrings.titlePlaceholder}
      aria-label={editingStrings.titleAriaLabel}
      onChange={(e) => setLocalLabel(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className={cn(
        EDIT_INPUT_CLASS,
        'text-[15px] font-semibold leading-5 tracking-normal text-foreground'
      )}
    />
  ) : (
    <span
      className="truncate text-[15px] font-semibold leading-5 tracking-normal"
      onDoubleClick={editable ? handleDoubleClick(labelInputRef) : undefined}
      data-testid="container-node-title"
    >
      {title}
    </span>
  );

  const iconContent = loading ? (
    <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-(--canvas-background-overlay)" />
  ) : icon ? (
    <span className={cn('shrink-0', iconClassName)} aria-hidden>
      <CanvasIcon icon={icon} size={16} />
    </span>
  ) : null;

  const headerStyle =
    hasTopLeftAdornment || hasTopRightAdornment
      ? {
          paddingLeft: hasTopLeftAdornment ? HEADER_ADORNMENT_PADDING : undefined,
          paddingRight: hasTopRightAdornment ? HEADER_ADORNMENT_PADDING : undefined,
        }
      : undefined;

  const subtitleContent =
    isEditing && subtitleEditable ? (
      <textarea
        ref={subLabelInputRef}
        value={localSubLabel}
        rows={1}
        placeholder={editingStrings.subtitlePlaceholder}
        aria-label={editingStrings.subtitleAriaLabel}
        onChange={(e) => setLocalSubLabel(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={cn(EDIT_INPUT_CLASS, 'text-xs leading-4 text-foreground-muted')}
      />
    ) : subtitle && !loading ? (
      <span
        className="truncate text-xs leading-4 text-foreground-muted"
        onDoubleClick={
          editable && subtitleEditable ? handleDoubleClick(subLabelInputRef) : undefined
        }
        data-testid="container-node-subtitle"
      >
        {subtitle}
      </span>
    ) : null;
  const hasTrailing = badges != null || end != null;

  return (
    <div
      className={cn(
        'relative z-10 flex shrink-0 cursor-grab items-center justify-between gap-2.5',
        radiusClassName,
        '-mb-2.5 bg-surface-overlay px-3.5 pb-2.5 pt-2.5 text-foreground',
        'active:cursor-grabbing'
      )}
      style={headerStyle}
      data-testid={testId}
      data-container-header
    >
      {renderHeader ? (
        renderHeader({
          icon: iconContent,
          title: titleContent,
          subtitle: subtitleContent ?? undefined,
          badges: badges ?? undefined,
          end,
        })
      ) : (
        <>
          <div className={cn('flex min-w-0 items-center gap-2.5', isEditing && 'flex-1')}>
            {iconContent}
            {subtitleContent ? (
              <div className={cn('flex min-w-0 flex-col', isEditing && 'flex-1 gap-0.5')}>
                {titleContent}
                {subtitleContent}
              </div>
            ) : (
              titleContent
            )}
          </div>
          {hasTrailing ? (
            <div className="flex shrink-0 items-center gap-2">
              {end}
              {badges}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
