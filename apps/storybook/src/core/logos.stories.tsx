import type { Meta, StoryObj } from '@storybook/react-vite';
import { Download } from 'lucide-react';
// Raw source of the generated icon index, used to look up each SVG's real export name.
import apolloIconsIndex from '../../../../packages/apollo-ui-icons/src/index.ts?raw';
import agentDesktopLogoUrl from '../../../../packages/apollo-ui-icons/src/svg/studio-icons/agent-desktop-logo.svg?url';
import agentDesktopLogoBgUrl from '../../../../packages/apollo-ui-icons/src/svg/studio-icons/agent-desktop-logo-bg.svg?url';
import agentDesktopLogoFlatUrl from '../../../../packages/apollo-ui-icons/src/svg/studio-icons/agent-desktop-logo-flat.svg?url';
import studioNextLogoUrl from '../../../../packages/apollo-ui-icons/src/svg/studio-icons/studio-next-logo.svg?url';
import studioNextLogoBgUrl from '../../../../packages/apollo-ui-icons/src/svg/studio-icons/studio-next-logo-bg.svg?url';
import autopilotLogoUrl from '../../../../packages/apollo-ui-icons/src/svg/third-party/uipath-autopilot-logo.svg?url';
import faviconUrl from '../../../../packages/apollo-ui-icons/src/svg/third-party/uipath-favicon.svg?url';
import logoFullDarkUrl from '../../../../packages/apollo-ui-icons/src/svg/third-party/uipath-full-dark.svg?url';
import logoFullLightUrl from '../../../../packages/apollo-ui-icons/src/svg/third-party/uipath-full-light.svg?url';
import logoIconDarkUrl from '../../../../packages/apollo-ui-icons/src/svg/third-party/uipath-icon-dark.svg?url';
import { GuidanceLink } from './icon-guidance';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
  SHADOW_SM,
  useCopyToClipboard,
} from './shared';

const meta = {
  title: 'Icons/Logos',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const IMPORT_SOURCE = '@uipath/apollo-ui-icons';
const BRAND_CENTER_URL = 'https://brandcenter.uipath.com/point/en/uipath/component/default/217184';

// Logos are artwork, not UI, so each one is previewed on the fixed background it was drawn for.
const LIGHT_BG = '#ffffff';
const DARK_BG = '#18181b';

// SVG path under svg/ → export name, parsed from the generated index exports.
const EXPORT_NAME = new Map<string, string>(
  [...apolloIconsIndex.matchAll(/export \{ default as (\w+) \} from '\.\/svg\/([^']+)'/g)].map(
    (m) => [m[2], m[1]] as [string, string]
  )
);

function exportName(svgPath: string) {
  return EXPORT_NAME.get(svgPath) ?? svgPath;
}

type Logo = { displayName: string; url: string; componentName: string; bg: string };

const brandLogos: Logo[] = [
  {
    displayName: 'Logo Full Light',
    url: logoFullLightUrl,
    componentName: exportName('third-party/uipath-full-light.svg'),
    bg: LIGHT_BG,
  },
  {
    displayName: 'Logo Full Dark',
    url: logoFullDarkUrl,
    componentName: exportName('third-party/uipath-full-dark.svg'),
    bg: DARK_BG,
  },
  {
    displayName: 'Logo Icon Dark',
    url: logoIconDarkUrl,
    componentName: exportName('third-party/uipath-icon-dark.svg'),
    bg: DARK_BG,
  },
  {
    displayName: 'App Icon & Favicon',
    url: faviconUrl,
    componentName: exportName('third-party/uipath-favicon.svg'),
    bg: LIGHT_BG,
  },
  {
    displayName: 'Autopilot',
    url: autopilotLogoUrl,
    componentName: exportName('third-party/uipath-autopilot-logo.svg'),
    bg: LIGHT_BG,
  },
];

