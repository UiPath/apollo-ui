import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Button } from './button';
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from './button-group';

describe('ButtonGroup', () => {
  it('renders children', () => {
    render(
      <ButtonGroup>
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>
    );
    expect(screen.getByRole('button', { name: 'One' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Two' })).toBeInTheDocument();
  });

  it('renders as a labelled group', () => {
    render(
      <ButtonGroup>
        <Button>One</Button>
      </ButtonGroup>
    );
    expect(screen.getByRole('group', { name: 'Button group' })).toBeInTheDocument();
  });

  it('applies horizontal orientation classes by default', () => {
    render(
      <ButtonGroup>
        <Button>One</Button>
      </ButtonGroup>
    );
    const group = screen.getByRole('group');
    expect(group).toHaveClass('inline-flex');
    expect(group).not.toHaveClass('flex-col');
  });

  it('applies vertical orientation classes', () => {
    render(
      <ButtonGroup orientation="vertical">
        <Button>One</Button>
      </ButtonGroup>
    );
    expect(screen.getByRole('group')).toHaveClass('flex-col');
  });

  it('merges custom className', () => {
    render(
      <ButtonGroup className="custom-group">
        <Button>One</Button>
      </ButtonGroup>
    );
    const group = screen.getByRole('group');
    expect(group).toHaveClass('custom-group');
    expect(group).toHaveClass('inline-flex');
  });

  it('forwards its ref to the group element', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ButtonGroup ref={ref}>
        <Button>One</Button>
      </ButtonGroup>
    );
    expect(ref.current).toBe(screen.getByRole('group'));
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ButtonGroup>
        <Button>Copy</Button>
        <ButtonGroupSeparator />
        <Button>Paste</Button>
      </ButtonGroup>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('ButtonGroupSeparator', () => {
  it('renders a separator with vertical orientation by default', () => {
    render(
      <ButtonGroup>
        <Button>One</Button>
        <ButtonGroupSeparator />
        <Button>Two</Button>
      </ButtonGroup>
    );
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    expect(separator).toHaveClass('bg-border', 'w-px');
  });

  it('supports horizontal orientation', () => {
    render(
      <ButtonGroup orientation="vertical">
        <Button>One</Button>
        <ButtonGroupSeparator orientation="horizontal" />
        <Button>Two</Button>
      </ButtonGroup>
    );
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    expect(separator).toHaveClass('h-px');
  });

  it('merges custom className', () => {
    render(
      <ButtonGroup>
        <Button>One</Button>
        <ButtonGroupSeparator className="custom-separator" />
        <Button>Two</Button>
      </ButtonGroup>
    );
    expect(screen.getByRole('separator')).toHaveClass('custom-separator');
  });
});

describe('ButtonGroupText', () => {
  it('renders text content with styling classes', () => {
    render(
      <ButtonGroup>
        <ButtonGroupText>Label</ButtonGroupText>
        <Button>Action</Button>
      </ButtonGroup>
    );
    const text = screen.getByText('Label');
    expect(text.tagName).toBe('SPAN');
    expect(text).toHaveClass('text-muted-foreground');
  });

  it('renders as its child element when asChild is set', () => {
    render(
      <ButtonGroup>
        <ButtonGroupText asChild>
          <label htmlFor="group-input">Field label</label>
        </ButtonGroupText>
        <input id="group-input" type="text" />
      </ButtonGroup>
    );
    const label = screen.getByText('Field label');
    expect(label.tagName).toBe('LABEL');
    expect(label).toHaveClass('text-muted-foreground');
  });

  it('merges custom className', () => {
    render(
      <ButtonGroup>
        <ButtonGroupText className="custom-text">Label</ButtonGroupText>
      </ButtonGroup>
    );
    expect(screen.getByText('Label')).toHaveClass('custom-text');
  });
});
