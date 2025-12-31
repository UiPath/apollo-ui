import { ApToolCall } from '@uipath/apollo-react/material/components';
import styled from 'styled-components';
import { PageContainer, PageDescription, PageTitle } from '../../components/SharedStyles';

const ShowcaseSection = styled.div`
  margin-top: 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 20px;
  color: var(--color-primary);
  margin-bottom: 16px;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 8px;
`;

const ComponentRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: var(--color-background);
  border-radius: 12px;
  border: 2px solid var(--color-border);
`;

const Label = styled.div`
  font-size: 14px;
  color: var(--color-foreground-de-emp);
  font-weight: 600;
  margin-bottom: 8px;
`;

export function ToolCallShowcase() {
  return (
    <PageContainer>
      <PageTitle>Tool Call</PageTitle>
      <PageDescription>
        Component for displaying tool execution traces with expandable sections
      </PageDescription>

      <ShowcaseSection>
        <SectionTitle>Tool Execution States</SectionTitle>
        <ComponentRow>
          <Label>Loading state</Label>
          <ApToolCall
            toolName="get_weather"
            input={{ location: 'San Francisco', unit: 'celsius' }}
            startTime={new Date().toISOString()}
          />
        </ComponentRow>

        <ComponentRow>
          <Label>Success state with output</Label>
          <ApToolCall
            toolName="get_weather"
            input={{ location: 'San Francisco', unit: 'celsius' }}
            output={{ temperature: 18, conditions: 'Partly cloudy' }}
            isError={false}
            startTime={new Date(Date.now() - 2000).toISOString()}
            endTime={new Date().toISOString()}
          />
        </ComponentRow>

        <ComponentRow>
          <Label>Error state</Label>
          <ApToolCall
            toolName="send_email"
            input={{
              to: 'user@example.com',
              subject: 'Meeting Reminder',
              body: "Don't forget about our meeting tomorrow at 2 PM",
            }}
            output={{
              error: 'Failed to connect to email server',
              code: 'SMTP_ERROR',
            }}
            isError={true}
            startTime={new Date(Date.now() - 1500).toISOString()}
            endTime={new Date().toISOString()}
          />
        </ComponentRow>

        <ComponentRow>
          <Label>Complex tool with nested data</Label>
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
        </ComponentRow>
      </ShowcaseSection>
    </PageContainer>
  );
}
