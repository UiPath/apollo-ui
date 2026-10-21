import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ContentPattern, PATTERNS, PatternPage } from './patterns';

const meta = {
  title: 'Writing/Content Patterns',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Story names must match each pattern's `name` so PatternLink can open them.
const page = (pattern: ContentPattern): Story => ({
  render: () => <PatternPage pattern={pattern} />,
});

export const ErrorMessage: Story = { ...page(PATTERNS.errorMessage), name: 'Error Message' };
export const Notification: Story = page(PATTERNS.notification);
export const EmptyState: Story = { ...page(PATTERNS.emptyState), name: 'Empty State' };
export const ButtonAndCta: Story = { ...page(PATTERNS.buttonAndCta), name: 'Button and CTA' };
export const Link: Story = page(PATTERNS.link);
export const ToggleAndSelection: Story = {
  ...page(PATTERNS.toggleAndSelection),
  name: 'Toggle and Selection',
};
export const DestructiveModal: Story = {
  ...page(PATTERNS.destructiveModal),
  name: 'Destructive Modal',
};
export const FormField: Story = { ...page(PATTERNS.formField), name: 'Form Field' };
export const SearchAndFilter: Story = {
  ...page(PATTERNS.searchAndFilter),
  name: 'Search and Filter',
};
export const TabsAndNavigation: Story = {
  ...page(PATTERNS.tabsAndNavigation),
  name: 'Tabs and Navigation',
};
export const Drawer: Story = page(PATTERNS.drawer);
export const AccordionAndDisclosure: Story = {
  ...page(PATTERNS.accordionAndDisclosure),
  name: 'Accordion and Disclosure',
};
export const TableAndStatus: Story = { ...page(PATTERNS.tableAndStatus), name: 'Table and Status' };
export const DateTimeAndDuration: Story = {
  ...page(PATTERNS.dateTimeAndDuration),
  name: 'Date, Time, and Duration',
};
export const Tooltip: Story = page(PATTERNS.tooltip);
