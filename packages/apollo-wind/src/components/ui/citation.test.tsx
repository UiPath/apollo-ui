import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Citation } from './citation';

const data = {
  index: 2,
  title: 'Invoice policy 2026',
  snippet: 'Invoices above $5,000 need a manager approval.',
  source: 'policies.example.com',
  href: 'https://policies.example.com/invoices',
};

describe('Citation', () => {
  it('takes the sm look in a compact ancestor unless a size is set', () => {
    const compactSize = 'in-data-[density=compact]:[--citation-size:1rem]';
    const { rerender } = render(
      <div data-density="compact">
        <Citation index={1} />
      </div>
    );
    expect(screen.getByRole('button')).toHaveClass('h-(--citation-size,1.125rem)', compactSize);
    rerender(
      <div data-density="compact">
        <Citation index={1} size="default" />
      </div>
    );
    expect(screen.getByRole('button')).not.toHaveClass(compactSize);
  });

  it('renders the index in a button named from the title', () => {
    render(<Citation {...data} />);
    const button = screen.getByRole('button', { name: 'Citation 2: Invoice policy 2026' });
    expect(button).toHaveTextContent('2');
    expect(button).toHaveAttribute('data-slot', 'citation');
  });

  it('falls back to the index-only name and renders children in the pill', () => {
    render(<Citation index="a">[a]</Citation>);
    expect(screen.getByRole('button', { name: 'Citation a' })).toHaveTextContent('[a]');
  });

  it('calls onSelect with the citation on click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Citation {...data} onSelect={onSelect} />);
    await user.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toEqual(data);
  });

  it('skips onSelect when onClick prevents default', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Citation {...data} onSelect={onSelect} onClick={(event) => event.preventDefault()} />);
    await user.click(screen.getByRole('button'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('drops an unsafe href from the onSelect payload', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Citation {...data} href="javascript:alert(1)" onSelect={onSelect} />);
    await user.click(screen.getByRole('button'));
    expect(onSelect.mock.calls[0][0]).toEqual({ ...data, href: undefined });
  });

  it('calls onSelect on Enter and Space', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Citation {...data} onSelect={onSelect} />);
    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('shows the preview when focused', async () => {
    const user = userEvent.setup();
    render(<Citation {...data} />);
    expect(screen.queryByText(data.snippet)).not.toBeInTheDocument();
    await user.tab();
    expect(await screen.findByText(data.title)).toBeInTheDocument();
    expect(screen.getByText(data.snippet)).toBeInTheDocument();
    expect(screen.getByText(data.source)).toBeInTheDocument();
  });

  it('portals the preview out of the surrounding prose', async () => {
    const user = userEvent.setup();
    render(
      <p data-testid="prose">
        See <Citation {...data} />
      </p>
    );
    await user.tab();
    const title = await screen.findByText(data.title);
    expect(screen.getByTestId('prose').contains(title)).toBe(false);
  });

  describe('onActiveChange', () => {
    const pill = () => screen.getByRole('button', { name: /Citation/ });

    // jsdom's :focus-visible guess carries state between tests, so pin the modality instead.
    let focusVisible = true;
    beforeEach(() => {
      focusVisible = true;
      const matches = Element.prototype.matches;
      vi.spyOn(Element.prototype, 'matches').mockImplementation(function (
        this: Element,
        selector: string
      ) {
        return selector === ':focus-visible' ? focusVisible : matches.call(this, selector);
      });
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('activates at once on hover and stays active until the preview closes', async () => {
      const user = userEvent.setup();
      const onActiveChange = vi.fn();
      render(<Citation {...data} onActiveChange={onActiveChange} />);
      await user.hover(pill());
      expect(onActiveChange.mock.calls).toEqual([[true]]);

      await screen.findByText(data.snippet);
      await user.unhover(pill());
      // The card is still showing, so the pointer can cross into it.
      expect(onActiveChange.mock.calls).toEqual([[true]]);
      await waitFor(() => expect(screen.queryByText(data.snippet)).not.toBeInTheDocument());
      expect(onActiveChange.mock.calls).toEqual([[true], [false]]);
    });

    it('deactivates at once when the pointer leaves before the preview opens', async () => {
      const user = userEvent.setup();
      const onActiveChange = vi.fn();
      render(<Citation {...data} onActiveChange={onActiveChange} />);
      await user.hover(pill());
      await user.unhover(pill());
      expect(onActiveChange.mock.calls).toEqual([[true], [false]]);
    });

    it('activates at once on focus and deactivates once blurred and closed', async () => {
      const user = userEvent.setup();
      const onActiveChange = vi.fn();
      render(
        <>
          <Citation {...data} onActiveChange={onActiveChange} />
          <button type="button">After</button>
        </>
      );
      await user.tab();
      expect(onActiveChange.mock.calls).toEqual([[true]]);
      await user.tab();
      await waitFor(() => expect(onActiveChange.mock.calls).toEqual([[true], [false]]));
    });

    it('stays active while hovered or focused, reporting each change once', async () => {
      const user = userEvent.setup();
      const onActiveChange = vi.fn();
      render(<Citation index={1} onActiveChange={onActiveChange} />);
      await user.tab();
      await user.hover(pill());
      await user.unhover(pill());
      expect(onActiveChange.mock.calls).toEqual([[true]]);
    });

    it('activates and deactivates at once without a preview', async () => {
      const user = userEvent.setup();
      const onActiveChange = vi.fn();
      render(
        <>
          <Citation {...data} preview={false} onActiveChange={onActiveChange} />
          <button type="button">After</button>
        </>
      );
      await user.hover(pill());
      await user.unhover(pill());
      await user.tab();
      await user.tab();
      expect(onActiveChange.mock.calls).toEqual([[true], [false], [true], [false]]);
      expect(document.querySelector('[data-slot=citation-preview]')).toBeNull();
    });

    it('does not stay active after a click once the pointer leaves', async () => {
      const user = userEvent.setup();
      const onActiveChange = vi.fn();
      render(
        <>
          <Citation {...data} preview={false} onActiveChange={onActiveChange} />
          <Citation index={2} title="Audit guide" onActiveChange={onActiveChange} />
        </>
      );
      const [plain, withPreview] = screen.getAllByRole('button');
      focusVisible = false;
      await user.click(plain);
      expect(plain).toHaveFocus();
      await user.unhover(plain);
      expect(onActiveChange.mock.calls).toEqual([[true], [false]]);

      await user.click(withPreview);
      await user.unhover(withPreview);
      await waitFor(() =>
        expect(onActiveChange.mock.calls).toEqual([[true], [false], [true], [false]])
      );
    });

    it('deactivates on unmount', async () => {
      const user = userEvent.setup();
      const onActiveChange = vi.fn();
      const { unmount } = render(<Citation index={1} onActiveChange={onActiveChange} />);
      await user.hover(pill());
      unmount();
      expect(onActiveChange.mock.calls).toEqual([[true], [false]]);
    });

    it('still calls the host pointer and blur handlers', async () => {
      const user = userEvent.setup();
      const onPointerEnter = vi.fn();
      const onBlur = vi.fn();
      render(
        <>
          <Citation index={1} onPointerEnter={onPointerEnter} onBlur={onBlur} />
          <button type="button">After</button>
        </>
      );
      await user.hover(pill());
      await user.tab();
      await user.tab();
      expect(onPointerEnter).toHaveBeenCalledTimes(1);
      expect(onBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('dismissing on click', () => {
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    it('keeps the preview closed while the pointer stays, until it leaves and returns', async () => {
      const user = userEvent.setup();
      render(<Citation {...data} />);
      const pill = screen.getByRole('button');
      await user.hover(pill);
      await screen.findByText(data.snippet);

      await user.click(pill);
      await waitFor(() => expect(screen.queryByText(data.snippet)).not.toBeInTheDocument());
      // Past the hover card's open delay, which the click's focus would otherwise trigger.
      await wait(400);
      expect(screen.queryByText(data.snippet)).not.toBeInTheDocument();

      await user.unhover(pill);
      await user.hover(pill);
      expect(await screen.findByText(data.snippet)).toBeInTheDocument();
    });

    it('dismisses on Enter until focus leaves and returns', async () => {
      const user = userEvent.setup();
      render(
        <>
          <Citation {...data} />
          <button type="button">After</button>
        </>
      );
      await user.tab();
      await screen.findByText(data.snippet);
      await user.keyboard('{Enter}');
      await waitFor(() => expect(screen.queryByText(data.snippet)).not.toBeInTheDocument());
      await wait(400);
      expect(screen.queryByText(data.snippet)).not.toBeInTheDocument();

      await user.tab();
      await user.tab({ shift: true });
      expect(await screen.findByText(data.snippet)).toBeInTheDocument();
    });
  });

  it('skips the preview without content', async () => {
    const user = userEvent.setup();
    render(<Citation index={1} />);
    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    expect(document.querySelector('[data-slot=citation-preview]')).toBeNull();
  });

  it('skips the preview when preview is false', async () => {
    const user = userEvent.setup();
    render(<Citation {...data} preview={false} />);
    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    expect(screen.queryByText(data.snippet)).not.toBeInTheDocument();
  });

  it('opens the preview on hover', async () => {
    const user = userEvent.setup();
    render(<Citation {...data} />);
    await user.hover(screen.getByRole('button'));
    expect(await screen.findByText(data.snippet)).toBeInTheDocument();
  });

  it('applies the size variant and forwards refs', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Citation ref={ref} index={1} size="sm" className="custom" />);
    expect(ref.current).toHaveAttribute('data-size', 'sm');
    expect(ref.current).toHaveClass('custom', 'h-4');
  });

  it('uses overridden strings', () => {
    render(
      <Citation {...data} strings={{ label: (index, title) => `Quelle ${index}: ${title}` }} />
    );
    expect(
      screen.getByRole('button', { name: 'Quelle 2: Invoice policy 2026' })
    ).toBeInTheDocument();
  });

  it('has no accessibility violations in prose', async () => {
    const { container } = render(
      <p>
        Approval is required above $5,000
        <Citation {...data} /> and must be logged
        <Citation index={3} title="Audit guide" />.
      </p>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
