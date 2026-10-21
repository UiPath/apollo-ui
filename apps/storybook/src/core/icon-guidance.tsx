import { icons, type LucideIcon } from 'lucide-react';
import { PageLink } from './writing/writing-ui';

const ICONS_FOLDER = 'Apollo Core/Icons';

/** Selectable icon tile used by the Icons Apollo and Icons Lucide galleries. */
export const ICON_CARD =
  'flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card p-3 text-foreground transition-colors hover:border-primary hover:bg-muted hover:text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Renders a lucide icon by its canonical name. */
export function Glyph({ name, size = 20 }: { name: string; size?: number }) {
  const Icon = (icons as Record<string, LucideIcon>)[name];
  if (!Icon) return null;
  return <Icon size={size} aria-hidden="true" />;
}

type IconLibrary = 'apollo' | 'lucide';

const LIBRARIES: Record<IconLibrary, { title: string; summary: string; useFor: string[] }> = {
  apollo: {
    title: 'Icons Apollo',
    summary: 'Custom UiPath SVGs from @uipath/apollo-ui-icons.',
    useFor: [
      'UiPath products and logos',
      'Studio activities, BPMN, and agent canvas nodes',
      'Third-party connector logos',
      'Automation objects such as robots, queues, and workflows',
    ],
  },
  lucide: {
    title: 'Icons Lucide',
    summary: 'Open-source UI icons from lucide-react, used by Apollo Wind.',
    useFor: [
      'Generic UI actions: add, edit, delete, copy, search',
      'Navigation: chevrons, arrows, menus',
      'Status: errors, warnings, info, success, loading',
      'Field and editor chrome, including variables (Braces)',
    ],
  },
};

/** Side-by-side "which library?" cards for the Guidance page, each linking to its library. */
export function IconLibraryGuide() {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(LIBRARIES) as IconLibrary[]).map((key) => {
          const lib = LIBRARIES[key];
          return (
            <div
              key={key}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{lib.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{lib.summary}</p>
              </div>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-foreground">
                {lib.useFor.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <PageLink
                title={`${ICONS_FOLDER}/${lib.title}`}
                story={lib.title}
                className="mt-auto inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-xs font-medium text-foreground no-underline transition-colors hover:bg-muted"
              >
                View {lib.title} →
              </PageLink>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Rule of thumb: if the icon names a UiPath concept, use Apollo. If it names a generic UI
        action or state, use Lucide. Never mix two icons for the same meaning on one screen.
      </p>
    </div>
  );
}

/** One-line pointer from a library page back to the Guidance page. */
export function GuidanceLink() {
  return (
    <p className="m-0 text-sm text-muted-foreground">
      Not sure which library to use, or which icon means what?{' '}
      <PageLink
        title={`${ICONS_FOLDER}/Guidance`}
        story="Guidance"
        className="text-primary underline underline-offset-2"
      >
        Read the icon guidance
      </PageLink>
    </p>
  );
}
