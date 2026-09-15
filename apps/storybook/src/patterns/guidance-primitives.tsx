import { Check } from 'lucide-react';
import type * as React from 'react';
import { FormField, FormFieldLabel } from '@/components/ui/form-field';
import { fontFamily } from '@/foundation/Future/typography';
import { cn } from '@/lib';

/**
 * Shared building blocks for the long-form guidance pages under Apollo Wind/Forms
 * (Field Help Guidance, Field Validation Guidance). Keep additions presentational so every page reads the same.
 */

export function GuidancePage({
  globalTheme,
  title,
  intro,
  children,
}: {
  globalTheme: string;
  title: string;
  /** Rendered inside a `<p>`, so plain text only -- not a place for block-level markup. */
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(globalTheme, 'min-h-screen w-full bg-background text-foreground')}
      style={{ fontFamily: fontFamily.base }}
    >
      <main className="mx-auto max-w-3xl p-8">
        <header>
          <h1 className="text-[2rem] font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-2 text-base leading-7 text-muted-foreground">{intro}</p>
        </header>
        {children}
      </main>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">{children}</h2>;
}

export function SectionDescription({ children }: { children: React.ReactNode }) {
  return <p className="mb-6 text-base leading-7 text-muted-foreground">{children}</p>;
}

export function Divider() {
  return <div className="my-10 h-px bg-border" />;
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-medium text-foreground">
      {children}
    </code>
  );
}

export function CodeBlock({ children }: { children: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-4">
      <pre className="text-sm leading-6 text-foreground">
        <code style={{ fontFamily: fontFamily.monospace }}>{children}</code>
      </pre>
    </div>
  );
}

export function InfoCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
      {children}
    </div>
  );
}

export function GuidanceList({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-2 text-sm leading-6 text-muted-foreground">{children}</ul>;
}

export function GuidanceItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
      <span>{children}</span>
    </li>
  );
}

export function PatternCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {eyebrow}
      </span>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mb-5 text-sm leading-6 text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}

/** A "Do" or "Don't" example card. */
export function ExampleCard({
  kind,
  children,
  note,
}: {
  kind: 'do' | 'dont';
  children: React.ReactNode;
  note: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        {kind === 'do' ? (
          <Check aria-hidden="true" className="size-4 text-primary" />
        ) : (
          <DontIcon />
        )}
        {kind === 'do' ? 'Do' : 'Don’t'}
      </div>
      {children}
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{note}</p>
    </div>
  );
}

function DontIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 text-destructive"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

/**
 * A single labeled field: `<FormFieldLabel>` above `children`, in a real `<FormField>`.
 * The reach-for-first pattern in these guidance pages instead of a hand-built
 * `<div className="grid gap-1.5">` -- a hand-built stack doesn't get FormField's
 * validation-message spacing rule for free (see form-field.tsx), so a message inside
 * one would show a different gap than the same field composed through `FormField`.
 */
export function FieldExample({
  htmlFor,
  label,
  required,
  children,
}: {
  htmlFor: string;
  label: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <FormField>
      <FormFieldLabel htmlFor={htmlFor} required={required}>
        {label}
      </FormFieldLabel>
      {children}
    </FormField>
  );
}
