import type { Meta, StoryObj } from '@storybook/react-vite';
import { Copy, Download } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { fontFamily } from './typography';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Theme/Logos',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Brand logo data
// ============================================================================

import agentDesktopLogoUrl from '../../../../apollo-core/src/icons/svg/studio-icons/agent-desktop-logo.svg?url';
import agentDesktopLogoBgUrl from '../../../../apollo-core/src/icons/svg/studio-icons/agent-desktop-logo-bg.svg?url';
import agentDesktopLogoFlatUrl from '../../../../apollo-core/src/icons/svg/studio-icons/agent-desktop-logo-flat.svg?url';
import studioNextLogoUrl from '../../../../apollo-core/src/icons/svg/studio-icons/studio-next-logo.svg?url';
import studioNextLogoBgUrl from '../../../../apollo-core/src/icons/svg/studio-icons/studio-next-logo-bg.svg?url';
import autopilotLogoUrl from '../../../../apollo-core/src/icons/svg/third-party/uipath-autopilot-logo.svg?url';
import faviconUrl from '../../../../apollo-core/src/icons/svg/third-party/uipath-favicon.svg?url';
import logoFullDarkUrl from '../../../../apollo-core/src/icons/svg/third-party/uipath-full-dark.svg?url';
import logoFullLightUrl from '../../../../apollo-core/src/icons/svg/third-party/uipath-full-light.svg?url';
import logoIconDarkUrl from '../../../../apollo-core/src/icons/svg/third-party/uipath-icon-dark.svg?url';

const LIGHT_BG = '#ffffff';
const DARK_BG = '#18181b';

const brandLogos = [
  {
    displayName: 'Logo Full Light',
    url: logoFullLightUrl,
    componentName: 'UiPathFullLight',
    bg: LIGHT_BG,
  },
  {
    displayName: 'Logo Full Dark',
    url: logoFullDarkUrl,
    componentName: 'UiPathFullDark',
    bg: DARK_BG,
  },
  {
    displayName: 'Logo Icon Dark',
    url: logoIconDarkUrl,
    componentName: 'UiPathIconDark',
    bg: DARK_BG,
  },
  {
    displayName: 'App Icon & Favicon',
    url: faviconUrl,
    componentName: 'UiPathFavicon',
    bg: LIGHT_BG,
  },
  {
    displayName: 'Autopilot',
    url: autopilotLogoUrl,
    componentName: 'UiPathAutopilotLogo',
    bg: LIGHT_BG,
  },
];

const additionalProductLogos = [
  { displayName: 'Agent Desktop', url: agentDesktopLogoUrl, componentName: 'AgentDesktopLogo' },
  {
    displayName: 'Agent Desktop BG',
    url: agentDesktopLogoBgUrl,
    componentName: 'AgentDesktopLogoBg',
  },
  {
    displayName: 'Agent Desktop Flat',
    url: agentDesktopLogoFlatUrl,
    componentName: 'AgentDesktopLogoFlat',
  },
  { displayName: 'Studio Next', url: studioNextLogoUrl, componentName: 'StudioNextLogo' },
  { displayName: 'Studio Next BG', url: studioNextLogoBgUrl, componentName: 'StudioNextLogoBg' },
];

// ============================================================================
// Product logo data
// ============================================================================

const logoModules = import.meta.glob('../../../../apollo-core/src/icons/svg/product-logo/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

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
    .join(' ')
    .trim();
}

const productLogos = Object.entries(logoModules)
  .map(([path, url]) => {
    const filename = path.split('/').pop() ?? '';
    const name = filename.replace(/\.svg$/, '');
    return {
      name,
      displayName: toDisplayName(filename),
      url,
      componentName: toImportName(filename),
    };
  })
  .sort((a, b) => a.displayName.localeCompare(b.displayName));

// ============================================================================
// Shared layout helpers
// ============================================================================

function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mb-2 text-3xl font-bold tracking-tight text-foreground"
      style={{ fontFamily: fontFamily.base }}
    >
      {children}
    </h1>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-2 text-2xl font-bold tracking-tight text-foreground"
      style={{ fontFamily: fontFamily.base }}
    >
      {children}
    </h2>
  );
}

function SectionDescription({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-6 text-sm leading-relaxed text-muted-foreground"
      style={{ fontFamily: fontFamily.base }}
    >
      {children}
    </p>
  );
}

function Divider() {
  return <div className="my-10 h-px bg-border" />;
}

// ============================================================================
// Logo card helpers
// ============================================================================

function toImportName(filename: string): string {
  return filename
    .replace(/\.svg$/, '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

const IMPORT_SOURCE = '@uipath/apollo-core/icons';

function toImportStatement(componentName: string): string {
  return `import { ${componentName} } from '${IMPORT_SOURCE}';`;
}

// ============================================================================
// Logo card
// ============================================================================

function LogoCard({
  displayName,
  url,
  componentName,
  bg = '#ffffff',
}: {
  displayName: string;
  url: string;
  componentName: string;
  bg?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(toImportStatement(componentName)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${componentName}.svg`;
    a.click();
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface-raised">
      <div
        className="flex items-center justify-center p-8"
        style={{ minHeight: '140px', background: bg }}
      >
        <img src={url} alt={displayName} className="h-14 w-auto max-w-[180px] object-contain" />
      </div>
      <div className="flex flex-col gap-3 p-4">
        <span
          className="text-sm font-medium text-foreground"
          style={{ fontFamily: fontFamily.base }}
        >
          {displayName}
        </span>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="border-border bg-surface text-foreground hover:bg-surface-hover"
            onClick={handleCopy}
          >
            <Copy className="size-3" />
            {copied ? 'Copied!' : 'Copy import'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="border-border bg-surface text-foreground hover:bg-surface-hover size-9"
            onClick={handleDownload}
          >
            <Download />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

function LogosPage() {
  return (
    <div
      className="min-h-screen w-full bg-background text-foreground"
      style={{ fontFamily: fontFamily.base }}
    >
      <div className="mx-auto max-w-4xl space-y-2 p-8">
        {/* Header */}
        <PageTitle>Logos</PageTitle>
        <SectionDescription>
          This page contains our brand logos as well as product logos for easy access.
        </SectionDescription>

        <Divider />

        {/* Brand logos */}
        <SectionTitle>Brand logos</SectionTitle>
        <SectionDescription>
          Official UiPath brand logos for use across marketing and product surfaces.
        </SectionDescription>
        <div className="grid grid-cols-3 gap-4">
          {brandLogos.map((logo) => (
            <LogoCard
              key={logo.displayName}
              displayName={logo.displayName}
              url={logo.url}
              componentName={logo.componentName}
              bg={logo.bg}
            />
          ))}
        </div>

        <Divider />

        {/* Product logos */}
        <SectionTitle>Product logos</SectionTitle>
        <SectionDescription>
          Official product logos for the UiPath platform. Use the copy button to get the import path
          for use in your project.
        </SectionDescription>
        <div className="grid grid-cols-3 gap-4">
          {productLogos.map((logo) => (
            <LogoCard
              key={logo.name}
              displayName={logo.displayName}
              url={logo.url}
              componentName={logo.componentName}
            />
          ))}
          {additionalProductLogos.map((logo) => (
            <LogoCard
              key={logo.displayName}
              displayName={logo.displayName}
              url={logo.url}
              componentName={logo.componentName}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: () => <LogosPage />,
};
