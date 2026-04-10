import { CanvasIcon } from '@uipath/apollo-react/canvas';
import { memo, type RefObject, useCallback } from 'react';
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
import type { TextSelection } from './StickyNoteNode.types';
import { getModifierKey, isMac } from './StickyNoteNode.utils';

interface FormattingToolbarProps {
  textAreaRef: RefObject<HTMLTextAreaElement | null>;
  borderColor: string;
  activeFormats: ActiveFormats;
  onFormat: (result: TextSelection) => void;
}

const FormattingToolbarComponent = ({
  textAreaRef,
  borderColor,
  activeFormats,
  onFormat,
}: FormattingToolbarProps) => {
  const applyFormat = useCallback(
    (formatFn: (input: TextSelection) => TextSelection) => {
      const textarea = textAreaRef.current;
      if (!textarea) return;

      const input: TextSelection = {
        value: textarea.value,
        selectionStart: textarea.selectionStart,
        selectionEnd: textarea.selectionEnd,
      };

      onFormat(formatFn(input));
      textarea.focus();
    },
    [textAreaRef, onFormat]
  );

  const handleBold = useCallback(() => applyFormat(toggleBold), [applyFormat]);
  const handleItalic = useCallback(() => applyFormat(toggleItalic), [applyFormat]);
  const handleStrikethrough = useCallback(() => applyFormat(toggleStrikethrough), [applyFormat]);
  const handleBulletList = useCallback(() => applyFormat(toggleBulletList), [applyFormat]);
  const handleNumberedList = useCallback(() => applyFormat(toggleNumberedList), [applyFormat]);

  const mod = getModifierKey();
  const shift = isMac() ? '⇧' : '+Shift+';

  return (
    <FormattingToolbarContainer
      borderColor={borderColor}
      onMouseDown={(e) => e.preventDefault()}
      className="nodrag nowheel"
    >
      <CanvasTooltip content={`Bold (${mod}+B)`} placement="top" delay>
        <FormattingButton isActive={activeFormats.bold} onClick={handleBold}>
          <CanvasIcon icon="bold" size={14} />
        </FormattingButton>
      </CanvasTooltip>
      <CanvasTooltip content={`Italic (${mod}+I)`} placement="top" delay>
        <FormattingButton isActive={activeFormats.italic} onClick={handleItalic}>
          <CanvasIcon icon="italic" size={14} />
        </FormattingButton>
      </CanvasTooltip>
      <CanvasTooltip content={`Strikethrough (${mod}${shift}X)`} placement="top" delay>
        <FormattingButton isActive={activeFormats.strikethrough} onClick={handleStrikethrough}>
          <CanvasIcon icon="strikethrough" size={14} />
        </FormattingButton>
      </CanvasTooltip>

      <ToolbarSeparator />

      <CanvasTooltip content="Bullet list" placement="top" delay>
        <FormattingButton isActive={activeFormats.bulletList} onClick={handleBulletList}>
          <CanvasIcon icon="list" size={14} />
        </FormattingButton>
      </CanvasTooltip>
      <CanvasTooltip content="Numbered list" placement="top" delay>
        <FormattingButton isActive={activeFormats.numberedList} onClick={handleNumberedList}>
          <CanvasIcon icon="list-ordered" size={14} />
        </FormattingButton>
      </CanvasTooltip>
    </FormattingToolbarContainer>
  );
};

export const FormattingToolbar = memo(FormattingToolbarComponent);
