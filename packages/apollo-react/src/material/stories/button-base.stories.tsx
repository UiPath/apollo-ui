import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import { useTheme } from '@mui/material/styles';
import type { Meta, StoryObj } from '@storybook/react';
import { Delete, Edit, Folder, Help, Home, Image, Pin, Settings } from '../../icons';
import { materialParameters, Row, Section } from './storybook-helpers';

/**
 * Material UI ButtonBase component with Apollo theme overrides. A low-level
 * button primitive that provides hover, focus, and ripple effects. Used as
 * the foundation for other button components.
 */
const meta: Meta = {
  title: 'Components/Button Base',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <Section
      title="Basic ButtonBase"
      description="Simple clickable elements with default ripple effect."
    >
      <Row>
        <ButtonBase sx={{ padding: '8px 16px', borderRadius: '4px' }}>Click Me</ButtonBase>
        <ButtonBase sx={{ padding: '8px 16px', borderRadius: '4px' }}>Another Button</ButtonBase>
        <ButtonBase sx={{ padding: '8px 16px', borderRadius: '4px' }}>Third Button</ButtonBase>
      </Row>
    </Section>
  ),
};

export const WithStyling: Story = {
  render: () => (
    <Section title="With Styling" description="ButtonBase with custom styling applied.">
      <Row>
        <ButtonBase
          sx={(theme) => ({
            padding: '10px 20px',
            borderRadius: '8px',
            background: theme.palette.semantic.colorPrimary,
            color: theme.palette.semantic.colorForegroundInverse,
            fontWeight: 'bold',
          })}
        >
          Primary Style
        </ButtonBase>
        <ButtonBase
          sx={(theme) => ({
            padding: '10px 20px',
            borderRadius: '8px',
            border: `2px solid ${theme.palette.semantic.colorPrimary}`,
            color: theme.palette.semantic.colorPrimary,
          })}
        >
          Outlined Style
        </ButtonBase>
        <ButtonBase
          sx={(theme) => ({
            padding: '10px 20px',
            borderRadius: '8px',
            background: theme.palette.semantic.colorHover,
          })}
        >
          Subtle Style
        </ButtonBase>
      </Row>
    </Section>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <>
      <Section title="With Icons" description="ButtonBase containing icon elements.">
        <Row>
          <ButtonBase
            sx={{
              padding: '12px 20px',
              borderRadius: '8px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <Pin />
            <span>Favorite</span>
          </ButtonBase>
          <ButtonBase
            sx={{
              padding: '12px 20px',
              borderRadius: '8px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <Delete />
            <span>Delete</span>
          </ButtonBase>
          <ButtonBase
            sx={{
              padding: '12px 20px',
              borderRadius: '8px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <Edit />
            <span>Edit</span>
          </ButtonBase>
        </Row>
      </Section>
      <Section title="Icon-Only Buttons" description="ButtonBase used as icon buttons.">
        <Row>
          <ButtonBase sx={{ padding: '12px', borderRadius: '50%', fontSize: '20px' }}>
            <Home />
          </ButtonBase>
          <ButtonBase sx={{ padding: '12px', borderRadius: '50%', fontSize: '20px' }}>
            <Settings />
          </ButtonBase>
          <ButtonBase sx={{ padding: '12px', borderRadius: '50%', fontSize: '20px' }}>
            <Help />
          </ButtonBase>
        </Row>
      </Section>
    </>
  ),
};

function CustomRippleButton() {
  const theme = useTheme();
  return (
    <ButtonBase
      sx={{ padding: '10px 20px', borderRadius: '8px' }}
      TouchRippleProps={{ style: { color: theme.palette.semantic.colorPrimary } }}
    >
      Custom Ripple
    </ButtonBase>
  );
}

export const StatesAndRipple: Story = {
  render: () => (
    <>
      <Section
        title="Disabled State"
        description="ButtonBase in disabled state without interactions."
      >
        <Row>
          <ButtonBase
            disabled
            sx={(theme) => ({
              padding: '10px 20px',
              borderRadius: '8px',
              background: theme.palette.semantic.colorHover,
            })}
          >
            Disabled Button
          </ButtonBase>
          <ButtonBase
            disabled
            sx={(theme) => ({
              padding: '10px 20px',
              borderRadius: '8px',
              border: `2px solid ${theme.palette.semantic.colorBorder}`,
            })}
          >
            Disabled Outlined
          </ButtonBase>
        </Row>
      </Section>
      <Section title="Custom Ripple" description="ButtonBase with customized ripple effects.">
        <Row>
          <CustomRippleButton />
          <ButtonBase disableRipple sx={{ padding: '10px 20px', borderRadius: '8px' }}>
            No Ripple
          </ButtonBase>
        </Row>
      </Section>
    </>
  ),
};

export const AsCardTile: Story = {
  render: () => (
    <Section title="As Card/Tile" description="ButtonBase used to create clickable cards.">
      <Row>
        <ButtonBase
          sx={(theme) => ({
            padding: '20px',
            borderRadius: '12px',
            border: `2px solid ${theme.palette.semantic.colorBorder}`,
            flexDirection: 'column',
            gap: '8px',
            minWidth: '150px',
            textAlign: 'center',
          })}
        >
          <Folder size={32} />
          <Box sx={{ fontWeight: 'bold' }}>Documents</Box>
          <Box sx={{ fontSize: '12px', opacity: 0.7 }}>23 files</Box>
        </ButtonBase>
        <ButtonBase
          sx={(theme) => ({
            padding: '20px',
            borderRadius: '12px',
            border: `2px solid ${theme.palette.semantic.colorBorder}`,
            flexDirection: 'column',
            gap: '8px',
            minWidth: '150px',
            textAlign: 'center',
          })}
        >
          <Image size={32} />
          <Box sx={{ fontWeight: 'bold' }}>Images</Box>
          <Box sx={{ fontSize: '12px', opacity: 0.7 }}>156 files</Box>
        </ButtonBase>
      </Row>
    </Section>
  ),
};
