import { cx } from '@uipath/apollo-react/canvas/utils';
import { ApIcon } from '@uipath/apollo-react/material/components';
import { memo, useEffect, useRef } from 'react';
import { StyledSearchForm } from './SearchBox.styles';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  clear: () => void;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onNavigationKeyDown?: (e: React.KeyboardEvent) => void;
  activeDescendantId?: string;
}

export const SearchBox = memo(function SearchBox({
  value,
  onChange,
  clear,
  placeholder = 'Search...',
  inputRef: externalInputRef,
  onNavigationKeyDown,
  activeDescendantId,
}: SearchBoxProps) {
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalRef;

  useEffect(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  return (
    <StyledSearchForm
      autoComplete="off"
      className="searchbox-form"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className={cx(`searchbox-container`, { 'has-value': !!value })}>
        <span className="searchbox-icon">
          <ApIcon name="search" size="16px" />
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
          <button type="button" className="searchbox-clear" onClick={clear}>
            <ApIcon name="close" size="16px" />
          </button>
        )}
      </div>
    </StyledSearchForm>
  );
});
