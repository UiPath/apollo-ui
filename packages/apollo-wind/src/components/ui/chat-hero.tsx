'use client';

import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib';

/**
 * The first-run state of a chat, before any message. `centered` is the home screen: greeting,
 * composer and suggestions in a centered column. `docked` sits at the bottom of the message area,
 * start-aligned, while the composer stays in the footer.
 *
 * ```tsx
 * <ChatHero layout="centered">
 *   <ChatHeroHeader>
 *     <ChatHeroTitle>Hello David</ChatHeroTitle>
 *     <ChatHeroDescription>What should we work on today?</ChatHeroDescription>
 *   </ChatHeroHeader>
 *   <ChatComposer onSubmit={send}>...</ChatComposer>
 *   <PromptSuggestions suggestions={suggestions} onSelect={pick} />
 * </ChatHero>
 * ```
 */

export type ChatHeroLayout = 'centered' | 'docked';
export type ChatHeroDensity = 'comfortable' | 'compact';

interface ChatHeroContextValue {
  layout: ChatHeroLayout;
  density: ChatHeroDensity;
}

const ChatHeroContext = React.createContext<ChatHeroContextValue>({
  layout: 'centered',
  density: 'comfortable',
});

const chatHeroVariants = cva('flex w-full min-w-0 flex-1 flex-col', {
  variants: {
    layout: {
      centered: 'mx-auto max-w-[800px] items-center justify-center',
      docked: 'justify-end gap-6 text-start',
    },
    density: {
      comfortable: '',
      compact: '',
    },
  },
  compoundVariants: [
    { layout: 'centered', density: 'comfortable', className: 'gap-8' },
    { layout: 'centered', density: 'compact', className: 'gap-6' },
  ],
  defaultVariants: {
    layout: 'centered',
    density: 'comfortable',
  },
});

export interface ChatHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  layout?: ChatHeroLayout;
  density?: ChatHeroDensity;
}

/** Fills its flex parent, so the parent decides the height that `centered` centers within. */
const ChatHero = React.forwardRef<HTMLDivElement, ChatHeroProps>(
  ({ className, layout, density, ...props }, ref) => {
    const context = React.useMemo<ChatHeroContextValue>(
      () => ({ layout: layout ?? 'centered', density: density ?? 'comfortable' }),
      [layout, density]
    );
    return (
      <ChatHeroContext.Provider value={context}>
        <div
          ref={ref}
          data-slot="chat-hero"
          data-layout={context.layout}
          data-density={context.density}
          className={cn(
            chatHeroVariants({ layout: context.layout, density: context.density }),
            className
          )}
          {...props}
        />
      </ChatHeroContext.Provider>
    );
  }
);
ChatHero.displayName = 'ChatHero';

/** Holds the logo, title and description. Hidden when all of them render nothing. */
const ChatHeroHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { layout } = React.useContext(ChatHeroContext);
    return (
      <div
        ref={ref}
        data-slot="chat-hero-header"
        className={cn(
          'flex w-full min-w-0 flex-col empty:hidden',
          layout === 'centered' ? 'items-center gap-1 text-center' : 'items-start gap-2 text-start',
          className
        )}
        {...props}
      />
    );
  }
);
ChatHeroHeader.displayName = 'ChatHeroHeader';

const ChatHeroLogo = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="chat-hero-logo"
      className={cn('mb-3 flex shrink-0 items-center justify-center', className)}
      {...props}
    />
  )
);
ChatHeroLogo.displayName = 'ChatHeroLogo';

// A host may pass empty welcome copy; rendering nothing keeps the gaps from stacking up.
function isEmptyContent(children: React.ReactNode): boolean {
  return children === undefined || children === null || children === false || children === '';
}

// With asChild the copy sits one level down, inside the element passed as the child.
function isEmptyTitle(children: React.ReactNode, asChild: boolean): boolean {
  if (isEmptyContent(children)) return true;
  if (!asChild || !React.isValidElement<{ children?: React.ReactNode }>(children)) return false;
  return isEmptyContent(children.props.children);
}

const chatHeroTitleVariants = cva('min-w-0 text-foreground', {
  variants: {
    layout: {
      centered: 'font-bold tracking-tight',
      docked: 'font-semibold tracking-tight',
    },
    density: {
      comfortable: '',
      compact: '',
    },
  },
  compoundVariants: [
    { layout: 'centered', density: 'comfortable', className: 'text-4xl leading-10' },
    { layout: 'centered', density: 'compact', className: 'text-2xl leading-8' },
    { layout: 'docked', className: 'text-xl leading-6' },
  ],
  defaultVariants: {
    layout: 'centered',
    density: 'comfortable',
  },
});

export interface ChatHeroTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * Renders the child element instead of an `h2`, such as an `h1` on a page of its own. Put
   * class overrides on `ChatHeroTitle`, not the child: Slot joins the two without resolving
   * conflicts.
   */
  asChild?: boolean;
}

const ChatHeroTitle = React.forwardRef<HTMLHeadingElement, ChatHeroTitleProps>(
  ({ className, asChild = false, children, ...props }, ref) => {
    const { layout, density } = React.useContext(ChatHeroContext);
    if (isEmptyTitle(children, asChild)) return null;
    const Comp = asChild ? Slot : 'h2';
    return (
      <Comp
        ref={ref}
        data-slot="chat-hero-title"
        className={cn(chatHeroTitleVariants({ layout, density }), className)}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
ChatHeroTitle.displayName = 'ChatHeroTitle';

const chatHeroDescriptionVariants = cva('min-w-0 text-muted-foreground', {
  variants: {
    layout: {
      centered: '',
      docked: '',
    },
    density: {
      comfortable: '',
      compact: '',
    },
  },
  compoundVariants: [
    { layout: 'centered', density: 'comfortable', className: 'text-base' },
    { layout: 'centered', density: 'compact', className: 'text-sm' },
    { layout: 'docked', density: 'comfortable', className: 'text-sm leading-5' },
    { layout: 'docked', density: 'compact', className: 'text-xs leading-4' },
  ],
  defaultVariants: {
    layout: 'centered',
    density: 'comfortable',
  },
});

const ChatHeroDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { layout, density } = React.useContext(ChatHeroContext);
  if (isEmptyContent(children)) return null;
  return (
    <p
      ref={ref}
      data-slot="chat-hero-description"
      className={cn(chatHeroDescriptionVariants({ layout, density }), className)}
      {...props}
    >
      {children}
    </p>
  );
});
ChatHeroDescription.displayName = 'ChatHeroDescription';

export {
  ChatHero,
  ChatHeroDescription,
  ChatHeroHeader,
  ChatHeroLogo,
  ChatHeroTitle,
  chatHeroDescriptionVariants,
  chatHeroTitleVariants,
  chatHeroVariants,
};
