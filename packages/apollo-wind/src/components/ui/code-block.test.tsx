import { act, fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CodeBlock, CodeBlockHeader, DEFAULT_CODE_BLOCK_STRINGS } from './code-block';

const SAMPLE = 'const answer: number = 42;\nconsole.log(answer);\n';

describe('CodeBlock', () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the language label and highlights known languages', () => {
    const { container } = render(<CodeBlock code={SAMPLE} language="ts" />);
    expect(screen.getByText('ts')).toHaveAttribute('data-slot', 'code-block-language');
    expect(container.querySelector('[data-slot="code-block"]')).toHaveAttribute(
      'data-language',
      'typescript'
    );
    const keyword = screen.getByText('const');
    expect(keyword).toHaveClass('token');
    expect(keyword).toHaveStyle({ color: 'var(--code-key, var(--foreground))' });
  });

  it('falls back to plain text for an unknown language and keeps its label', () => {
    const { container } = render(<CodeBlock code="IDENTIFICATION DIVISION." language="cobol" />);
    expect(screen.getByText('cobol')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="code-block"]')).toHaveAttribute(
      'data-language',
      'text'
    );
    expect(container.querySelector('.token')).toBeNull();
    expect(container.querySelector('code')).toHaveTextContent('IDENTIFICATION DIVISION.');
  });

  it.each([
    ['cs', 'csharp', 'var robot = new Robot();'],
    ['vb', 'vbnet', 'Dim count As Integer = 1'],
    ['ps1', 'powershell', 'Get-Process | Where-Object { $_.CPU -gt 10 }'],
    ['golang', 'go', 'func main() {}'],
    ['java', 'java', 'public class App {}'],
    ['patch', 'diff', '- old\n+ new'],
  ])('highlights %s as %s', (alias, language, code) => {
    const { container } = render(<CodeBlock code={code} language={alias} />);
    expect(container.querySelector('[data-slot="code-block"]')).toHaveAttribute(
      'data-language',
      language
    );
    expect(container.querySelector('.token')).not.toBeNull();
  });

  it('labels a block without a language as plain text', () => {
    render(<CodeBlock code="plain" />);
    expect(screen.getByText(DEFAULT_CODE_BLOCK_STRINGS.plainText)).toBeInTheDocument();
  });

  it('copies the code without the trailing newline, then resets the copied state', async () => {
    vi.useFakeTimers();
    render(<CodeBlock code={SAMPLE} language="ts" />);
    const button = screen.getByRole('button', { name: 'Copy code' });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(writeText).toHaveBeenCalledWith(SAMPLE.replace(/\n$/, ''));
    expect(button).toHaveAccessibleName('Copy code');
    expect(button).toHaveAttribute('title', 'Copied');
    expect(button).toHaveAttribute('data-copied', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Copied');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(button).toHaveAttribute('title', 'Copy code');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('applies string overrides', async () => {
    render(
      <CodeBlock code="x" strings={{ copy: 'Copier', copied: 'Copié', plainText: 'Texte' }} />
    );
    expect(screen.getByText('Texte')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Copier' });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(button).toHaveAttribute('title', 'Copié');
    expect(screen.getByRole('status')).toHaveTextContent('Copié');
  });

  it('wraps long lines or scrolls a focusable region', () => {
    const { container, rerender } = render(<CodeBlock code="x" />);
    const pre = () => container.querySelector('pre');
    expect(pre()).toHaveAttribute('tabindex', '0');
    expect(pre()).toHaveAttribute('data-wrap', 'false');
    rerender(<CodeBlock code="x" wrap />);
    expect(pre()).not.toHaveAttribute('tabindex');
    expect(pre()).toHaveAttribute('data-wrap', 'true');
  });

  it('renders line numbers on request', () => {
    const { container } = render(<CodeBlock code={'a\nb\nc'} showLineNumbers />);
    expect(container.querySelectorAll('.linenumber')).toHaveLength(3);
  });

  it('can hide the header', () => {
    render(<CodeBlock code="x" hideHeader />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('forwards refs and lets CodeBlockHeader host extra actions', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <CodeBlockHeader ref={ref} code="x" language="json">
        <button type="button">Run</button>
      </CodeBlockHeader>
    );
    expect(ref.current).toHaveAttribute('data-slot', 'code-block-header');
    expect(screen.getByRole('button', { name: 'Run' })).toBeInTheDocument();
  });

  it('places extra actions before the copy button', () => {
    render(<CodeBlock code="x" actions={<button type="button">Expand</button>} />);
    const [first, second] = screen.getAllByRole('button');
    expect(first).toHaveAccessibleName('Expand');
    expect(second).toHaveAccessibleName(DEFAULT_CODE_BLOCK_STRINGS.copy);
  });

  it('has no axe violations', async () => {
    const { container } = render(<CodeBlock code={SAMPLE} language="tsx" showLineNumbers />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
