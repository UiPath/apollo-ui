import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { Search } from '../../icons';
import { ApAccordion } from '../components';
import { materialParameters, Row, Section } from './storybook-helpers';

/**
 * `ApAccordion` from `@uipath/apollo-react/material/components`.
 *
 * Accordions allow users to expand and collapse sections of content, helping
 * to manage large amounts of information in a compact space.
 */
const meta: Meta = {
  title: 'Components/Accordion',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

function AccordionContent({ children }: { children: ReactNode }) {
  return (
    <Box tabIndex={0} sx={{ fontSize: 14, color: 'text.secondary', px: 5, py: 1.25 }}>
      {children}
    </Box>
  );
}

export const Default: Story = {
  render: () => (
    <Section
      title="Default"
      description="Stacked accordions with divider lines; the second one starts expanded."
    >
      <Row>
        <Box sx={{ width: 284 }}>
          <ApAccordion label="Accordion Title">
            <AccordionContent>Child</AccordionContent>
            <AccordionContent>Child</AccordionContent>
            <AccordionContent>Child</AccordionContent>
            <AccordionContent>Child</AccordionContent>
          </ApAccordion>
          <ApAccordion label="Accordion Title" defaultExpanded>
            <AccordionContent>Child</AccordionContent>
            <AccordionContent>Child</AccordionContent>
            <AccordionContent>Child</AccordionContent>
          </ApAccordion>
          <ApAccordion label="Accordion Title">
            <AccordionContent>Child</AccordionContent>
            <AccordionContent>Child</AccordionContent>
            <AccordionContent>Child</AccordionContent>
          </ApAccordion>
          <ApAccordion label="Accordion Title">
            <AccordionContent>Child</AccordionContent>
            <AccordionContent>Child</AccordionContent>
            <AccordionContent>Child</AccordionContent>
          </ApAccordion>
          <ApAccordion label="Accordion Title">
            <AccordionContent>Child</AccordionContent>
            <AccordionContent>Child</AccordionContent>
            <AccordionContent>Child</AccordionContent>
          </ApAccordion>
        </Box>
      </Row>
      <Row label="Single accordion">
        <Box sx={{ width: 284 }}>
          <ApAccordion label="Accordion Title">
            <AccordionContent>Test</AccordionContent>
            <AccordionContent>Child</AccordionContent>
            <AccordionContent>Child</AccordionContent>
            <AccordionContent>Child</AccordionContent>
          </ApAccordion>
        </Box>
      </Row>
    </Section>
  ),
};

export const IconCustomization: Story = {
  render: () => (
    <Section
      title="Icon Customization"
      description="Custom start icons and expand icon positioning, with and without the divider."
    >
      <Box sx={{ mb: 4 }}>
        <Row label="Custom start icon" />
        <ApAccordion label="Accordion Title" startIcon={<Search size="20px" />} disableDivider>
          <AccordionContent>
            This is the content inside the accordion. It can include text, images, or any other
            elements.
          </AccordionContent>
        </ApAccordion>
        <ApAccordion label="Accordion Title" startIcon={<Search size="20px" />}>
          <AccordionContent>
            This is the content inside the accordion. It can include text, images, or any other
            elements.
          </AccordionContent>
        </ApAccordion>
      </Box>
      <Box>
        <Row label="Expand icon position: start" />
        <ApAccordion
          label="Accordion Title"
          startIcon={<Search size="20px" />}
          expandIconPosition="start"
          disableDivider
        >
          <AccordionContent>
            This is the content inside the accordion. It can include text, images, or any other
            elements.
          </AccordionContent>
        </ApAccordion>
        <ApAccordion label="Accordion Title" expandIconPosition="start">
          <AccordionContent>
            This is the content inside the accordion. It can include text, images, or any other
            elements.
          </AccordionContent>
        </ApAccordion>
      </Box>
    </Section>
  ),
};

export const LabelCustomization: Story = {
  render: () => (
    <Section
      title="Customization"
      description="Custom label font size, font weight and color, with and without the divider."
    >
      <Box sx={{ mb: 4 }}>
        <Row label="Custom font size" />
        <ApAccordion label="Accordion Title" labelFontSize="20px" disableDivider>
          <AccordionContent>
            This is the content inside the accordion. It can include text, images, or any other
            elements.
          </AccordionContent>
        </ApAccordion>
        <ApAccordion label="Accordion Title" labelFontSize="20px">
          <AccordionContent>
            This is the content inside the accordion. It can include text, images, or any other
            elements.
          </AccordionContent>
        </ApAccordion>
      </Box>
      <Box sx={{ mb: 4 }}>
        <Row label="Custom font weight" />
        <ApAccordion label="Accordion Title" labelFontWeight="700" disableDivider>
          <AccordionContent>
            This is the content inside the accordion. It can include text, images, or any other
            elements.
          </AccordionContent>
        </ApAccordion>
        <ApAccordion label="Accordion Title" labelFontWeight="700">
          <AccordionContent>
            This is the content inside the accordion. It can include text, images, or any other
            elements.
          </AccordionContent>
        </ApAccordion>
      </Box>
      <Box>
        <Row label="Custom label color" />
        <ApAccordion label="Accordion Title" labelColor="var(--color-primary)" disableDivider>
          <AccordionContent>
            This is the content inside the accordion. It can include text, images, or any other
            elements.
          </AccordionContent>
        </ApAccordion>
        <ApAccordion label="Accordion Title" labelColor="var(--color-primary)">
          <AccordionContent>
            This is the content inside the accordion. It can include text, images, or any other
            elements.
          </AccordionContent>
        </ApAccordion>
      </Box>
    </Section>
  ),
};
