import { ApToolCall, ConversationalDisplayModeTypes } from "@uipath/apollo-react/material/components";
import styled from "styled-components";
import {
	PageContainer,
	PageDescription,
	PageTitle,
} from "../../components/SharedStyles";

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
						input={{ location: "San Francisco", unit: "celsius" }}
						startTime={new Date().toISOString()}
					/>
				</ComponentRow>

				<ComponentRow>
					<Label>Success state with output</Label>
					<ApToolCall
						toolName="get_weather"
						input={{ location: "San Francisco", unit: "celsius" }}
						output={{ temperature: 18, conditions: "Partly cloudy" }}
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
							to: "user@example.com",
							subject: "Meeting Reminder",
							body: "Don't forget about our meeting tomorrow at 2 PM",
						}}
						output="Failed to connect to email server: SMTP connection timed out after 30s"
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
							query: "latest sales reports",
							limit: 10,
							filters: { year: 2024, region: "US" },
						}}
						output={{
							results: [
								{ id: 1, title: "Q1 Sales Report", date: "2024-01-15" },
								{ id: 2, title: "Q2 Sales Report", date: "2024-04-15" },
							],
							total: 2,
						}}
						isError={false}
						startTime={new Date(Date.now() - 3500).toISOString()}
						endTime={new Date().toISOString()}
					/>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Display Modes</SectionTitle>
				<ComponentRow>
					<Label>Display mode: Tool name only</Label>
					<ApToolCall
						toolName="get_weather"
						input={{ location: "San Francisco", unit: "celsius" }}
						output={{ temperature: 18, conditions: "Partly cloudy" }}
						isError={false}
						startTime={new Date(Date.now() - 2000).toISOString()}
						endTime={new Date().toISOString()}
						displayMode={ConversationalDisplayModeTypes.ToolNameOnly}
					/>
				</ComponentRow>

				<ComponentRow>
					<Label>Display mode: Inputs and outputs</Label>
					<ApToolCall
						toolName="search_database"
						input={{
							query: "latest sales reports",
							limit: 10,
							filters: { year: 2024, region: "US" },
						}}
						output={{
							results: [
								{ id: 1, title: "Q1 Sales Report", date: "2024-01-15" },
								{ id: 2, title: "Q2 Sales Report", date: "2024-04-15" },
							],
							total: 2,
						}}
						isError={false}
						startTime={new Date(Date.now() - 3500).toISOString()}
						endTime={new Date().toISOString()}
						displayMode={ConversationalDisplayModeTypes.InputsAndOutputs}
					/>
				</ComponentRow>

				<ComponentRow>
					<Label>Display mode: Full trace</Label>
					<ApToolCall
						displayMode={ConversationalDisplayModeTypes.FullTrace}
						span={{
							key: "multi-web-search",
							name: "Tool call - Multi_Web_Search",
							data: {
								id: "00000000-0000-0000-550d-3fbf1b3bc12a",
								name: "Tool call - Multi_Web_Search",
								startTime: new Date(Date.now() - 25000).toISOString(),
								endTime: new Date().toISOString(),
								status: "ok",
								type: "toolCall",
								attributes: {
									toolName: "Multi_Web_Search",
									toolType: "Agent",
									arguments: { query: "what are trending right now" },
									result: { result: "Multi web search completed successfully." },
								},
							},
							children: [
								{
									key: "autonomous-web-search",
									name: "Autonomous Web Search",
									data: {
										id: "agentTool-1",
										name: "Autonomous Web Search",
										startTime: new Date(Date.now() - 25000).toISOString(),
										endTime: new Date().toISOString(),
										status: "ok",
										type: "agentTool",
									},
									children: [
										{
											key: "agent-run-1",
											name: "Agent run - Autonomous Web Search",
											data: {
												id: "agentRun-1",
												name: "Agent run - Autonomous Web Search",
												startTime: new Date(Date.now() - 23000).toISOString(),
												endTime: new Date().toISOString(),
												status: "ok",
												type: "agentRun",
											},
											children: [
												{
													key: "tool-call-web-search-1",
													name: "Tool call - Web_Search",
													data: {
														id: "ws1",
														name: "Tool call - Web_Search",
														type: "toolCall",
														status: "ok",
														startTime: new Date(Date.now() - 21000).toISOString(),
														endTime: new Date(Date.now() - 17000).toISOString(),
													},
													children: [
														{
															key: "web-search-1",
															name: "Web Search",
															data: {
																id: "ws1-int",
																name: "Web Search",
																type: "integrationTool",
																status: "ok",
																startTime: new Date(Date.now() - 21000).toISOString(),
																endTime: new Date(Date.now() - 17000).toISOString(),
															},
															children: [],
														},
													],
												},
												{
													key: "tool-call-web-search-2",
													name: "Tool call - Web_Search",
													data: {
														id: "ws2",
														name: "Tool call - Web_Search",
														type: "toolCall",
														status: "ok",
														startTime: new Date(Date.now() - 16000).toISOString(),
														endTime: new Date(Date.now() - 10000).toISOString(),
													},
													children: [
														{
															key: "web-search-2",
															name: "Web Search",
															data: {
																id: "ws2-int",
																name: "Web Search",
																type: "integrationTool",
																status: "ok",
																startTime: new Date(Date.now() - 16000).toISOString(),
																endTime: new Date(Date.now() - 10000).toISOString(),
															},
															children: [],
														},
													],
												},
												{
													key: "tool-call-web-search-3",
													name: "Tool call - Web_Search",
													data: {
														id: "ws3",
														name: "Tool call - Web_Search",
														type: "toolCall",
														status: "ok",
														startTime: new Date(Date.now() - 9000).toISOString(),
														endTime: new Date(Date.now() - 2000).toISOString(),
													},
													children: [
														{
															key: "web-search-3",
															name: "Web Search",
															data: {
																id: "ws3-int",
																name: "Web Search",
																type: "integrationTool",
																status: "ok",
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
						}}
					/>
				</ComponentRow>
			</ShowcaseSection>
		</PageContainer>
	);
}
