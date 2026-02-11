import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import {
  House,
  MessageCircle,
  Workflow,
  ChevronUp,
  Search,
  Settings as SettingsIcon,
  Copy,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  Sun,
  Moon,
  Monitor,
  Upload,
  User,
} from 'lucide-react';
import { DelegateTemplate } from './template-delegate';
import type { NavItem } from './template-delegate';
import { ChatFirstExperience } from '@/components/custom/chat-first-experience';
import { ChatComposer } from '@/components/custom/chat-composer';
import { StepsView } from '@/components/custom/chat-steps-view';
import { Input } from '@/components/ui/input';

const defaultNavItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <House className="h-5 w-5" />,
  },
  {
    id: 'flows',
    label: 'Flows',
    icon: <Workflow className="h-5 w-5" />,
    defaultOpen: false,
    children: [
      { id: 'flow-1', label: 'Flow name' },
      { id: 'flow-2', label: 'Flow name' },
      { id: 'flow-3', label: 'Flow name' },
      { id: 'flow-4', label: 'Flow name' },
    ],
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: <MessageCircle className="h-5 w-5" />,
    children: [
      { id: 'chat-1', label: 'Chat name' },
      { id: 'chat-2', label: 'Chat name' },
      { id: 'chat-3', label: 'Chat name' },
      { id: 'chat-4', label: 'Chat name' },
    ],
  },
];

const meta = {
  title: 'Templates/Delegate',
  component: DelegateTemplate,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [],
} satisfies Meta<typeof DelegateTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Blank: Story = {
  render: (_, { globals }) => (
    <DelegateTemplate
      theme={globals.futureTheme || 'dark'}
      navItems={defaultNavItems}
      defaultPanelOpen={true}
    >
      {/* Blank state - empty main content */}
    </DelegateTemplate>
  ),
};

export const Chat: Story = {
  render: (_, { globals }) => (
    <DelegateTemplate
      theme={globals.futureTheme || 'dark'}
      navItems={defaultNavItems}
      defaultPanelOpen={true}
    >
      <ChatFirstExperience />
    </DelegateTemplate>
  ),
};

// ============================================================================
// Chat Responses content
// ============================================================================

const agentSteps = [
  {
    icon: <Search className="h-3.5 w-3.5 text-future-foreground-subtle" />,
    title: 'WebSearchTool',
    description:
      'Searching and analyzing multiple cells in this spreadsheet to create a summary for planning next steps.',
  },
  {
    icon: <SettingsIcon className="h-3.5 w-3.5 text-future-foreground-subtle" />,
    title: 'Excel Agent',
    description: 'Editing current column with additional information.',
  },
  {
    icon: <Search className="h-3.5 w-3.5 text-future-foreground-subtle" />,
    title: 'WebSearchTool',
    description:
      'Checking categorized tabs to better understand spam and volume sources.',
  },
  {
    icon: <SettingsIcon className="h-3.5 w-3.5 text-future-foreground-subtle" />,
    title: 'Currency conversion',
    description:
      'Performing currency conversion using current market rates to ensure accurate calculations.',
  },
];

function ChatResponsesContent() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Scrollable chat area — content anchored to bottom */}
      <div className="flex flex-1 flex-col items-center justify-end overflow-y-auto px-6 py-8">
        <div className="flex w-full max-w-[800px] flex-col gap-6">
          {/* User message — right-aligned */}
          <div className="flex justify-end">
            <div className="max-w-[640px] rounded-bl-2xl rounded-br-sm rounded-tl-2xl rounded-tr-2xl bg-future-surface-raised px-6 py-4">
              <p className="text-base leading-6 tracking-[-0.4px] text-future-foreground">
                Open the Excel file I uploaded yesterday, analyze the sales
                numbers, and generate a short summary of monthly performance.
                Send the summary to me on Slack once you&apos;re done.
              </p>
            </div>
          </div>

          {/* "Created an action plan" — left-aligned */}
          <div className="flex items-center gap-2">
            <span className="text-base font-medium text-future-foreground-muted">
              Created an action plan
            </span>
            <ChevronUp className="h-4 w-4 text-future-foreground-muted" />
          </div>

          {/* Agent card — dark theme */}
          <div className="w-full max-w-[477px] overflow-hidden rounded-2xl border border-future-border-subtle bg-future-surface-overlay">
            {/* Card header */}
            <div className="flex items-center justify-between border-b border-future-border-subtle px-4 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                    <rect width="24" height="24" rx="4" fill="#21A366" />
                    <path d="M6 4h5l3 4.5L17 4h4v16h-4l-3-4.5L11 20H6V4z" fill="white" opacity="0.9" />
                    <path d="M3 7h7l-2 5 2 5H3V7z" fill="#185C37" />
                    <text x="4.5" y="14.5" fontSize="7" fontWeight="bold" fill="white">X</text>
                  </svg>
                </div>
                <span className="text-base font-semibold tracking-[-0.4px] text-future-foreground">
                  Excel Agent
                </span>
              </div>
              <ChevronUp className="h-4 w-4 text-future-foreground-muted" />
            </div>

            {/* Card content */}
            <div className="flex flex-col gap-3 px-4 pb-4 pt-2">
              <span className="text-xs tracking-[-0.3px] text-future-foreground-subtle">
                Agents and tools used
              </span>

              <div className="flex flex-col gap-3">
                {agentSteps.map((step, i) => (
                  <div key={i} className="flex gap-2.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[10px] bg-future-surface-raised">
                      {step.icon}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold leading-4 text-future-foreground">
                        {step.title}
                      </span>
                      <span className="text-xs leading-[18px] text-future-foreground-muted">
                        {step.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action icons row */}
          <div className="flex items-center gap-1">
            <button className="flex h-6 w-6 items-center justify-center rounded text-future-foreground-subtle transition-colors hover:text-future-foreground">
              <Copy className="h-4 w-4" />
            </button>
            <button className="flex h-6 w-6 items-center justify-center rounded text-future-foreground-subtle transition-colors hover:text-future-foreground">
              <ThumbsDown className="h-4 w-4" />
            </button>
            <button className="flex h-6 w-6 items-center justify-center rounded text-future-foreground-subtle transition-colors hover:text-future-foreground">
              <ThumbsUp className="h-4 w-4" />
            </button>
            <button className="flex h-6 w-6 items-center justify-center rounded text-future-foreground-subtle transition-colors hover:text-future-foreground">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Composer — pinned to bottom */}
      <div className="flex justify-center px-6 pb-6">
        <ChatComposer placeholder="I would like you to automate my" />
      </div>
    </div>
  );
}

