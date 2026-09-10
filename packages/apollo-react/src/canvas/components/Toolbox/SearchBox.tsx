import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@uipath/apollo-wind';
import { memo, useEffect, useRef } from 'react';

import { CanvasIcon } from '../../utils/icon-registry';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  clear: () => void;
  placeholder?: string;
  clearButtonAriaLabel?: string;
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
  clearButtonAriaLabel = 'Clear search',
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
    // The form wrapper only swallows Enter, so a Toolbox embedded in a
    // consumer's form can't submit it from the search field.
    <form
      autoComplete="off"
      className="w-full"
      onSubmit={(e) => e.preventDefault()}
      data-testid="toolbox-search"
    >
      {/* One step below Wind's stock field height in both theme families: the
          picker stacks quick actions, a title and the field above the list, so
          the roomier default costs list rows the panel can't spare. */}
      <InputGroup className="h-8 future:h-9">
        <InputGroupAddon align="inline-start">
          <CanvasIcon icon="search" size={16} />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          autoComplete="off"
          type="text"
          role="combobox"
          aria-controls="toolbox-listbox"
          aria-expanded={true}
          aria-activedescendant={activeDescendantId}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onNavigationKeyDown}
        />
        {value && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              ref={clearButtonRef}
              icon
              size="3xs"
              aria-label={clearButtonAriaLabel}
              onClick={clear}
              onKeyDown={handleClearButtonKeyDown}
            >
              <CanvasIcon icon="x" size={16} />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
    </form>
  );
});
