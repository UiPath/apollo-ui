import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { ApButton, ApIcon, ApTooltip } from '../components';
import { ConsumptionTabs, materialParameters, Row, Section } from './storybook-helpers';

/**
 * Tooltips exist on two consumption paths:
 * - `Tooltip` from `@mui/material` — styled by the Apollo theme overrides.
 * - `ApTooltip` from `@uipath/apollo-react/material/components` — the Apollo
 *   wrapper with `content`, `delay`, `smartTooltip` (truncation-aware),
 *   `disabled` and `formattedContent` conveniences.
 */
const meta: Meta = {
  title: 'Components/Tooltip',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const MUI_IMPORT = "import { Tooltip } from '@mui/material';";
const AP_IMPORT = "import { ApTooltip } from '@uipath/apollo-react/material/components';";

export const Basic: Story = {
  render: () => (
    <ConsumptionTabs
      muiImport={MUI_IMPORT}
      apImport={AP_IMPORT}
      mui={
        <Row label="Standard tooltip with Apollo theme styling">
          <Tooltip title="Tooltip text">
            <Button>Hover me</Button>
          </Tooltip>
        </Row>
      }
      ap={
        <Row label="Standard tooltip">
          <ApTooltip content="This is a simple tooltip">
            <span>
              <ApButton label="Hover me" />
            </span>
          </ApTooltip>
        </Row>
      }
    />
  ),
};

export const Placements: Story = {
  render: () => (
    <ConsumptionTabs
      muiImport={MUI_IMPORT}
      apImport={AP_IMPORT}
      mui={
        <>
          <Row label="Placement options">
            <Tooltip title="Top" placement="top">
              <Button>Top</Button>
            </Tooltip>
            <Tooltip title="Right" placement="right">
              <Button>Right</Button>
            </Tooltip>
            <Tooltip title="Bottom" placement="bottom">
              <Button>Bottom</Button>
            </Tooltip>
            <Tooltip title="Left" placement="left">
              <Button>Left</Button>
            </Tooltip>
          </Row>
          <Row label="Arrow variant">
            <Tooltip title="With arrow" arrow placement="top">
              <Button>Top with arrow</Button>
            </Tooltip>
            <Tooltip title="With arrow" arrow placement="right">
              <Button>Right with arrow</Button>
            </Tooltip>
            <Tooltip title="With arrow" arrow placement="bottom">
              <Button>Bottom with arrow</Button>
            </Tooltip>
            <Tooltip title="With arrow" arrow placement="left">
              <Button>Left with arrow</Button>
            </Tooltip>
          </Row>
        </>
      }
      ap={
        <Row label="Placement options">
          <ApTooltip content="Tooltip on top" placement="top">
            <span>
              <ApButton label="Top" />
            </span>
          </ApTooltip>
          <ApTooltip content="Tooltip on right" placement="right">
            <span>
              <ApButton label="Right" />
            </span>
          </ApTooltip>
          <ApTooltip content="Tooltip on bottom" placement="bottom">
            <span>
              <ApButton label="Bottom" />
            </span>
          </ApTooltip>
          <ApTooltip content="Tooltip on left" placement="left">
            <span>
              <ApButton label="Left" />
            </span>
          </ApTooltip>
        </Row>
      }
    />
  ),
};

export const Content: Story = {
  render: () => (
    <ConsumptionTabs
      muiImport={MUI_IMPORT}
      apImport={AP_IMPORT}
      mui={
        <Row label="Long text">
          <Tooltip
            title="This is a longer tooltip text that demonstrates how Apollo theme styles handle multi-line content."
            arrow
          >
            <Button>Long Content</Button>
          </Tooltip>
        </Row>
      }
      ap={
        <>
          <Row label="Multi-line tooltip">
            <ApTooltip content="This is a longer tooltip that demonstrates multi-line content. It can contain multiple sentences and will wrap automatically.">
              <span>
                <ApButton label="Multi-line tooltip" />
              </span>
            </ApTooltip>
          </Row>
          <Row label="Formatted content">
            <ApTooltip
              content=""
              formattedContent={
                <div>
                  <strong>Bold Title</strong>
                  <br />
                  <em>This is formatted content</em>
                  <br />
                  With multiple lines
                </div>
              }
            >
              <span>
                <ApButton label="Formatted tooltip" />
              </span>
            </ApTooltip>
          </Row>
        </>
      }
    />
  ),
};

function TruncatedText({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        width: 150,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        px: 1,
        py: 0.5,
      }}
    >
      {children}
    </Box>
  );
}

export const Behavior: Story = {
  render: () => (
    <ConsumptionTabs
      muiImport={MUI_IMPORT}
      apImport={AP_IMPORT}
      mui={
        <Row label="Tooltip on a disabled element (wrapped in span)">
          <Tooltip title="Tooltip on disabled button">
            <span>
              <Button disabled>Disabled Button</Button>
            </span>
          </Tooltip>
        </Row>
      }
      ap={
        <>
          <Row label="With delay (appears after 700ms)">
            <ApTooltip content="Appears after 700ms delay" delay>
              <span>
                <ApButton label="Hover me (delayed)" />
              </span>
            </ApTooltip>
          </Row>
          <Row label="Smart tooltip — shows only when text is truncated">
            <ApTooltip
              content="This text is not truncated and should not show tooltip"
              smartTooltip
            >
              <TruncatedText>Short text</TruncatedText>
            </ApTooltip>
            <ApTooltip
              content="This is a very long text that will be truncated and show a tooltip"
              smartTooltip
            >
              <TruncatedText>This is a very long text that will be truncated</TruncatedText>
            </ApTooltip>
          </Row>
          <Row label="Disabled tooltip">
            <ApTooltip content="This tooltip is disabled" disabled>
              <span>
                <ApButton label="Hover me (no tooltip)" />
              </span>
            </ApTooltip>
          </Row>
        </>
      }
    />
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Section
      title="Tooltips on Icons"
      description="ApTooltip wrapping ApIcon targets — a common pattern for icon-only affordances."
    >
      <Row>
        <ApTooltip content="Settings">
          <span>
            <ApIcon name="settings" size="32px" />
          </span>
        </ApTooltip>
        <ApTooltip content="Edit">
          <span>
            <ApIcon name="edit" size="32px" />
          </span>
        </ApTooltip>
        <ApTooltip content="Delete">
          <span>
            <ApIcon name="delete" size="32px" color="red" />
          </span>
        </ApTooltip>
        <ApTooltip content="Information">
          <span>
            <ApIcon name="info" size="32px" />
          </span>
        </ApTooltip>
      </Row>
    </Section>
  ),
};