export const ChatResponses: Story = {
  name: 'Chat Responses',
  render: (_, { globals }) => (
    <DelegateTemplate
      theme={globals.futureTheme || 'dark'}
      navItems={defaultNavItems}
      defaultPanelOpen={true}
    >
      <ChatResponsesContent />
    </DelegateTemplate>
  ),
};

export const Steps: Story = {
  render: (_, { globals }) => (
    <DelegateTemplate
      theme={globals.futureTheme || 'dark'}
      navItems={defaultNavItems}
      defaultPanelOpen={true}
    >
      <StepsView />
    </DelegateTemplate>
  ),
};

// ============================================================================
// Settings content
// ============================================================================

const settingsTabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'security', label: 'Security' },
  { id: 'shortcuts', label: 'Shortcuts' },
];

function SettingsContent() {
  const [activeTab, setActiveTab] = React.useState('profile');
  const [selectedTheme, setSelectedTheme] = React.useState('dark');

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Tabs */}
      <div className="shrink-0 border-b border-future-border-subtle px-8 pt-6">
        <div className="flex gap-1">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-future-accent text-future-foreground'
                  : 'text-future-foreground-muted hover:text-future-foreground'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        {activeTab === 'profile' ? (
          <div className="mx-auto max-w-2xl">
            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-future-foreground">Manage Profile</h1>
              <p className="mt-1 text-sm text-future-foreground-muted">
                Update your profile information and preferences.
              </p>
            </div>

            <div className="flex flex-col gap-8">
              {/* Profile Image */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-future-foreground">Profile Image</label>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-future-surface-overlay">
                    <User className="h-7 w-7 text-future-foreground-muted" />
                  </div>
                  <button className="flex h-9 items-center gap-2 rounded-lg border border-future-border bg-future-surface px-4 text-sm font-medium text-future-foreground-muted transition-colors hover:border-future-border-hover hover:text-future-foreground">
                    <Upload className="h-4 w-4" />
                    Select Image
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-future-border-subtle" />

              {/* Your Name */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-future-foreground">Your Name</label>
                <Input
                  placeholder="Enter your name"
                  className="max-w-md border-future-border bg-future-surface-overlay text-future-foreground placeholder:text-future-foreground-subtle"
                />
              </div>

              {/* Your Email */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-future-foreground">Your Email</label>
                <Input
                  placeholder="Enter your email"
                  type="email"
                  className="max-w-md border-future-border bg-future-surface-overlay text-future-foreground placeholder:text-future-foreground-subtle"
                />
              </div>

              {/* Divider */}
              <div className="h-px bg-future-border-subtle" />

              {/* Language */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-future-foreground">Language</label>
                <p className="text-sm text-future-foreground-muted">
                  Select your preferred language for the interface.
                </p>
                <select className="h-10 max-w-md appearance-none rounded-md border border-future-border bg-future-surface-overlay px-3 text-sm text-future-foreground focus:outline-none focus:ring-1 focus:ring-future-ring">
                  <option>Select Language</option>
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Japanese</option>
                </select>
              </div>

              {/* Divider */}
              <div className="h-px bg-future-border-subtle" />

              {/* Theme Settings */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-future-foreground">Theme Settings</label>
                <p className="text-sm text-future-foreground-muted">
                  Choose your preferred theme for the interface.
                </p>
                <div className="flex gap-3">
                  {[
                    { id: 'light', label: 'Light', icon: <Sun className="h-5 w-5" /> },
                    { id: 'dark', label: 'Dark', icon: <Moon className="h-5 w-5" /> },
                    { id: 'system', label: 'System', icon: <Monitor className="h-5 w-5" /> },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      className={`flex h-20 w-28 flex-col items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors ${
                        selectedTheme === theme.id
                          ? 'border-future-accent bg-future-accent-subtle text-future-foreground'
                          : 'border-future-border bg-future-surface-overlay text-future-foreground-muted hover:border-future-border-hover hover:text-future-foreground'
                      }`}
                      onClick={() => setSelectedTheme(theme.id)}
                    >
                      {theme.icon}
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-future-foreground-muted">
            Coming soon
          </div>
        )}
      </div>
    </div>
  );
}

export const Settings: Story = {
  name: 'Settings',
  render: (_, { globals }) => (
    <DelegateTemplate
      theme={globals.futureTheme || 'dark'}
      navItems={defaultNavItems}
      defaultPanelOpen={true}
    >
      <SettingsContent />
    </DelegateTemplate>
  ),
};
