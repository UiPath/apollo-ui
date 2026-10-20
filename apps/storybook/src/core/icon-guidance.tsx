import { linkTo } from '@storybook/addon-links';
import { icons, type LucideIcon } from 'lucide-react';
import { SHADOW_SM } from './shared';

const ICONS_FOLDER = 'Apollo Core/Icons';

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

/** Opens a page in the Icons folder; each page's story is named after its title. */
function openIconsPage(title: string) {
  return linkTo(`${ICONS_FOLDER}/${title}`, title);
}

/** Side-by-side "which library?" cards for the Guidance page, each linking to its library. */
export function IconLibraryGuide() {
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {(Object.keys(LIBRARIES) as IconLibrary[]).map((key) => {
          const lib = LIBRARIES[key];
          return (
            <div
              key={key}
              style={{
                background: 'var(--color-background)',
                border: '2px solid var(--color-border)',
                borderRadius: 12,
                padding: 24,
                boxShadow: SHADOW_SM,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-foreground-emp)' }}
                >
                  {lib.title}
                </span>
              </div>
              <span style={{ fontSize: 14, color: 'var(--color-foreground-de-emp)' }}>
                {lib.summary}
              </span>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: 'var(--color-foreground)',
                }}
              >
                {lib.useFor.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={openIconsPage(lib.title)}
                style={{
                  marginTop: 'auto',
                  alignSelf: 'flex-start',
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  padding: '6px 12px',
                  font: 'inherit',
                  fontSize: 13,
                  color: 'var(--color-foreground-emp)',
                  cursor: 'pointer',
                }}
              >
                Go to {lib.title} →
              </button>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 14, color: 'var(--color-foreground-de-emp)', marginTop: 16 }}>
        Rule of thumb: if the icon names a UiPath concept, use Apollo. If it names a generic UI
        action or state, use Lucide. Never mix two icons for the same meaning on one screen.
      </p>
    </div>
  );
}

/** One-line pointer from a library page back to the Guidance page. */
export function GuidanceLink() {
  return (
    <p style={{ margin: 0, fontSize: 14, color: 'var(--color-foreground-de-emp)' }}>
      Not sure which library to use, or which icon means what?{' '}
      <button
        type="button"
        onClick={openIconsPage('Guidance')}
        style={{
          font: 'inherit',
          background: 'none',
          border: 'none',
          padding: 0,
          color: 'var(--color-primary)',
          textDecoration: 'underline',
          cursor: 'pointer',
        }}
      >
        Read the icon guidance
      </button>
    </p>
  );
}
