import { ApIcon } from "@uipath/portal-shell-react";
import { cx } from "@uipath/uix/core";
import type React from "react";
import { useEffect, useRef } from "react";
import { StyledSearchForm } from "./SearchBox.styles";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  clear: () => void;
  placeholder?: string;
}

export const SearchBox: React.FC<SearchBoxProps> = ({ value, onChange, clear, placeholder = "Search..." }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <StyledSearchForm autoComplete="off" className="searchbox-form" onSubmit={(e) => e.preventDefault()}>
      <div className={cx(`searchbox-container`, { "has-value": !!value })}>
        <span className="searchbox-icon">
          <ApIcon name="search" size="16px" />
        </span>
        <input
          ref={inputRef}
          autoComplete="off"
          type="text"
          className="searchbox-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button type="button" className="searchbox-clear" onClick={clear}>
            <ApIcon name="close" size="16px" />
          </button>
        )}
      </div>
    </StyledSearchForm>
  );
};
