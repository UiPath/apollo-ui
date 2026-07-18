import { cx } from '@uipath/apollo-react/canvas/utils';
import { memo, useEffect, useRef } from 'react';

import { CanvasIcon } from '../../utils/icon-registry';
import { StyledSearchForm } from './SearchBox.styles';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  clear: () => void;
  placeholder?: string;
  clearButtonLabel?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  clearButtonRef?: React.RefObject<HTMLButtonElement | null>;
  onNavigationKeyDown?: (e: React.KeyboardEvent) => void;
  navigateToFirstItem?: () => void;
  activeDescendantId?: string;
}

export const SearchBox = memo(function SearchBox({
  value,
  onChange,
  clear,
  placeholder = 'Search...',
  clearButtonLabel = 'Clear search',
  inputRef: externalInputRef,
  clearButtonRef,
  onNavigationKeyDown,
  navigateToFirstItem,
  activeDescendantId,
}: SearchBoxProps) {
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalRef;

  useEffect(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  const handleClearButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      inputRef.current?.focus();

      if (!e.shiftKey) {
        navigateToFirstItem?.();
      }
    }
  };

  return (
    <StyledSearchForm
      autoComplete="off"
      className="searchbox-form"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className={cx(`searchbox-container`, { 'has-value': !!value })}>
        <span className="searchbox-icon">
          <CanvasIcon icon="search" size={16} />
        </span>
        <input
          ref={inputRef}
          autoComplete="off"
          type="text"
          role="combobox"
          aria-controls="toolbox-listbox"
          aria-expanded={true}
          className="searchbox-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onNavigationKeyDown}
          aria-activedescendant={activeDescendantId}
        />
        {value && (
          <button
            ref={clearButtonRef}
            type="button"
            className="searchbox-clear"
            aria-label={clearButtonLabel}
            onClick={clear}
            onKeyDown={handleClearButtonKeyDown}
          >
            <CanvasIcon icon="x" size={16} />
          </button>
        )}
      </div>
    </StyledSearchForm>
  );
});
