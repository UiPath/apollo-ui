import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Delete, Edit, Home, Link, Notifications, Search, Settings, User } from '../../icons';
import { ApIcon, ApIconButton } from '../components';
import { ConsumptionTabs, materialParameters, Row, Section } from './storybook-helpers';

/**
 * Icon buttons exist on two consumption paths:
 * - `IconButton` from `@mui/material` — styled by the Apollo theme overrides.
 * - `ApIconButton` from `@uipath/apollo-react/material/components` — the Apollo
 *   wrapper with an accessible `label` prop, typically paired with `ApIcon`.
 */
const meta: Meta = {
  title: 'Components/Icon Button',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const MUI_IMPORT = "import { IconButton } from '@mui/material';";
const AP_IMPORT =
  "import { ApIcon, ApIconButton } from '@uipath/apollo-react/material/components';";

export const Colors: Story = {
  render: () => (
    <ConsumptionTabs
      muiImport={MUI_IMPORT}
      apImport={AP_IMPORT}
      mui={
        <Row label="default / primary / secondary">
          <IconButton color="default" aria-label="default">
            <Link />
          </IconButton>
          <IconButton color="primary" aria-label="primary">
            <Notifications />
          </IconButton>
          <IconButton color="secondary" aria-label="secondary">
            <Settings />
          </IconButton>
        </Row>
      }
      ap={
        <>
          <Row label="Primary">
            <ApIconButton color="primary" label="Primary icon button">
              <ApIcon name="favorite" />
            </ApIconButton>
          </Row>
          <Row label="Secondary">
            <ApIconButton color="secondary" label="Secondary icon button">
              <ApIcon name="star" />
            </ApIconButton>
          </Row>
          <Row label="Success">
            <ApIconButton color="success" label="Success icon button">
              <ApIcon name="check_circle" />
            </ApIconButton>
          </Row>
          <Row label="Error">
            <ApIconButton color="error" label="Error icon button">
              <ApIcon name="error" />
            </ApIconButton>
          </Row>
          <Row label="Warning">
            <ApIconButton color="warning" label="Warning icon button">
              <ApIcon name="warning" />
            </ApIconButton>
          </Row>
          <Row label="Info">
            <ApIconButton color="info" label="Info icon button">
              <ApIcon name="info" />
            </ApIconButton>
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
          <IconButton size="small" aria-label="small">
            <Notifications size={16} />
          </IconButton>
          <IconButton size="medium" aria-label="medium">
            <Notifications size={20} />
          </IconButton>
          <IconButton size="large" aria-label="large">
            <Notifications size={24} />
          </IconButton>
        </Row>
      }
      ap={
        <Row label="small / medium (default) / large">
          <ApIconButton size="small" label="Small icon button">
            <ApIcon name="settings" size="16px" />
          </ApIconButton>
          <ApIconButton size="medium" label="Medium icon button">
            <ApIcon name="settings" size="20px" />
          </ApIconButton>
          <ApIconButton size="large" label="Large icon button">
            <ApIcon name="settings" size="24px" />
          </ApIconButton>
        </Row>
      }
    />
  ),
};

function CounterDemo() {
  const [count, setCount] = useState(0);
  return (
    <Row label="Interactive counter">
      <ApIconButton label="Increment counter" onClick={() => setCount(count + 1)}>
        <ApIcon name="add" />
      </ApIconButton>
      <Typography sx={{ fontWeight: 'bold' }}>{count}</Typography>
      <ApIconButton label="Decrement counter" onClick={() => setCount(count - 1)}>
        <ApIcon name="remove" />
      </ApIconButton>
    </Row>
  );
}

export const States: Story = {
  render: () => (
    <ConsumptionTabs
      muiImport={MUI_IMPORT}
      apImport={AP_IMPORT}
      mui={
        <Row label="Icon-only buttons for compact actions, including disabled">
          <IconButton aria-label="home">
            <Home />
          </IconButton>
          <IconButton aria-label="search">
            <Search />
          </IconButton>
          <IconButton aria-label="settings">
            <Settings />
          </IconButton>
          <IconButton aria-label="notifications">
            <Notifications />
          </IconButton>
          <IconButton aria-label="profile">
            <User />
          </IconButton>
          <IconButton aria-label="delete">
            <Delete />
          </IconButton>
          <IconButton aria-label="edit">
            <Edit />
          </IconButton>
          <IconButton disabled aria-label="disabled">
            <Home />
          </IconButton>
        </Row>
      }
      ap={
        <>
          <Row label="Default">
            <ApIconButton label="Default icon button">
              <ApIcon name="add" />
            </ApIconButton>
          </Row>
          <Row label="Disabled">
            <ApIconButton disabled label="Disabled icon button">
              <ApIcon name="add" />
            </ApIconButton>
          </Row>
          <CounterDemo />
        </>
      }
    />
  ),
};

export const CommonUseCases: Story = {
  render: () => (
    <Section
      title="Common Use Cases"
      description="Typical icon button patterns built with ApIconButton + ApIcon."
    >
      <Row label="Navigation">
        <ApIconButton label="Go back">
          <ApIcon name="arrow_back" />
        </ApIconButton>
        <ApIconButton label="Go forward">
          <ApIcon name="arrow_forward" />
        </ApIconButton>
      </Row>
      <Row label="Actions">
        <ApIconButton label="Edit">
          <ApIcon name="edit" />
        </ApIconButton>
        <ApIconButton label="Delete">
          <ApIcon name="delete" />
        </ApIconButton>
        <ApIconButton label="Save">
          <ApIcon name="save" />
        </ApIconButton>
      </Row>
      <Row label="Menu">
        <ApIconButton label="Open menu">
          <ApIcon name="menu" />
        </ApIconButton>
        <ApIconButton label="More options">
          <ApIcon name="more_vert" />
        </ApIconButton>
      </Row>
      <Row label="Visibility toggle">
        <ApIconButton label="Toggle visibility">
          <ApIcon name="visibility" />
        </ApIconButton>
        <ApIconButton label="Toggle visibility off">
          <ApIcon name="visibility_off" />
        </ApIconButton>
      </Row>
    </Section>
  ),
};