// Product logos that live outside the product-logo folder.
const additionalProductLogos: Logo[] = [
  ['Agent Desktop', agentDesktopLogoUrl, 'studio-icons/agent-desktop-logo.svg'],
  ['Agent Desktop BG', agentDesktopLogoBgUrl, 'studio-icons/agent-desktop-logo-bg.svg'],
  ['Agent Desktop Flat', agentDesktopLogoFlatUrl, 'studio-icons/agent-desktop-logo-flat.svg'],
  ['Studio Next', studioNextLogoUrl, 'studio-icons/studio-next-logo.svg'],
  ['Studio Next BG', studioNextLogoBgUrl, 'studio-icons/studio-next-logo-bg.svg'],
].map(([displayName, url, path]) => ({
  displayName,
  url,
  componentName: exportName(path),
  bg: LIGHT_BG,
}));

const logoModules = import.meta.glob(
  '../../../../packages/apollo-ui-icons/src/svg/product-logo/*.svg',
  {
    eager: true,
    query: '?url',
    import: 'default',
  }
) as Record<string, string>;

function toDisplayName(filename: string): string {
  return filename
    .replace(/\.svg$/, '')
    .split('-')
    .map((word) => {
      if (word === 'ai') return 'AI';
      if (word === 'icon') return '';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .filter(Boolean)
    .join(' ');
}

const productLogos: Logo[] = [
  ...Object.entries(logoModules).map(([path, url]) => {
    const filename = path.split('/').pop() ?? '';
    return {
      displayName: toDisplayName(filename),
      url,
      componentName: exportName(`product-logo/${filename}`),
      bg: LIGHT_BG,
    };
  }),
  ...additionalProductLogos,
].sort((a, b) => a.displayName.localeCompare(b.displayName));

const actionButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  height: 32,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid var(--color-border)',
  background: 'var(--color-background)',
  color: 'var(--color-foreground-emp)',
  font: 'inherit',
  fontSize: 13,
  cursor: 'pointer',
} as const;

function LogoCard({ logo, copied, onCopy }: { logo: Logo; copied: boolean; onCopy: () => void }) {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = logo.url;
    a.download = `${logo.componentName}.svg`;
    a.click();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 12,
        border: '2px solid var(--color-border)',
        background: 'var(--color-background)',
        boxShadow: SHADOW_SM,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          minHeight: 140,
          background: logo.bg,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <img
          src={logo.url}
          alt={logo.displayName}
          style={{ height: 56, width: 'auto', maxWidth: 180, objectFit: 'contain' }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-foreground-emp)' }}>
            {logo.displayName}
          </span>
          <code style={{ fontSize: 12, color: 'var(--color-foreground-de-emp)' }}>
            {logo.componentName}
          </code>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onCopy} style={actionButtonStyle}>
            {copied ? 'Copied!' : 'Copy import'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            aria-label={`Download ${logo.displayName} SVG`}
            title="Download SVG"
            style={{ ...actionButtonStyle, width: 32, padding: 0 }}
          >
            <Download size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

function LogoGrid({ logos }: { logos: Logo[] }) {
  const { copied, copy } = useCopyToClipboard();
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 16,
      }}
    >
      {logos.map((logo) => (
        <LogoCard
          key={logo.componentName}
          logo={logo}
          copied={copied === logo.componentName}
          onCopy={() =>
            copy(logo.componentName, `import { ${logo.componentName} } from '${IMPORT_SOURCE}';`)
          }
        />
      ))}
    </div>
  );
}

function LogosPage() {
  return (
    <PageContainer>
      <PageTitle>Logos</PageTitle>
      <PageDescription>
        UiPath brand logos and product logos from {IMPORT_SOURCE}. The full logo set is in the{' '}
        <a
          href={BRAND_CENTER_URL}
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
        >
          UiPath brand center
        </a>
        .
      </PageDescription>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
        <GuidanceLink />

        <section>
          <SectionHeader>Brand logos ({brandLogos.length})</SectionHeader>
          <SectionDescription>
            Official UiPath brand logos for marketing and product surfaces. Each one is shown on the
            background it was designed for.
          </SectionDescription>
          <LogoGrid logos={brandLogos} />
        </section>

        <section>
          <SectionHeader>Product logos ({productLogos.length})</SectionHeader>
          <SectionDescription>
            Logos for UiPath products and services. Copy the import to use one as a React component,
            or download the SVG.
          </SectionDescription>
          <LogoGrid logos={productLogos} />
        </section>
      </div>
    </PageContainer>
  );
}

export const Logos: Story = {
  render: () => <LogosPage />,
};
