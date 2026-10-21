import type { Meta, StoryObj } from '@storybook/react-vite';
import { PATTERN_PREVIEWS } from './pattern-previews';
import { PATTERNS, PatternPage } from './patterns';

const meta = {
  title: 'Writing/Content Patterns',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Story names must match each pattern's `name` so PatternLink can open them.
const page = (key: keyof typeof PATTERNS): Story => ({
  render: () => <PatternPage pattern={PATTERNS[key]} preview={PATTERN_PREVIEWS[key]} />,
});

export const ErrorMessage: Story = { ...page('errorMessage'), name: 'Error Message' };
export const Notification: Story = page('notification');
export const SuccessConfirmation: Story = {
  ...page('successConfirmation'),
  name: 'Success Confirmation',
};
export const EmptyState: Story = { ...page('emptyState'), name: 'Empty State' };
export const LoadingAndProgress: Story = {
  ...page('loadingAndProgress'),
  name: 'Loading and Progress',
};
export const Onboarding: Story = page('onboarding');
export const AiAndAgents: Story = { ...page('aiAndAgents'), name: 'AI and Agents' };
export const ButtonAndCta: Story = { ...page('buttonAndCta'), name: 'Button and CTA' };
export const Link: Story = page('link');
export const ToggleAndSelection: Story = {
  ...page('toggleAndSelection'),
  name: 'Toggle and Selection',
};
export const DestructiveModal: Story = { ...page('destructiveModal'), name: 'Destructive Modal' };
export const FormField: Story = { ...page('formField'), name: 'Form Field' };
export const SearchAndFilter: Story = { ...page('searchAndFilter'), name: 'Search and Filter' };
export const TabsAndNavigation: Story = {
  ...page('tabsAndNavigation'),
  name: 'Tabs and Navigation',
};
export const Drawer: Story = page('drawer');
export const AccordionAndDisclosure: Story = {
  ...page('accordionAndDisclosure'),
  name: 'Accordion and Disclosure',
};
export const TableAndStatus: Story = { ...page('tableAndStatus'), name: 'Table and Status' };
export const DateTimeAndDuration: Story = {
  ...page('dateTimeAndDuration'),
  name: 'Date, Time, and Duration',
};
export const Tooltip: Story = page('tooltip');
