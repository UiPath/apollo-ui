import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { ApIconButton } from './ApIconButton';

describe('ApIconButton', () => {
  it('renders with label prop', () => {
    const { container } = render(
      <ApIconButton label="Test button">
        <span>Icon</span>
      </ApIconButton>
    );
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Test button');
  });

  it('applies default color primary', () => {
    const { container } = render(
      <ApIconButton label="Test">
        <span>Icon</span>
      </ApIconButton>
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('MuiIconButton-colorPrimary');
  });

  it('applies custom color', () => {
    const { container } = render(
      <ApIconButton label="Test" color="secondary">
        <span>Icon</span>
      </ApIconButton>
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('MuiIconButton-colorSecondary');
  });

  it('applies default size medium', () => {
    const { container } = render(
      <ApIconButton label="Test">
        <span>Icon</span>
      </ApIconButton>
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('MuiIconButton-sizeMedium');
  });

  it('applies custom size', () => {
    const { container } = render(
      <ApIconButton label="Test" size="small">
        <span>Icon</span>
      </ApIconButton>
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('MuiIconButton-sizeSmall');
  });

  it('disables button when disabled prop is true', () => {
    const { container } = render(
      <ApIconButton label="Test" disabled>
        <span>Icon</span>
      </ApIconButton>
    );
    const button = container.querySelector('button');
    expect(button).toBeDisabled();
  });

  it('sets aria-expanded when expanded prop is provided', () => {
    const { container } = render(
      <ApIconButton label="Test" expanded={true}>
        <span>Icon</span>
      </ApIconButton>
    );
    const button = container.querySelector('button');
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('does not set aria-expanded when expanded prop is not provided', () => {
    const { container } = render(
      <ApIconButton label="Test">
        <span>Icon</span>
      </ApIconButton>
    );
    const button = container.querySelector('button');
    expect(button).not.toHaveAttribute('aria-expanded');
  });

  it('renders children content', () => {
    const { getByText } = render(
      <ApIconButton label="Test">
        <span>Custom Icon</span>
      </ApIconButton>
    );
    expect(getByText('Custom Icon')).toBeInTheDocument();
  });

  it('forwards ref to button element', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <ApIconButton label="Test" ref={ref}>
        <span>Icon</span>
      </ApIconButton>
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('passes through additional props', () => {
    const { container } = render(
      <ApIconButton label="Test" data-testid="custom-button" className="custom-class">
        <span>Icon</span>
      </ApIconButton>
    );
    const button = container.querySelector('button');
    expect(button).toHaveAttribute('data-testid', 'custom-button');
    expect(button).toHaveClass('custom-class');
  });
});
