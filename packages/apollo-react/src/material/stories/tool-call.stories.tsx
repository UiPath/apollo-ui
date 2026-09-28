import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import type { ITreeNode, TSpan } from '../components';
import { ApToolCall, ConversationalDisplayModeTypes } from '../components';
import { materialParameters, Section } from './storybook-helpers';

/**
 * `ApToolCall` from `@uipath/apollo-react/material/components` — a component
 * for displaying tool execution traces with expandable input, output and
 * trace sections.
 *
 * ```ts
 * import { ApToolCall } from '@uipath/apollo-react/material/components';
 * ```
 */
const meta: Meta = {
  title: 'Components/Tool Call',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

const fullTraceSpan: ITreeNode<TSpan> = {
  key: 'multi-web-search',
  name: 'Tool call - Multi_Web_Search',
  data: {
    id: '00000000-0000-0000-550d-3fbf1b3bc12a',
    name: 'Tool call - Multi_Web_Search',
    startTime: new Date(Date.now() - 25000).toISOString(),
    endTime: new Date().toISOString(),
    status: 'ok',
    type: 'toolCall',
    attributes: {
      toolName: 'Multi_Web_Search',
      toolType: 'Agent',
      arguments: { query: 'what are trending right now' },
      result: {
        result: 'Multi web search completed successfully.',
      },
    },
  },
  children: [
    {
      key: 'autonomous-web-search',
      name: 'Autonomous Web Search',
      data: {
        id: 'agentTool-1',
        name: 'Autonomous Web Search',
        startTime: new Date(Date.now() - 25000).toISOString(),
        endTime: new Date().toISOString(),
        status: 'ok',
        type: 'agentTool',
      },
      children: [
        {
          key: 'agent-run-1',
          name: 'Agent run - Autonomous Web Search',
          data: {
            id: 'agentRun-1',
            name: 'Agent run - Autonomous Web Search',
            startTime: new Date(Date.now() - 23000).toISOString(),
            endTime: new Date().toISOString(),
            status: 'ok',
            type: 'agentRun',
          },
          children: [
            {
              key: 'tool-call-web-search-1',
              name: 'Tool call - Web_Search',
              data: {
                id: 'ws1',
                name: 'Tool call - Web_Search',
                type: 'toolCall',
                status: 'ok',
                startTime: new Date(Date.now() - 21000).toISOString(),
                endTime: new Date(Date.now() - 17000).toISOString(),
              },
              children: [
                {
                  key: 'web-search-1',
                  name: 'Web Search',
                  data: {
                    id: 'ws1-int',
                    name: 'Web Search',
                    type: 'integrationTool',
                    status: 'ok',
                    startTime: new Date(Date.now() - 21000).toISOString(),
                    endTime: new Date(Date.now() - 17000).toISOString(),
                  },
                  children: [],
                },
              ],
            },
            {
              key: 'tool-call-web-search-2',
              name: 'Tool call - Web_Search',
              data: {
                id: 'ws2',
                name: 'Tool call - Web_Search',
                type: 'toolCall',
                status: 'ok',
                startTime: new Date(Date.now() - 16000).toISOString(),
                endTime: new Date(Date.now() - 10000).toISOString(),
              },
              children: [
                {
                  key: 'web-search-2',
                  name: 'Web Search',
                  data: {
                    id: 'ws2-int',
                    name: 'Web Search',
                    type: 'integrationTool',
                    status: 'ok',
                    startTime: new Date(Date.now() - 16000).toISOString(),
                    endTime: new Date(Date.now() - 10000).toISOString(),
                  },
                  children: [],
                },
              ],
            },
            {
              key: 'tool-call-web-search-3',
              name: 'Tool call - Web_Search',
              data: {
                id: 'ws3',
                name: 'Tool call - Web_Search',
                type: 'toolCall',
                status: 'ok',
                startTime: new Date(Date.now() - 9000).toISOString(),
                endTime: new Date(Date.now() - 2000).toISOString(),
              },
              children: [
                {
                  key: 'web-search-3',
                  name: 'Web Search',
                  data: {
                    id: 'ws3-int',
                    name: 'Web Search',
                    type: 'integrationTool',
                    status: 'ok',
                    startTime: new Date(Date.now() - 9000).toISOString(),
                    endTime: new Date(Date.now() - 2000).toISOString(),
                  },
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const ExecutionStates: Story = {
  render: () => (
    <Section
      title="Tool Execution States"
      description="Loading, success and error states for tool execution traces."
    >
      <Labeled label="Loading state">
        <ApToolCall
          toolName="get_weather"
          input={{ location: 'San Francisco', unit: 'celsius' }}
          startTime={new Date().toISOString()}
        />
      </Labeled>
      <Labeled label="Success state with output">
        <ApToolCall
          toolName="get_weather"
          input={{ location: 'San Francisco', unit: 'celsius' }}
          output={{ temperature: 18, conditions: 'Partly cloudy' }}
          isError={false}
          startTime={new Date(Date.now() - 2000).toISOString()}
          endTime={new Date().toISOString()}
        />
      </Labeled>
      <Labeled label="Error state">
        <ApToolCall
          toolName="send_email"
          input={{
            to: 'user@example.com',
            subject: 'Meeting Reminder',
            body: "Don't forget about our meeting tomorrow at 2 PM",
          }}
          output="Failed to connect to email server: SMTP connection timed out after 30s"
          isError={true}
          startTime={new Date(Date.now() - 1500).toISOString()}
          endTime={new Date().toISOString()}
        />
      </Labeled>
      <Labeled label="Complex tool with nested data">
        <ApToolCall
          toolName="search_database"
          input={{
            query: 'latest sales reports',
            limit: 10,
            filters: { year: 2024, region: 'US' },
          }}
          output={{
            results: [
              { id: 1, title: 'Q1 Sales Report', date: '2024-01-15' },
              { id: 2, title: 'Q2 Sales Report', date: '2024-04-15' },
            ],
            total: 2,
          }}
          isError={false}
          startTime={new Date(Date.now() - 3500).toISOString()}
          endTime={new Date().toISOString()}
        />
      </Labeled>
    </Section>
  ),
};

export const DisplayModes: Story = {
  render: () => (
    <Section
      title="Display Modes"
      description="The displayMode prop controls which sections are visible."
    >
      <Labeled label="Display mode: Tool name only">
        <ApToolCall
          toolName="get_weather"
          input={{ location: 'San Francisco', unit: 'celsius' }}
          output={{ temperature: 18, conditions: 'Partly cloudy' }}
          isError={false}
          startTime={new Date(Date.now() - 2000).toISOString()}
          endTime={new Date().toISOString()}
          displayMode={ConversationalDisplayModeTypes.ToolNameOnly}
        />
      </Labeled>
      <Labeled label="Display mode: Inputs and outputs">
        <ApToolCall
          toolName="search_database"
          input={{
            query: 'latest sales reports',
            limit: 10,
            filters: { year: 2024, region: 'US' },
          }}
          output={{
            results: [
              { id: 1, title: 'Q1 Sales Report', date: '2024-01-15' },
              { id: 2, title: 'Q2 Sales Report', date: '2024-04-15' },
            ],
            total: 2,
          }}
          isError={false}
          startTime={new Date(Date.now() - 3500).toISOString()}
          endTime={new Date().toISOString()}
          displayMode={ConversationalDisplayModeTypes.InputsAndOutputs}
        />
      </Labeled>
    </Section>
  ),
};

export const FullTrace: Story = {
  render: () => (
    <Section
      title="Full Trace"
      description="Display mode FullTrace renders a nested span tree of the whole tool execution."
    >
      <Labeled label="Display mode: Full trace">
        <ApToolCall displayMode={ConversationalDisplayModeTypes.FullTrace} span={fullTraceSpan} />
      </Labeled>
    </Section>
  ),
};
