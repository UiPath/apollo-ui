import Chip from '@mui/material/Chip';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Home, Pin, Send, User } from '../../icons';
import { ApChip } from '../components';
import { ConsumptionTabs, materialParameters, Row, Section } from './storybook-helpers';

/**
 * Chips exist on two consumption paths:
 * - `Chip` from `@mui/material` — styled by the Apollo theme overrides, with
 *   custom colors, icons, and interactive states.
 * - `ApChip` from `@uipath/apollo-react/material/components` — the Apollo
 *   wrapper adding `loading`, `error` and `tooltip` conveniences.
 */
const meta: Meta = {
  title: 'Components/Chip',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const MUI_IMPORT = "import { Chip } from '@mui/material';";
const AP_IMPORT = "import { ApChip } from '@uipath/apollo-react/material/components';";

export const Basic: Story = {
  render: () => (
    <ConsumptionTabs
      muiImport={MUI_IMPORT}
      apImport={AP_IMPORT}
      mui={
        <Row label="Standard chips with Apollo theme styling">
          <Chip label="Default" />
          <Chip label="Clickable" onClick={() => {}} />
          <Chip label="Deletable" onDelete={() => {}} />
          <Chip label="Disabled" disabled />
        </Row>
      }
      ap={
        <Row label="Simple chip labels">
          <ApChip label="JavaScript" />
          <ApChip label="CSS" />
          <ApChip label="HTML" />
          <ApChip label="GraphQL" />
        </Row>
      }
    />
  ),
};

export const ColorsAndVariants: Story = {
  render: () => (
    <>
      <Section title="Color Variants" description="Chips with different color props.">
        <Row>
          <Chip label="Primary" color="primary" />
          <Chip label="Secondary" color="secondary" />
          <Chip label="Success" color="success" />
          <Chip label="Error" color="error" />
          <Chip label="Warning" color="warning" />
          <Chip label="Info" color="info" />
        </Row>
      </Section>
      <Section
        title="Outlined Variant"
        description="Chips with outlined style instead of filled background."
      >
        <Row>
          <Chip label="Default" variant="outlined" />
          <Chip label="Primary" variant="outlined" color="primary" />
          <Chip label="Secondary" variant="outlined" color="secondary" />
          <Chip label="Deletable" variant="outlined" onDelete={() => {}} />
        </Row>
      </Section>
      <Section title="Size Variants" description="Chips in different sizes (small, medium).">
        <Row>
          <Chip label="Small" size="small" />
          <Chip label="Medium" size="medium" />
          <Chip label="Small Outlined" size="small" variant="outlined" />
          <Chip label="Medium Outlined" size="medium" variant="outlined" />
        </Row>
      </Section>
    </>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Section title="With Icons" description="Chips with custom icons.">
      <Row>
        <Chip icon={<Home />} label="Home" />
        <Chip icon={<Pin />} label="Favorite" />
        <Chip icon={<Send />} label="Email" onDelete={() => {}} />
        <Chip icon={<User />} label="User" onClick={() => {}} />
      </Row>
    </Section>
  ),
};

function InteractiveApChips() {
  const [chips, setChips] = useState([
    { id: 1, label: 'React', active: true },
    { id: 2, label: 'TypeScript', active: true },
    { id: 3, label: 'Node.js', active: true },
    { id: 4, label: 'Python', active: true },
  ]);

  const handleDelete = (id: number) => {
    setChips((current) => current.filter((chip) => chip.id !== id));
  };

  const handleClick = (id: number) => {
    setChips((current) =>
      current.map((chip) => (chip.id === id ? { ...chip, active: !chip.active } : chip))
    );
  };

  return (
    <Row label="Clickable and deletable chips (click toggles color, delete removes)">
      {chips.map((chip) => (
        <ApChip
          key={chip.id}
          label={chip.label}
          onClick={() => handleClick(chip.id)}
          onDelete={() => handleDelete(chip.id)}
          color={chip.active ? 'primary' : 'default'}
        />
      ))}
    </Row>
  );
}

export const Interactive: Story = {
  render: () => (
    <ConsumptionTabs
      muiImport={MUI_IMPORT}
      apImport={AP_IMPORT}
      mui={
        <Row label="Chips that are both clickable and deletable">
          <Chip label="React" onClick={() => {}} onDelete={() => {}} />
          <Chip label="TypeScript" color="primary" onClick={() => {}} onDelete={() => {}} />
          <Chip
            label="Apollo"
            color="secondary"
            variant="outlined"
            onClick={() => {}}
            onDelete={() => {}}
          />
        </Row>
      }
      ap={<InteractiveApChips />}
    />
  ),
};

export const Loading: Story = {
  render: () => (
    <Section title="Loading Chips" description="ApChip loading state — Ap component only.">
      <Row label="Simple loading chips">
        <ApChip label="JavaScript" loading onDelete={() => {}} />
        <ApChip label="CSS" loading onDelete={() => {}} />
        <ApChip label="HTML" loading onDelete={() => {}} />
        <ApChip label="GraphQL" loading onDelete={() => {}} />
      </Row>
    </Section>
  ),
};
