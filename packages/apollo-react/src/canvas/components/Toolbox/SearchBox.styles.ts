import styled from "@emotion/styled";

export const StyledSearchForm = styled.form`
  width: 100%;

  .searchbox-container {
    display: flex;
    align-items: center;
    background: var(--color-background);
    border: 1px solid var(--color-border-de-emp);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    padding: 0 12px;
    height: 32px;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
    position: relative;
  }

  .searchbox-container:focus-within {
    border: 2px solid var(--color-primary);
  }

  .searchbox-container.has-value .searchbox-clear {
    visibility: visible;
  }

  .searchbox-icon {
    display: flex;
    align-items: center;
    margin-right: 8px;
    color: var(--color-foreground);
  }

  .searchbox-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 14px;
    background: transparent;
    color: var(--color-foreground);
    padding: 6px 0;
  }

  .searchbox-input::placeholder {
    font-size: 14px;
    font-family:
      Noto Sans,
      sans-serif;
    line-height: 20px;
    color: var(--color-foreground-de-emp);
  }

  .searchbox-clear {
    display: flex;
    align-items: center;
    margin-left: 8px;
    color: var(--color-foreground-de-emp);
    cursor: pointer;
    transition: color 0.2s;
    visibility: hidden;
    border: none;
    background: transparent;
  }

  .searchbox-clear:hover {
    color: var(--color-primary);
  }
`;
