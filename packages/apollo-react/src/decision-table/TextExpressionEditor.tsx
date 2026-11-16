import { Input } from '@uipath/apollo-wind';
import type React from 'react';
import { useCallback } from 'react';
import { COLUMN_CODE_FIELD_CLASS } from './sentenceStyles';
import type { ExpressionEditorProps } from './valueTypes';

export interface TextExpressionEditorProps extends ExpressionEditorProps {
  dataTestId: string;
}

/** The popover's own expression editor, a plain text field, for a host that supplies none. */
export const TextExpressionEditor: React.FC<TextExpressionEditorProps> = ({
  value,
  ariaLabel,
  onChange,
  onReady,
  dataTestId,
}) => {
  const attach = useCallback(
    (input: HTMLInputElement | null) => onReady(input && { focus: () => input.focus() }),
    [onReady]
  );
  return (
    <Input
      ref={attach}
      className={COLUMN_CODE_FIELD_CLASS}
      aria-label={ariaLabel}
      data-testid={dataTestId}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  );
};
