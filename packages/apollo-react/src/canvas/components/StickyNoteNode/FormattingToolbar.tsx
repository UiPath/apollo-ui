import { CanvasIcon } from '@uipath/apollo-react/canvas';
import { memo, type RefObject, useCallback } from 'react';
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
  textAreaRef: RefObject<HTMLTextAreaElement | null>;
  borderColor: string;
  activeFormats: ActiveFormats;
  onFormat: (result: TextSelection) => void;
  actions?: readonly StickyNoteFormattingAction[];
  onAction?: (action: StickyNoteFormattingAction) => void;
}

const FormattingToolbarComponent = ({
  textAreaRef,
  borderColor,
  activeFormats,
  onFormat,
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
      role="toolbar"
      aria-label={toolbarLabel}
      borderColor={borderColor}
      onMouseDown={(e) => e.preventDefault()}
      className="nodrag nowheel"
    >
      <CanvasTooltip content={boldLabel} placement="top" delay>
        <FormattingButton isActive={activeFormats.bold} onClick={handleBold} aria-label={boldLabel}>
          <CanvasIcon icon="bold" size={14} />
        </FormattingButton>
      </CanvasTooltip>
      <CanvasTooltip content={italicLabel} placement="top" delay>
        <FormattingButton
          isActive={activeFormats.italic}
          onClick={handleItalic}
          aria-label={italicLabel}
        >
          <CanvasIcon icon="italic" size={14} />
        </FormattingButton>
      </CanvasTooltip>
      <CanvasTooltip content={strikethroughLabel} placement="top" delay>
        <FormattingButton
          isActive={activeFormats.strikethrough}
          onClick={handleStrikethrough}
          aria-label={strikethroughLabel}
        >
          <CanvasIcon icon="strikethrough" size={14} />
        </FormattingButton>
      </CanvasTooltip>

      <ToolbarSeparator />

      <CanvasTooltip content={bulletListLabel} placement="top" delay>
        <FormattingButton
          isActive={activeFormats.bulletList}
          onClick={handleBulletList}
          aria-label={bulletListLabel}
        >
          <CanvasIcon icon="list" size={14} />
        </FormattingButton>
      </CanvasTooltip>
      <CanvasTooltip content={numberedListLabel} placement="top" delay>
        <FormattingButton
          isActive={activeFormats.numberedList}
          onClick={handleNumberedList}
          aria-label={numberedListLabel}
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
            disabled={action.disabled}
            onClick={() => onAction?.(action)}
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
