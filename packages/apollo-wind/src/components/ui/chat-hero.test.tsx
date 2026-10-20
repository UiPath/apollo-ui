import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import {
  ChatComposer,
  ChatComposerInputGroup,
  ChatComposerSubmit,
  ChatComposerTextarea,
  ChatComposerToolbar,
} from './chat-composer';
import {
  ChatHero,
  ChatHeroDescription,
  ChatHeroHeader,
  ChatHeroLogo,
  ChatHeroTitle,
} from './chat-hero';
import { PromptSuggestions } from './prompt-suggestions';

function Example({
  onSubmit,
  onSelect,
  ...props
}: React.ComponentProps<typeof ChatHero> & {
  onSubmit?: (value: string) => void;
  onSelect?: () => void;
}) {
  return (
    <ChatHero {...props}>
      <ChatHeroHeader>
        <ChatHeroLogo>
          <svg aria-hidden="true" />
        </ChatHeroLogo>
        <ChatHeroTitle>Hello David</ChatHeroTitle>
        <ChatHeroDescription>What should we work on today?</ChatHeroDescription>
      </ChatHeroHeader>
      <ChatComposer onSubmit={onSubmit}>
        <ChatComposerInputGroup>
          <ChatComposerTextarea />
          <ChatComposerToolbar>
            <ChatComposerSubmit />
          </ChatComposerToolbar>
        </ChatComposerInputGroup>
      </ChatComposer>
      <PromptSuggestions suggestions={[{ label: 'Find CD rates' }]} onSelect={onSelect} />
    </ChatHero>
  );
}

describe('ChatHero', () => {
  it('renders the title as a heading and the description', () => {
    render(<Example />);
    expect(screen.getByRole('heading', { level: 2, name: 'Hello David' })).toBeInTheDocument();
    expect(screen.getByText('What should we work on today?')).toBeInTheDocument();
  });

  it('submits through the composer inside it', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Example onSubmit={onSubmit} />);

    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Automate my invoices');
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(onSubmit).toHaveBeenCalledWith('Automate my invoices', { attachments: [] });
  });

  it('passes suggestion clicks through', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Example onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'Find CD rates' }));
    expect(onSelect).toHaveBeenCalledWith({ label: 'Find CD rates' });
  });

  it('defaults to the centered layout and reflects layout and density', () => {
    const { container, rerender } = render(<Example />);
    const hero = container.querySelector('[data-slot="chat-hero"]');
    expect(hero).toHaveAttribute('data-layout', 'centered');
    expect(hero).toHaveAttribute('data-density', 'comfortable');

    rerender(<Example layout="docked" density="compact" />);
    expect(hero).toHaveAttribute('data-layout', 'docked');
    expect(hero).toHaveAttribute('data-density', 'compact');
  });

  it('renders nothing for empty title and description', () => {
    const { container } = render(
      <ChatHero layout="docked">
        <ChatHeroHeader>
          <ChatHeroTitle>{''}</ChatHeroTitle>
          <ChatHeroDescription>{''}</ChatHeroDescription>
        </ChatHeroHeader>
      </ChatHero>
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="chat-hero-header"]')).toBeEmptyDOMElement();
  });

  it('renders nothing for an empty asChild title', () => {
    const title: string = '';
    const { container } = render(
      <ChatHero>
        <ChatHeroHeader>
          <ChatHeroTitle asChild>
            <h1>{title}</h1>
          </ChatHeroTitle>
        </ChatHeroHeader>
      </ChatHero>
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="chat-hero-header"]')).toBeEmptyDOMElement();
  });

  it('renders the title as its child with asChild', () => {
    render(
      <ChatHero>
        <ChatHeroTitle asChild>
          <h1>Welcome</h1>
        </ChatHeroTitle>
      </ChatHero>
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome' })).toHaveAttribute(
      'data-slot',
      'chat-hero-title'
    );
  });

  it('has no accessibility violations in either layout', async () => {
    const { container } = render(
      <>
        <Example />
        <Example layout="docked" />
      </>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
