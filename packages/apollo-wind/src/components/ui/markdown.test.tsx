import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef, type ReactNode, useEffect } from 'react';
import { describe, expect, it } from 'vitest';
import { Markdown } from './markdown';

const CURSOR = '[data-slot="markdown-cursor"]';

describe('Markdown', () => {
  it('renders GFM tables inside a scroll frame', () => {
    const { container } = render(<Markdown>{'| A | B |\n| - | - |\n| 1 | 2 |'}</Markdown>);
    const table = screen.getByRole('table');
    expect(table.parentElement).toHaveAttribute('data-slot', 'markdown-table');
    expect(screen.getByRole('columnheader', { name: 'A' })).toBeInTheDocument();
    expect(container.querySelectorAll('td')).toHaveLength(2);
  });

  it('renders task lists as read-only checkboxes with the state read once as text', () => {
    const { container } = render(<Markdown>{'- [x] Ship it\n- [ ] Write docs'}</Markdown>);
    expect(screen.queryByRole('checkbox')).toBeNull();
    const [done, open] = container.querySelectorAll('input[type="checkbox"]');
    expect(done).toBeChecked();
    expect(done).toBeDisabled();
    expect(done).toHaveAttribute('aria-hidden', 'true');
    expect(open).not.toBeChecked();
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent(/^Done Ship it$/);
    expect(items[1]).toHaveTextContent(/^Not done Write docs$/);
  });

  it('renders inline and block math as MathML through KaTeX', () => {
    const { container } = render(
      <Markdown>{'Euler: $$e^{i\\pi} + 1 = 0$$\n\n$$\n\\int_0^1 x\\,dx\n$$'}</Markdown>
    );
    expect(container.querySelectorAll('.katex')).toHaveLength(2);
    expect(container.querySelector('.katex > math[display="block"]')).not.toBeNull();
  });

  it('keeps single dollar signs literal', () => {
    const { container } = render(<Markdown>{'It costs $5 and $10.'}</Markdown>);
    expect(container.querySelector('.katex')).toBeNull();
    expect(screen.getByText('It costs $5 and $10.')).toBeInTheDocument();
  });

  it('renders fenced code with CodeBlock and inline code as <code>', () => {
    const { container } = render(<Markdown>{'Use `npm`:\n\n```bash\nnpm i\n```'}</Markdown>);
    const block = container.querySelector('[data-slot="code-block"]');
    expect(block).toHaveAttribute('data-language', 'bash');
    expect(block).toHaveTextContent('npm i');
    expect(screen.getByText('npm', { selector: 'p > code' })).toBeInTheDocument();
  });

  it('opens links in a new tab except in-page anchors and mail links', () => {
    render(
      <Markdown>
        {'[Docs](https://example.com), [Home](/home), [Top](#top) and [Mail](mailto:a@b.co)'}
      </Markdown>
    );
    for (const name of ['Docs', 'Home']) {
      const link = screen.getByRole('link', { name });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
    }
    for (const name of ['Top', 'Mail']) {
      expect(screen.getByRole('link', { name })).not.toHaveAttribute('target');
    }
  });

  it('turns <br> into a line break and leaves other raw HTML as text', () => {
    const { container } = render(
      <Markdown>{'| A |\n| - |\n| one<br>two<br />three |\n\nSee <b>this</b>.'}</Markdown>
    );
    expect(container.querySelectorAll('td br')).toHaveLength(2);
    expect(container.querySelector('td')).not.toHaveTextContent('<br');
    expect(screen.getByText('See <b>this</b>.')).toBeInTheDocument();
  });

  it('passes codeWrap and renderCodeActions to fenced code blocks', () => {
    const seen: unknown[] = [];
    const { container } = render(
      <Markdown
        codeWrap
        renderCodeActions={(block) => {
          seen.push(block);
          return <button type="button">Preview</button>;
        }}
      >
        {'```html\n<p>Hi</p>\n```'}
      </Markdown>
    );
    expect(seen).toContainEqual({ code: '<p>Hi</p>', language: 'html' });
    expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="code-block-body"]')).toHaveAttribute(
      'data-wrap',
      'true'
    );
  });

  it('drops javascript: links', () => {
    render(<Markdown>{'[x](javascript:alert(1))'}</Markdown>);
    expect(screen.getByText('x').closest('a')).not.toHaveAttribute('href', 'javascript:alert(1)');
  });

  it('applies `components` overrides over the built-in renderers', () => {
    render(
      <Markdown
        components={{
          a: ({ href, children }) => (
            <button type="button" data-href={href}>
              {children}
            </button>
          ),
        }}
      >
        {'See [the source](https://example.com).'}
      </Markdown>
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByRole('button', { name: 'the source' })).toHaveAttribute(
      'data-href',
      'https://example.com'
    );
  });

  it('shows the cursor only while streaming, at the end of the last text', () => {
    const { container, rerender } = render(<Markdown>{'Hello **world**'}</Markdown>);
    expect(container.querySelector(CURSOR)).toBeNull();
    expect(container.firstChild).not.toHaveAttribute('aria-busy');

    rerender(<Markdown streaming>{'Hello **world**'}</Markdown>);
    const cursor = container.querySelector(CURSOR);
    expect(cursor).toHaveAttribute('aria-hidden', 'true');
    expect(cursor?.parentElement?.tagName).toBe('P');
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
  });

  it('places the cursor in the deepest trailing list item', () => {
    const { container } = render(<Markdown streaming>{'- one\n- two\n  - nested'}</Markdown>);
    expect(container.querySelector(CURSOR)?.parentElement).toHaveTextContent(/^nested$/);
  });

  it('places the cursor after a trailing code block', () => {
    const { container } = render(<Markdown streaming>{'```ts\nconst a = 1'}</Markdown>);
    const cursor = container.querySelector(CURSOR);
    expect(cursor?.previousElementSibling).toHaveAttribute('data-slot', 'code-block');
  });

  it('renders images as links unless the policy allows them', () => {
    const remote = '![Chart](https://cdn.example.com/chart.png)';
    const { rerender } = render(<Markdown>{remote}</Markdown>);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Chart' });
    expect(link).toHaveAttribute('href', 'https://cdn.example.com/chart.png');
    expect(link).toHaveAttribute('data-slot', 'markdown-image-link');

    rerender(<Markdown images="all">{remote}</Markdown>);
    expect(screen.getByRole('img', { name: 'Chart' })).toHaveAttribute(
      'referrerpolicy',
      'no-referrer'
    );

    rerender(
      <Markdown images={(src) => src.startsWith('https://cdn.example.com/')}>{remote}</Markdown>
    );
    expect(screen.getByRole('img', { name: 'Chart' })).toBeInTheDocument();

    rerender(<Markdown>{'![Local](/assets/chart.png)'}</Markdown>);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Local' })).toHaveAttribute(
      'href',
      '/assets/chart.png'
    );

    rerender(<Markdown images="same-origin">{'![Local](/assets/chart.png)'}</Markdown>);
    expect(screen.getByRole('img', { name: 'Local' })).toHaveAttribute('src', '/assets/chart.png');
  });

  it('renders a linked image as text inside the link instead of nesting links', () => {
    const { container } = render(
      <Markdown>{'[![Build](https://cdn.example.com/badge.svg)](https://example.com/ci)'}</Markdown>
    );
    expect(container.querySelector('a a')).toBeNull();
    const link = screen.getByRole('link', { name: 'Build' });
    expect(link).toHaveAttribute('href', 'https://example.com/ci');
    expect(link.querySelector('[data-slot="markdown-image-text"]')).toHaveTextContent('Build');
  });

  it('scopes footnote ids to each instance', () => {
    const { container } = render(
      <>
        <Markdown>{'One[^1]\n\n[^1]: First note'}</Markdown>
        <Markdown>{'Two[^1]\n\n[^1]: Second note'}</Markdown>
      </>
    );
    const ids = [...container.querySelectorAll('[id]')].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const root of container.querySelectorAll('[data-slot="markdown"]')) {
      const reference = root.querySelector('a[data-footnote-ref]');
      const target = reference?.getAttribute('href')?.slice(1) ?? '';
      expect(root.querySelector(`[id="${target}"]`)).not.toBeNull();
      const label = reference?.getAttribute('aria-describedby') ?? '';
      expect(root.querySelector(`[id="${label}"]`)).toHaveTextContent('Footnotes');
    }
  });

  it('keeps rendered nodes mounted when `components` and `images` are passed inline', () => {
    const source = '**bold**\n\n```ts\nconst a = 1\n```';
    let mounts = 0;
    const Strong = ({ children }: { children?: ReactNode }) => {
      useEffect(() => {
        mounts++;
      }, []);
      return <strong>{children}</strong>;
    };
    const view = () => (
      <Markdown components={{ strong: Strong }} images={() => false}>
        {source}
      </Markdown>
    );
    const { container, rerender } = render(view());
    const block = container.querySelector('[data-slot="code-block"]');
    rerender(view());
    rerender(view());
    expect(mounts).toBe(1);
    expect(container.querySelector('[data-slot="code-block"]')).toBe(block);
  });

  it('forwards the ref and the className', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Markdown ref={ref} className="custom">
        text
      </Markdown>
    );
    expect(ref.current).toHaveAttribute('data-slot', 'markdown');
    expect(ref.current).toHaveClass('custom');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Markdown streaming>
        {[
          '# Title',
          'Some *text* with a [link](https://example.com) and `code`.',
          '> A quote',
          '- [x] Done item\n- [ ] Open item',
          '| Name | Value |\n| ---- | ----- |\n| a | 1 |',
          '```json\n{ "a": 1 }\n```',
          'Footnote reference[^1].\n\n[^1]: The note.',
          '$$\nx^2\n$$',
        ].join('\n\n')}
      </Markdown>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
