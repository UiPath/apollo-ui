import { Link, Stack, Typography } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ApLink } from '../components';
import { ConsumptionTabs, materialParameters, Section } from './storybook-helpers';

/**
 * Links exist on two consumption paths:
 * - `Link` from `@mui/material` — styled by the Apollo theme overrides with
 *   custom colors, underline behaviors, and hover states.
 * - `ApLink` from `@uipath/apollo-react/material/components` — the styled
 *   hyperlink component built with Apollo design tokens.
 */
const meta: Meta = {
  title: 'Components/Link',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const MUI_IMPORT = "import { Link } from '@mui/material';";
const AP_IMPORT = "import { ApLink } from '@uipath/apollo-react/material/components';";

function ButtonLinkDemo() {
  const [clicks, setClicks] = useState(0);
  return (
    <Stack spacing={1.5} alignItems="flex-start">
      <Link component="button" variant="body2" onClick={() => setClicks(clicks + 1)}>
        Clickable button link
      </Link>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {clicks === 0 ? 'Not clicked yet' : `Clicked ${clicks} time${clicks === 1 ? '' : 's'}`}
      </Typography>
    </Stack>
  );
}

export const BasicLinks: Story = {
  render: () => (
    <ConsumptionTabs
      muiImport={MUI_IMPORT}
      apImport={AP_IMPORT}
      mui={
        <Stack spacing={1.5} alignItems="flex-start">
          <Link href="#">Default link</Link>
          <Link href="#">Another link</Link>
          <Link href="#">Third link</Link>
        </Stack>
      }
      ap={
        <Stack spacing={1.5} alignItems="flex-start">
          <ApLink href="https://www.uipath.com" target="_blank">
            Visit UiPath
          </ApLink>
          <ApLink href="#">Default ApLink</ApLink>
        </Stack>
      }
    />
  ),
};

export const UnderlineOptions: Story = {
  render: () => (
    <Section
      title="Underline Options"
      description="Links with different underline behaviors — MUI only."
    >
      <Stack spacing={1.5} alignItems="flex-start">
        <Link href="#" underline="none">
          No underline
        </Link>
        <Link href="#" underline="hover">
          Underline on hover
        </Link>
        <Link href="#" underline="always">
          Always underlined
        </Link>
      </Stack>
    </Section>
  ),
};

export const TypographyVariants: Story = {
  render: () => (
    <Section
      title="Typography Variants"
      description="Links with different typography sizes — MUI only."
    >
      <Stack spacing={1.5} alignItems="flex-start">
        <Link href="#" variant="h6">
          Heading 6 link
        </Link>
        <Link href="#" variant="body1">
          Body 1 link (default)
        </Link>
        <Link href="#" variant="body2">
          Body 2 link
        </Link>
        <Link href="#" variant="caption">
          Caption link
        </Link>
      </Stack>
    </Section>
  ),
};

export const ButtonLink: Story = {
  render: () => (
    <Section
      title="Button Link"
      description="Links styled as buttons using the component prop — MUI only."
    >
      <ButtonLinkDemo />
    </Section>
  ),
};
