import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ProjectExample } from './new-project-example';
import { NewProjectExample } from './new-project-example';

const meta = {
  title: 'Templates/Xrchive/New Project',
  component: NewProjectExample,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    onCreateBlank: { action: 'create blank clicked' },
    autopilot: {
      control: 'object',
    },
  },
} satisfies Meta<typeof NewProjectExample>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultExamples: ProjectExample[] = [
  {
    id: '1',
    name: 'Client Onboarding Account Opening',
    description:
      'An agentic process built with Maestro, modeled using BPMN to orchestrate customer data across...',
    usageCount: 3400,
    category: 'financial',
    tools: ['office365', 'maestro'],
    onUse: () => console.log('Using template 1'),
  },
  {
    id: '2',
    name: 'KYC / CDD & Sanctions Screening',
    description:
      'An agentic process built with Maestro, modeled using BPMN to coordinate identity verification, s...',
    usageCount: 1700,
    category: 'financial',
    tools: ['google', 'maestro'],
    onUse: () => console.log('Using template 2'),
  },
  {
    id: '3',
    name: 'Payments Processing & Exceptions',
    description:
      'An agentic process built with Maestro, modeled using BPMN to orchestrate payment validation, f...',
    usageCount: 1200,
    category: 'financial',
    tools: ['office365', 'maestro'],
    onUse: () => console.log('Using template 3'),
  },
  {
    id: '4',
    name: 'AML Alert Investigation & Case Mgmt',
    description:
      'An agentic process built with Maestro, modeled using BPMN to handle AML alerts through tran...',
    usageCount: 3400,
    category: 'financial',
    tools: ['office365', 'maestro'],
    onUse: () => console.log('Using template 4'),
  },
  {
    id: '5',
    name: 'Regulatory Reporting',
    description:
      'An agentic process built with Maestro, modeled using BPMN to automate data aggregation, com...',
    usageCount: 1700,
    category: 'financial',
    tools: ['google', 'maestro'],
    onUse: () => console.log('Using template 5'),
  },
  {
    id: '6',
    name: 'Insurance First Notice of Loss (FNOL)',
    description:
      'An agentic process built with Maestro, modeled using BPMN to guide claim intake, coverage che...',
    usageCount: 1200,
    category: 'healthcare',
    tools: ['office365', 'maestro'],
    onUse: () => console.log('Using template 6'),
  },
  {
    id: '7',
    name: 'Insurance Claims Adjudication & Settlement',
    description:
      'An agentic process built with Maestro, modeled using BPMN to coordinate policy validation, frau...',
    usageCount: 3400,
    category: 'healthcare',
    tools: ['office365', 'maestro'],
    onUse: () => console.log('Using template 7'),
  },
  {
    id: '8',
    name: 'Underwriting (New & Renewal)',
    description:
      'An agentic process built with Maestro, modeled using BPMN to orchestrate data gathering, risk...',
    usageCount: 1700,
    category: 'other',
    tools: ['google', 'maestro'],
    onUse: () => console.log('Using template 8'),
  },
  {
    id: '9',
    name: 'Cards Dispute & Chargeback Management',
    description:
      'An agentic process built with Maestro, modeled using BPMN to automate dispute intake, transac...',
    usageCount: 1200,
    category: 'financial',
    tools: ['office365', 'maestro'],
    onUse: () => console.log('Using template 9'),
  },
];

export const Default: Story = {
  args: {
    onCreateBlank: () => console.log('Create blank project'),
    autopilot: {
      placeholder: 'Create an agent to...',
      disclaimer: 'Autopilot can make mistakes. Please double check the responses.',
      onSubmit: (prompt: string) => console.log('Autopilot prompt:', prompt),
    },
    templates: defaultExamples,
    categories: [
      { id: 'financial', label: 'Financial' },
      { id: 'healthcare', label: 'Healthcare' },
      { id: 'other', label: 'Other' },
    ],
    tools: [
      { id: 'office365', label: 'Office365' },
      { id: 'jira', label: 'Jira' },
      { id: 'sap-concur', label: 'SAP Concur' },
      { id: 'slack', label: 'Slack' },
      { id: 'docusign', label: 'DocuSign' },
    ],
  },
};
