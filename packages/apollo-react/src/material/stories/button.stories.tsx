import Button from '@mui/material/Button';
import Fab from '@mui/material/Fab';
import type { Meta, StoryObj } from '@storybook/react';
import { ArrowDropDown, Search } from '../../icons';
import { ApButton } from '../components';
import { ConsumptionTabs, materialParameters, Row, Section } from './storybook-helpers';

/**
 * Buttons exist on two consumption paths:
 * - `Button` from `@mui/material` — styled by the Apollo theme overrides.
 * - `ApButton` from `@uipath/apollo-react/material/components` — the Apollo
 *   wrapper with `variant`, `size`, `loading` and `widthMode` conveniences.
 */
const meta: Meta = {
  title: 'Components/Button',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const MUI_IMPORT = "import { Button } from '@mui/material';";
const AP_IMPORT = "import { ApButton } from '@uipath/apollo-react/material/components';";

const AP_VARIANTS = [
  'primary',
  'secondary',
  'destructive',
  'tertiary',
  'text',
  'text-foreground',
] as const;

export const Variants: Story = {
  render: () => (
    <ConsumptionTabs
      muiImport={MUI_IMPORT}
      apImport={AP_IMPORT}
      mui={
        <>
          <Row label="Variants">
            <Button variant="contained">Contained</Button>
            <Button variant="outlined">Outlined</Button>
            <Button variant="text">Text</Button>
          </Row>
          <Row label="Disabled">
            <Button variant="contained" disabled>
              Contained
            </Button>
            <Button variant="outlined" disabled>
              Outlined
            </Button>
            <Button variant="text" disabled>
              Text
            </Button>
          </Row>
          <Row label="Warning (Apollo-specific className)">
            <Button variant="contained" className="warning">
              Warning Action
            </Button>
            <Button variant="contained" className="warning" disabled>
              Disabled Warning
            </Button>
          </Row>
        </>
      }
      ap={
        <>
          <Row label="Variants">
            {AP_VARIANTS.map((variant) => (
              <ApButton
                key={variant}
                label={variant.charAt(0).toUpperCase() + variant.slice(1)}
                variant={variant}
              />
            ))}
          </Row>
          <Row label="States">
            <ApButton label="Disabled" disabled />
            <ApButton label="Loading" loading />
          </Row>
        </>
      }
    />
  ),
};

export const Sizes: Story = {
  render: () => (
    <ConsumptionTabs
      muiImport={MUI_IMPORT}
      apImport={AP_IMPORT}
      mui={
        <Row label="small / medium / large">
          <Button variant="contained" size="small">
            Small
          </Button>
          <Button variant="contained" size="medium">
            Medium
          </Button>
          <Button variant="contained" size="large">
            Large
          </Button>
        </Row>
      }
      ap={
        <>
          <Row label="Sizes (height)">
            <ApButton label="Tall Button" size="tall" />
            <ApButton label="Small Button" size="small" />
          </Row>
          <Row label="Width modes">
            <ApButton label="Default" />
            <ApButton label="Hug" widthMode="fit-content" />
          </Row>
        </>
      }
    />
  ),
};

export const WithIcons: Story = {
  render: () => (
    <ConsumptionTabs
      muiImport={MUI_IMPORT}
      apImport={AP_IMPORT}
      mui={
        <Row>
          <Button variant="contained" startIcon={<Search />}>
            Download
          </Button>
          <Button variant="outlined" endIcon={<ArrowDropDown />}>
            Next
          </Button>
          <Button variant="text" startIcon={<Search />}>
            Edit
          </Button>
        </Row>
      }
      ap={
        <>
          <Row label="With icons">
            <ApButton label="Start Icon" startIcon={<Search />} />
            <ApButton label="End Icon" endIcon={<ArrowDropDown />} />
            <ApButton label="Both Icons" startIcon={<Search />} endIcon={<ArrowDropDown />} />
          </Row>
          <Row label="With icons, loading">
            <ApButton label="Start Icon" startIcon={<Search />} loading />
            <ApButton label="End Icon" endIcon={<ArrowDropDown />} loading />
            <ApButton
              label="Both Icons"
              startIcon={<Search />}
              endIcon={<ArrowDropDown />}
              loading
            />
          </Row>
        </>
      }
    />
  ),
};

export const FloatingActionButton: Story = {
  render: () => (
    <Section
      title="Floating Action Buttons (FAB)"
      description="Circular floating action buttons for primary actions — MUI only."
    >
      <Row>
        <Fab color="primary" aria-label="add">
          <Search />
        </Fab>
        <Fab color="secondary" aria-label="edit">
          <ArrowDropDown />
        </Fab>
        <Fab disabled aria-label="delete">
          <Search />
        </Fab>
      </Row>
      <Row label="Sizes">
        <Fab size="small" color="primary" aria-label="small">
          <Search />
        </Fab>
        <Fab size="medium" color="primary" aria-label="medium">
          <Search />
        </Fab>
        <Fab size="large" color="primary" aria-label="large">
          <Search />
        </Fab>
      </Row>
    </Section>
  ),
};

export const AllDecorations: Story = {
  render: () => (
    <Section
      title="All ApButton variants and decorations"
      description="Every variant crossed with sizes, width modes, states, icons and custom content."
    >
      <Row>
        {AP_VARIANTS.map((variant) => (
          <div key={variant} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ApButton
              label={variant.charAt(0).toUpperCase() + variant.slice(1)}
              variant={variant}
            />
            <ApButton label="Small Button" size="small" variant={variant} />
            <ApButton label="Fit" widthMode="fit-content" variant={variant} />
            <ApButton label="Loading" loading variant={variant} />
            <ApButton label="Disabled" disabled variant={variant} />
            <ApButton variant={variant} label="Start Icon" startIcon={<Search />} />
            <ApButton variant={variant} label="End Icon" endIcon={<ArrowDropDown />} />
            <ApButton
              variant={variant}
              label="Both Icons"
              startIcon={<Search />}
              endIcon={<ArrowDropDown />}
            />
            <ApButton variant={variant} label="Start Icon" startIcon={<Search />} loading />
            <ApButton
              variant={variant}
              label="Custom Content"
              customContent={
                <span>
                  <b>Custom</b> <i style={{ fontWeight: 200 }}>Content</i>
                </span>
              }
            />
          </div>
        ))}
      </Row>
    </Section>
  ),
};
