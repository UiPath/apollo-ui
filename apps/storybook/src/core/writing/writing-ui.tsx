import { linkTo } from '@storybook/addon-links';
import { Check, X } from 'lucide-react';
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useId,
  useState,
} from 'react';

export const WRITING_FOLDER = 'Apollo Core/Writing';
export const GUIDELINES_TITLE = `${WRITING_FOLDER}/Guidelines`;
export const PATTERNS_TITLE = `${WRITING_FOLDER}/Content Patterns`;

const writingCss = `
.sb-writing { color: var(--color-foreground); font-size: 15px; line-height: 1.7; }
.sb-writing h2 { font-size: 20px; font-weight: 600; margin: 40px 0 16px; padding-bottom: 10px; border-bottom: 1px solid var(--color-border); color: var(--color-foreground-emp); }
.sb-writing h3 { font-size: 16px; font-weight: 600; margin: 28px 0 8px; color: var(--color-foreground-emp); }
.sb-writing p { margin: 0 0 12px; }
.sb-writing ul, .sb-writing ol { margin: 0 0 16px; padding-left: 24px; }
.sb-writing ul { list-style: disc; }
.sb-writing ol { list-style: decimal; }
.sb-writing li { margin: 4px 0; }
.sb-writing strong { color: var(--color-foreground-emp); }
.sb-writing code { font-size: 13px; padding: 2px 6px; border-radius: 4px; background: var(--color-background-secondary); color: var(--color-foreground-emp); }
.sb-writing-body > section:first-child > h2:first-child,
.sb-writing-panel > section:first-child > h2:first-child { margin-top: 0; }
.sb-writing-link { color: var(--color-primary); text-decoration: underline; text-underline-offset: 2px; cursor: pointer; background: none; border: 0; padding: 0; font: inherit; }
.sb-writing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin: 0 0 16px; }
.sb-writing-card { border: 1px solid var(--color-border); border-radius: 8px; padding: 16px; background: var(--color-background); }
.sb-writing-card ul { margin: 0; padding-left: 0; list-style: none; }
.sb-writing-card li { margin: 0; padding: 6px 0; border-top: 1px solid var(--color-border); }
.sb-writing-card li:first-child { border-top: 0; padding-top: 0; }
.sb-writing-verdict { display: flex; align-items: center; gap: 8px; font-weight: 600; margin-bottom: 12px; }
.sb-writing-do { border-top: 3px solid var(--color-success-icon); }
.sb-writing-do .sb-writing-verdict { color: var(--color-success-text); }
.sb-writing-dont { border-top: 3px solid var(--color-error-icon); }
.sb-writing-dont .sb-writing-verdict { color: var(--color-error-text); }
.sb-writing-specimen { border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden; margin: 0 0 16px; }
.sb-writing-specimen-caption { padding: 10px 16px; font-size: 13px; font-weight: 600; color: var(--color-foreground-de-emp); background: var(--color-background-secondary); border-bottom: 1px solid var(--color-border); }
.sb-writing-specimen dl { display: grid; grid-template-columns: minmax(120px, max-content) 1fr; gap: 8px 24px; margin: 0; padding: 16px; }
.sb-writing-specimen dt { font-size: 13px; color: var(--color-foreground-de-emp); }
.sb-writing-specimen dd { margin: 0; color: var(--color-foreground-emp); }
.sb-writing-table { width: 100%; border-collapse: collapse; margin: 0 0 20px; font-size: 14px; }
.sb-writing-table-wrap { overflow-x: auto; }
.sb-writing-table th, .sb-writing-table td { padding: 8px 12px; border: 1px solid var(--color-border); text-align: left; vertical-align: top; }
.sb-writing-table th { background: var(--color-background-secondary); color: var(--color-foreground-emp); }
.sb-writing-live { display: flex; justify-content: center; padding: 32px 24px; margin: 0 0 12px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-background-secondary); }
.sb-writing-live p, .sb-writing-live h3 { margin: 0; }
.sb-writing-live ul, .sb-writing-live ol { margin: 0; padding: 0; list-style: none; }
.sb-writing-live li { margin: 0; }
.sb-writing-note { padding: 12px 16px; border-left: 3px solid var(--color-info-icon); background: var(--color-info-background); border-radius: 4px; margin: 0 0 16px; }
`;

/**
 * Page shell shared by every Writing page. Matches the Apollo Core Getting Started layout:
 * a centered column with the title, intro, and (optionally) a tab bar.
 */
