import type { Meta } from '@storybook/react-vite';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';

const meta: Meta<typeof Accordion> = {
  title: 'Components/Data Display/Accordion',
  component: Accordion,
  tags: ['autodocs'],
};

export default meta;

// ============================================================================
// Basic
// ============================================================================

export const Basic = {
  name: 'Basic',
  render: () => (
    <Accordion type="single" collapsible className="w-full max-w-lg">
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that match the other components&apos; aesthetic.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>
          Yes. It&apos;s animated by default, but you can disable it if you prefer.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// ============================================================================
// Multiple
// ============================================================================

export const Multiple = {
  name: 'Multiple',
  render: () => (
    <Accordion type="multiple" defaultValue={['item-1', 'item-3']} className="w-full max-w-lg">
      <AccordionItem value="item-1">
        <AccordionTrigger>First section</AccordionTrigger>
        <AccordionContent>
          This accordion allows multiple items to be open at the same time. Try opening several sections.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Second section</AccordionTrigger>
        <AccordionContent>
          Opening this section will not close the others.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Third section</AccordionTrigger>
        <AccordionContent>
          Multiple sections can remain expanded simultaneously.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// ============================================================================
// Disabled
// ============================================================================

export const Disabled = {
  name: 'Disabled',
  render: () => (
    <Accordion type="single" collapsible className="w-full max-w-lg">
      <AccordionItem value="item-1">
        <AccordionTrigger>Available section</AccordionTrigger>
        <AccordionContent>
          This section is available and can be expanded.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" disabled>
        <AccordionTrigger className="opacity-50 cursor-not-allowed hover:no-underline">
          Disabled section
        </AccordionTrigger>
        <AccordionContent>
          This content is not accessible.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Another available section</AccordionTrigger>
        <AccordionContent>
          This section is also available.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-4" disabled>
        <AccordionTrigger className="opacity-50 cursor-not-allowed hover:no-underline">
          Requires upgrade
        </AccordionTrigger>
        <AccordionContent>
          This content requires a plan upgrade.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// ============================================================================
// Borders
// ============================================================================

export const Borders = {
  name: 'Borders',
  render: () => (
    <Accordion type="single" collapsible className="w-full max-w-lg">
      <AccordionItem value="item-1" className="border rounded-lg px-4 mb-2">
        <AccordionTrigger>What is your refund policy?</AccordionTrigger>
        <AccordionContent>
          We offer a 30-day money-back guarantee on all plans. If you&apos;re not satisfied, contact support for a full refund.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" className="border rounded-lg px-4 mb-2">
        <AccordionTrigger>Can I change my plan later?</AccordionTrigger>
        <AccordionContent>
          Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3" className="border rounded-lg px-4">
        <AccordionTrigger>Do you offer team discounts?</AccordionTrigger>
        <AccordionContent>
          Yes, we offer volume discounts for teams of 10 or more. Contact our sales team for a custom quote.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// ============================================================================
// Card
// ============================================================================

export const Card = {
  name: 'Card',
  render: () => (
    <Accordion type="single" collapsible className="w-full max-w-lg">
      <AccordionItem value="item-1" className="mb-3 rounded-lg border bg-card px-4 shadow-sm [&:not(:last-child)]:border-b">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex flex-col items-start gap-1">
            <span className="text-sm font-medium">Getting Started</span>
            <span className="text-xs text-muted-foreground font-normal">Learn the basics of setting up your workspace</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Create a new workspace from the dashboard.</p>
            <p>2. Invite your team members via email.</p>
            <p>3. Configure your project settings.</p>
            <p>4. Start building automations.</p>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" className="mb-3 rounded-lg border bg-card px-4 shadow-sm [&:not(:last-child)]:border-b">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex flex-col items-start gap-1">
            <span className="text-sm font-medium">API Integration</span>
            <span className="text-xs text-muted-foreground font-normal">Connect external services to your workflows</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Use our REST API to integrate with any external service. Authentication is handled via API keys that you can generate from your account settings.</p>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3" className="rounded-lg border bg-card px-4 shadow-sm [&:not(:last-child)]:border-b">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex flex-col items-start gap-1">
            <span className="text-sm font-medium">Deployment</span>
            <span className="text-xs text-muted-foreground font-normal">Deploy your automations to production</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Publish your automation to a production environment with a single click. Monitor performance and logs from the dashboard.</p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// ============================================================================
// Examples
// ============================================================================

export const Examples = {
  name: 'Examples',
  render: () => (
    <div className="flex flex-col gap-10">
      {/* FAQ */}
      <div>
        <p className="text-sm font-medium mb-3">FAQ</p>
        <Accordion type="single" collapsible className="w-full max-w-lg">
          <AccordionItem value="q1">
            <AccordionTrigger>What is Apollo Design System?</AccordionTrigger>
            <AccordionContent>
              Apollo is UiPath&apos;s open-source design system providing a unified component library for building consistent user interfaces across products.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q2">
            <AccordionTrigger>Which frameworks are supported?</AccordionTrigger>
            <AccordionContent>
              Apollo supports React as the primary framework, with Tailwind CSS + shadcn/ui for modern styling. Web Components are also available for cross-framework usage.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q3">
            <AccordionTrigger>How do I install Apollo?</AccordionTrigger>
            <AccordionContent>
              Install via npm with <code className="rounded bg-muted px-1 py-0.5 text-xs">npm install @uipath/apollo-wind</code>. See the Getting Started guide for detailed setup instructions.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q4">
            <AccordionTrigger>Can I contribute?</AccordionTrigger>
            <AccordionContent>
              Yes! Apollo is open source. Check the contribution guidelines in the repository for information on how to submit components, bug fixes, or documentation improvements.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Settings sections */}
      <div>
        <p className="text-sm font-medium mb-3">Settings Sections</p>
        <Accordion type="multiple" className="w-full max-w-lg">
          <AccordionItem value="general" className="border rounded-lg px-4 mb-2">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-bold">G</div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">General</span>
                  <span className="text-xs text-muted-foreground font-normal">Basic workspace settings</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Workspace name</span>
                  <span className="text-sm text-muted-foreground">My Workspace</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Region</span>
                  <span className="text-sm text-muted-foreground">US East</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Timezone</span>
                  <span className="text-sm text-muted-foreground">UTC-5 (Eastern)</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="notifications" className="border rounded-lg px-4 mb-2">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-bold">N</div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Notifications</span>
                  <span className="text-xs text-muted-foreground font-normal">Email and push preferences</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email alerts</span>
                  <span className="text-sm text-green-600">Enabled</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Push notifications</span>
                  <span className="text-sm text-muted-foreground">Disabled</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="security" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-bold">S</div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Security</span>
                  <span className="text-xs text-muted-foreground font-normal">Authentication and access</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Two-factor auth</span>
                  <span className="text-sm text-green-600">Enabled</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">SSO</span>
                  <span className="text-sm text-muted-foreground">Not configured</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">API keys</span>
                  <span className="text-sm text-muted-foreground">2 active</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  ),
};
