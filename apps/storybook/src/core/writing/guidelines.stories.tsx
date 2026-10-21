import type { Meta, StoryObj } from '@storybook/react-vite';
import { AccessibilityPage } from './guidelines/accessibility';
import { ComponentsPage } from './guidelines/components';
import { DateAndTimePage } from './guidelines/date-and-time';
import { LocalizationPage } from './guidelines/localization';
import { PrinciplesPage } from './guidelines/principles';
import { ReviewChecklistPage } from './guidelines/review-checklist';
import { StyleAndGrammarPage } from './guidelines/style-and-grammar';
import { TerminologyPage } from './guidelines/terminology';

const meta = {
  title: 'Writing/Guidelines',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Story names are what GuidelineLink opens; keep them in sync.
export const Principles: Story = { render: () => <PrinciplesPage /> };
export const StyleAndGrammar: Story = {
  name: 'Style and Grammar',
  render: () => <StyleAndGrammarPage />,
};
export const Components: Story = { render: () => <ComponentsPage /> };
export const DateAndTime: Story = { name: 'Date and Time', render: () => <DateAndTimePage /> };
export const Accessibility: Story = { render: () => <AccessibilityPage /> };
export const Localization: Story = { render: () => <LocalizationPage /> };
export const Terminology: Story = { render: () => <TerminologyPage /> };
export const ReviewChecklist: Story = {
  name: 'Review Checklist',
  render: () => <ReviewChecklistPage />,
};