export function WritingPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <style>{writingCss}</style>
      <div className="sb-writing mx-auto max-w-4xl space-y-2 px-8 py-16">
        <h1 className="text-[2rem] font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-base leading-7 text-muted-foreground">{intro}</p>
        <div className="sb-writing-body pt-6">{children}</div>
      </div>
    </div>
  );
}

/** One tab of a {@link WritingTabs} set. Rendered by WritingTabs, never on its own. */
export function WritingTab(_props: { label: string; children: ReactNode }) {
  return null;
}

/** Getting Started style tab bar. Children are {@link WritingTab} elements. */
export function WritingTabs({ children }: { children: ReactNode }) {
  const tabs = Children.toArray(children).filter(isValidElement) as ReactElement<{
    label: string;
    children: ReactNode;
  }>[];
  const [active, setActive] = useState(0);
  const id = useId();
  const current = tabs[active] ?? tabs[0];

  return (
    <div>
      <div role="tablist" className="flex flex-wrap gap-1 border-b border-border">
        {tabs.map((tab, i) => (
          <button
            type="button"
            role="tab"
            key={tab.props.label}
            id={`${id}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${id}-panel`}
            className={
              i === active
                ? 'cursor-pointer border-b-2 border-primary px-4 pb-3 text-sm font-medium text-foreground'
                : 'cursor-pointer px-4 pb-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
            }
            onClick={() => setActive(i)}
          >
            {tab.props.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${active}`}
        className="sb-writing-panel pt-6"
      >
        {current?.props.children}
      </div>
    </div>
  );
}

export function Section({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <h2>{title}</h2>
      {intro && <p>{intro}</p>}
      {children}
    </section>
  );
}

export function SubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

export function RuleList({ rules }: { rules: ReactNode[] }) {
  return (
    <ul>
      {rules.map((rule, i) => (
        <li key={i}>{rule}</li>
      ))}
    </ul>
  );
}

/** Side-by-side cards of copy to use and copy to avoid. An empty side is left out. */
export function DoDont({
  doItems = [],
  dontItems = [],
}: {
  doItems?: ReactNode[];
  dontItems?: ReactNode[];
}) {
  return (
    <div className="sb-writing-grid">
      {doItems.length > 0 && (
        <div className="sb-writing-card sb-writing-do">
          <div className="sb-writing-verdict">
            <Check size={18} aria-hidden="true" /> Do
          </div>
          <RuleList rules={doItems} />
        </div>
      )}
      {dontItems.length > 0 && (
        <div className="sb-writing-card sb-writing-dont">
          <div className="sb-writing-verdict">
            <X size={18} aria-hidden="true" /> Don't
          </div>
          <RuleList rules={dontItems} />
        </div>
      )}
    </div>
  );
}

/** A finished piece of UI copy, shown field by field (title, body, CTA, and so on). */
export function CopyExample({ caption, fields }: { caption: string; fields: [string, string][] }) {
  return (
    <figure className="sb-writing-specimen" style={{ margin: '0 0 16px' }}>
      <figcaption className="sb-writing-specimen-caption">{caption}</figcaption>
      <dl>
        {fields.map(([label, value]) => (
          <div key={label} style={{ display: 'contents' }}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}

export function GuideTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  return (
    <div className="sb-writing-table-wrap">
      <table className="sb-writing-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Frame for a live Apollo Wind rendering of a pattern's example copy. */
export function LivePreview({ children }: { children: ReactNode }) {
  return <div className="sb-writing-live">{children}</div>;
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="sb-writing-note">{children}</p>;
}

/** Opens another Writing page. `title` is a sidebar path, `story` the page name in it. */
export function PageLink({
  title,
  story,
  children,
}: {
  title: string;
  story: string;
  children: ReactNode;
}) {
  return (
    <button type="button" className="sb-writing-link" onClick={linkTo(title, story)}>
      {children}
    </button>
  );
}

export function GuidelineLink({ story, children }: { story: string; children?: ReactNode }) {
  return (
    <PageLink title={GUIDELINES_TITLE} story={story}>
      {children ?? story}
    </PageLink>
  );
}

export function PatternLink({ story, children }: { story: string; children?: ReactNode }) {
  return (
    <PageLink title={PATTERNS_TITLE} story={story}>
      {children ?? story}
    </PageLink>
  );
}
