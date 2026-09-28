import type { Meta, StoryObj } from '@storybook/react';
import { ApBadge, BadgeSize, StatusTypes } from '../components';
import { materialParameters, Row, Section } from './storybook-helpers';

/**
 * `ApBadge` from `@uipath/apollo-react/material/components`.
 *
 * Small status indicators and labels for displaying metadata and status
 * information.
 */
const meta: Meta = {
  title: 'Components/Badge',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const StatusVariants: Story = {
  render: () => (
    <Section title="Status Types" description="Different status variants.">
      <Row>
        <ApBadge label="Success" status={StatusTypes.SUCCESS} />
        <ApBadge label="Error" status={StatusTypes.ERROR} />
        <ApBadge label="Warning" status={StatusTypes.WARNING} />
        <ApBadge label="Info" status={StatusTypes.INFO} />
        <ApBadge label="Neutral" status={StatusTypes.NONE} />
      </Row>
    </Section>
  ),
};

export const Labels: Story = {
  render: () => (
    <Section title="Labels" description="Various label examples.">
      <Row>
        <ApBadge label="New" status={StatusTypes.INFO} />
        <ApBadge label="Beta" status={StatusTypes.WARNING} />
        <ApBadge label="Premium" status={StatusTypes.SUCCESS} />
        <ApBadge label="Deprecated" status={StatusTypes.ERROR} />
        <ApBadge label="Draft" status={StatusTypes.NONE} />
      </Row>
    </Section>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Section title="Sizes" description="Small (default) and large badges.">
      <Row label="Small">
        <ApBadge label="Success" status={StatusTypes.SUCCESS} size={BadgeSize.SMALL} />
        <ApBadge label="Error" status={StatusTypes.ERROR} size={BadgeSize.SMALL} />
        <ApBadge label="Info" status={StatusTypes.INFO} size={BadgeSize.SMALL} />
      </Row>
      <Row label="Large">
        <ApBadge label="Success" status={StatusTypes.SUCCESS} size={BadgeSize.LARGE} />
        <ApBadge label="Error" status={StatusTypes.ERROR} size={BadgeSize.LARGE} />
        <ApBadge label="Info" status={StatusTypes.INFO} size={BadgeSize.LARGE} />
      </Row>
    </Section>
  ),
};
