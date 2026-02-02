import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodedAgentFlow } from './CodedAgentFlow';

const meta: Meta<typeof CodedAgentFlow> = {
  title: 'Canvas/CodedAgentFlow',
  component: CodedAgentFlow,
  decorators: [
    (Story) => (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof CodedAgentFlow>;

// Sample Mermaid diagrams for different scenarios
const simpleMermaidText = `
flowchart LR
    Start --> Agent1[Process Data]
    Agent1 --> End
`;

const complexMermaidText = `
flowchart TD
    Start --> Agent1[Analyze Request]
    Agent1 --> Tool1[Query Database]
    Agent1 --> Tool2[Call API]
    Tool1 --> Agent2[Process Results]
    Tool2 --> Agent2
    Agent2 --> Context1[Session Context]
    Context1 --> Escalation1[Manager Approval]
    Escalation1 --> End
`;

const resourceFlowMermaidText = `
flowchart LR
    Start --> Agent1[Main Agent]
    Agent1 --> Tool1[Extract Data]
    Agent1 --> Tool2[Validate Claims]
    Agent1 --> Context1[User Profile]
    Agent1 --> Context2[Organization Settings]
    Context1 --> Agent2[Decision Agent]
    Context2 --> Agent2
    Tool1 --> Agent2
    Tool2 --> Agent2
    Agent2 --> Escalation1[Human Review]
    Escalation1 --> End
`;

export const SimpleFlow: Story = {
  args: {
    mermaidText: simpleMermaidText,
    layoutDirection: 'LR',
  },
};

export const ComplexFlow: Story = {
  args: {
    mermaidText: complexMermaidText,
    layoutDirection: 'LR',
  },
};

export const ResourceFlow: Story = {
  args: {
    mermaidText: resourceFlowMermaidText,
    layoutDirection: 'LR',
  },
};

export const EmptyState: Story = {
  args: {
    mermaidText: '',
  },
};
