import { CanvasIcon } from '@uipath/apollo-react/canvas';
import { type FocusEvent, memo, type RefObject, useCallback } from 'react';
import { useSafeLingui } from '../../../i18n';
import { CanvasTooltip } from '../CanvasTooltip';
import type { ActiveFormats } from './markdown-formatting';
import {
  toggleBold,
  toggleBulletList,
  toggleItalic,
  toggleNumberedList,
  toggleStrikethrough,
} from './markdown-formatting';
import {
  FormattingButton,
  FormattingToolbarContainer,
  ToolbarSeparator,
} from './StickyNoteNode.styles';
import type { StickyNoteFormattingAction, TextSelection } from './StickyNoteNode.types';
import { getModifierKey, isMac, readTextSelection } from './StickyNoteNode.utils';

interface FormattingToolbarProps {
  containerRef?: RefObject<HTMLDivElement | null>;
  textAreaRef: RefObject<HTMLTextAreaElement | null>;
  borderColor: string;
  activeFormats: ActiveFormats;
  onFormat: (result: TextSelection) => void;
  onBlur?: (event: FocusEvent<HTMLDivElement>) => void;
  actions?: readonly StickyNoteFormattingAction[];
  onAction?: (action: StickyNoteFormattingAction, anchorRect: DOMRectReadOnly) => void;
}

const FormattingToolbarComponent = ({
  containerRef,
  textAreaRef,
  borderColor,
  activeFormats,
  onFormat,
  onBlur,
  actions = [],
  onAction,
}: FormattingToolbarProps) => {
  const { _ } = useSafeLingui();
  const mod = getModifierKey();
  const shift = isMac() ? '⇧' : '+Shift+';

  const applyFormat = useCallback(
    (formatFn: (input: TextSelection) => TextSelection) => {
      const textarea = textAreaRef.current;
      if (!textarea) return;

      onFormat(formatFn(readTextSelection(textarea)));
      textarea.focus();
    },
    [textAreaRef, onFormat]
  );

  const handleBold = useCallback(() => applyFormat(toggleBold), [applyFormat]);
  const handleItalic = useCallback(() => applyFormat(toggleItalic), [applyFormat]);
  const handleStrikethrough = useCallback(() => applyFormat(toggleStrikethrough), [applyFormat]);
  const handleBulletList = useCallback(() => applyFormat(toggleBulletList), [applyFormat]);
  const handleNumberedList = useCallback(() => applyFormat(toggleNumberedList), [applyFormat]);

  // Hoisted so each label is used for both the tooltip text AND the button's
  // aria-label — icon-only buttons otherwise have no accessible name.
  // Values go inside the descriptor (Lingui v5 `_(descriptor)` overload does not
  // take a separate values arg).
  const boldLabel = _({
    id: 'sticky-note.formatting.bold',
    message: 'Bold ({boldShortcut})',
    values: { boldShortcut: `${mod}+B` },
  });
  const italicLabel = _({
    id: 'sticky-note.formatting.italic',
    message: 'Italic ({italicShortcut})',
    values: { italicShortcut: `${mod}+I` },
  });
  const strikethroughLabel = _({
    id: 'sticky-note.formatting.strikethrough',
    message: 'Strikethrough ({strikethroughShortcut})',
    values: { strikethroughShortcut: `${mod}${shift}X` },
  });
  const bulletListLabel = _({
    id: 'sticky-note.formatting.bullet-list',
    message: 'Bullet list',
  });
  const numberedListLabel = _({
    id: 'sticky-note.formatting.numbered-list',
    message: 'Numbered list',
  });
  const toolbarLabel = _({ id: 'sticky-note.formatting.toolbar', message: 'Text formatting' });

  return (
    <FormattingToolbarContainer
      ref={containerRef}
      role="toolbar"
      aria-label={toolbarLabel}
      borderColor={borderColor}
      onMouseDown={(e) => e.preventDefault()}
      onBlur={onBlur}
      className="nodrag nowheel"
    >
      <CanvasTooltip content={boldLabel} placement="top" delay>
        <FormattingButton
          type="button"
          isActive={activeFormats.bold}
          onClick={handleBold}
          aria-label={boldLabel}
          aria-pressed={activeFormats.bold}
        >
          <CanvasIcon icon="bold" size={14} />
        </FormattingButton>
      </CanvasTooltip>
      <CanvasTooltip content={italicLabel} placement="top" delay>
        <FormattingButton
          type="button"
          isActive={activeFormats.italic}
          onClick={handleItalic}
          aria-label={italicLabel}
          aria-pressed={activeFormats.italic}
        >
          <CanvasIcon icon="italic" size={14} />
        </FormattingButton>
      </CanvasTooltip>
      <CanvasTooltip content={strikethroughLabel} placement="top" delay>
        <FormattingButton
          type="button"
          isActive={activeFormats.strikethrough}
          onClick={handleStrikethrough}
          aria-label={strikethroughLabel}
          aria-pressed={activeFormats.strikethrough}
        >
          <CanvasIcon icon="strikethrough" size={14} />
        </FormattingButton>
      </CanvasTooltip>

      <ToolbarSeparator />

      <CanvasTooltip content={bulletListLabel} placement="top" delay>
        <FormattingButton
          type="button"
          isActive={activeFormats.bulletList}
          onClick={handleBulletList}
          aria-label={bulletListLabel}
          aria-pressed={activeFormats.bulletList}
        >
          <CanvasIcon icon="list" size={14} />
        </FormattingButton>
      </CanvasTooltip>
      <CanvasTooltip content={numberedListLabel} placement="top" delay>
        <FormattingButton
          type="button"
          isActive={activeFormats.numberedList}
          onClick={handleNumberedList}
          aria-label={numberedListLabel}
          aria-pressed={activeFormats.numberedList}
        >
          <CanvasIcon icon="list-ordered" size={14} />
        </FormattingButton>
      </CanvasTooltip>

      {actions.length > 0 && <ToolbarSeparator />}
      {actions.map((action) => (
        <CanvasTooltip key={action.id} content={action.label} placement="top" delay>
          <FormattingButton
            type="button"
            isActive={false}
            disabled={action.disabled || !onAction}
            onClick={(event) => onAction?.(action, event.currentTarget.getBoundingClientRect())}
            aria-label={action.label}
          >
            {action.icon}
          </FormattingButton>
        </CanvasTooltip>
      ))}
    </FormattingToolbarContainer>
  );
};

export const FormattingToolbar = memo(FormattingToolbarComponent);
