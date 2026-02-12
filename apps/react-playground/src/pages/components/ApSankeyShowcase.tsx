import { ApSankeyDiagram } from "@uipath/apollo-react/material/components";
import * as ApolloCore from "@uipath/apollo-react/core";
import {
	PageContainer,
	PageDescription,
	PageTitle,
	SectionDescription,
	SectionHeader,
} from "../../components/SharedStyles";

export function ApSankeyShowcase() {
	return (
		<PageContainer>
			<PageTitle>Sankey Diagram</PageTitle>
			<PageDescription>
				ApSankeyDiagram visualizes flow data between nodes, showing the
				magnitude of connections through proportional link widths. Perfect for
				process flows, data pipelines, and analytics dashboards.
			</PageDescription>

			<section style={{ marginBottom: "48px" }}>
				<SectionHeader>Simple Flow</SectionHeader>
				<SectionDescription>
					A basic Sankey diagram showing flow from start to completion with
					successful and failed paths.
				</SectionDescription>
				<ApSankeyDiagram
					data={{
						nodes: [
							{ id: "start", label: "All traces" },
							{ id: "successful", label: "Successful" },
							{ id: "failed", label: "Faulted" },
						],
						links: [
							{ source: "start", target: "successful", value: 80 },
							{ source: "start", target: "failed", value: 20 },
						],
					}}
					style={{ height: "300px", width: "100%" }}
				/>
			</section>

			<section style={{ marginBottom: "48px" }}>
				<SectionHeader>Job Flow with Metadata</SectionHeader>
				<SectionDescription>
					Complex flow showing agent job execution paths. Hover over links to
					see metadata like total jobs, latency, and agent units.
				</SectionDescription>
				<ApSankeyDiagram
					data={{
						nodes: [
							{ id: "all_traces", label: "All traces" },
							{ id: "api_call", label: "API Call" },
							{ id: "context", label: "Context Grounding Index Search" },
							{ id: "memory", label: "Apply Dynamic Few Shot Memory" },
							{ id: "guardrails", label: "Guardrails" },
							{ id: "escalation", label: "Escalation" },
							{ id: "web_search", label: "Tool Call - Web Search" },
							{
								id: "successful",
								label: "Successful",
								color: ApolloCore.ColorSuccess500,
							},
							{
								id: "faulted",
								label: "Faulted",
								color: ApolloCore.ColorError500,
							},
						],
						links: [
							{
								source: "all_traces",
								target: "api_call",
								value: 6,
								metadata: {
									"Total jobs": 6,
									"P95 latency": "10s",
									"Agent units": "15",
								},
							},
							{
								source: "all_traces",
								target: "context",
								value: 3,
								metadata: {
									"Total jobs": 3,
									"P95 latency": "10s",
									"Agent units": "18",
								},
							},
							{ source: "api_call", target: "memory", value: 2 },
							{
								source: "api_call",
								target: "guardrails",
								value: 2,
								metadata: {
									"Total jobs": 4,
									"P95 latency": "10s",
									"Agent units": "14",
								},
							},
							{
								source: "api_call",
								target: "escalation",
								value: 1,
								metadata: {
									"Total jobs": 3,
									"P95 latency": "10s",
									"Agent units": "55",
								},
							},
							{
								source: "api_call",
								target: "web_search",
								value: 1,
								metadata: {
									"Total jobs": 2,
									"P95 latency": "10s",
									"Agent units": "25",
								},
							},
							{ source: "context", target: "guardrails", value: 2 },
							{ source: "context", target: "web_search", value: 1 },
							{ source: "memory", target: "successful", value: 1 },
							{ source: "memory", target: "faulted", value: 1 },
							{ source: "guardrails", target: "successful", value: 3 },
							{ source: "guardrails", target: "faulted", value: 1 },
							{ source: "escalation", target: "faulted", value: 1 },
							{ source: "web_search", target: "successful", value: 1 },
							{ source: "web_search", target: "faulted", value: 1 },
						],
					}}
					style={{ height: "600px", width: "100%" }}
				/>
			</section>

			<section style={{ marginBottom: "48px" }}>
				<SectionHeader>Custom Colors</SectionHeader>
				<SectionDescription>
					Customize node and link colors to match your brand or highlight
					specific flows.
				</SectionDescription>
				<ApSankeyDiagram
					data={{
						nodes: [
							{ id: "source", label: "Source", color: "#FF6B6B" },
							{ id: "process1", label: "Process 1", color: "#4ECDC4" },
							{ id: "process2", label: "Process 2", color: "#45B7D1" },
							{ id: "output", label: "Output", color: "#96CEB4" },
						],
						links: [
							{ source: "source", target: "process1", value: 60 },
							{ source: "source", target: "process2", value: 40 },
							{ source: "process1", target: "output", value: 50 },
							{ source: "process2", target: "output", value: 35 },
						],
					}}
					style={{ height: "400px", width: "100%" }}
				/>
			</section>

			<section style={{ marginBottom: "48px" }}>
				<SectionHeader>Node Alignment Options</SectionHeader>
				<SectionDescription>
					Control how nodes are positioned horizontally: left, right, center, or
					justify (default).
				</SectionDescription>

				<div style={{ marginBottom: "32px" }}>
					<h4
						style={{
							fontSize: "16px",
							color: "var(--color-foreground-emp)",
							marginBottom: "12px",
						}}
					>
						Left Alignment
					</h4>
					<ApSankeyDiagram
						data={{
							nodes: [
								{ id: "a", label: "Start" },
								{ id: "b", label: "Middle" },
								{ id: "c", label: "End" },
							],
							links: [
								{ source: "a", target: "b", value: 10 },
								{ source: "b", target: "c", value: 8 },
							],
						}}
						nodeAlignment="left"
						style={{ height: "250px", width: "100%" }}
					/>
				</div>

				<div style={{ marginBottom: "32px" }}>
					<h4
						style={{
							fontSize: "16px",
							color: "var(--color-foreground-emp)",
							marginBottom: "12px",
						}}
					>
						Center Alignment
					</h4>
					<ApSankeyDiagram
						data={{
							nodes: [
								{ id: "a", label: "Start" },
								{ id: "b", label: "Middle" },
								{ id: "c", label: "End" },
							],
							links: [
								{ source: "a", target: "b", value: 10 },
								{ source: "b", target: "c", value: 8 },
							],
						}}
						nodeAlignment="center"
						style={{ height: "250px", width: "100%" }}
					/>
				</div>

				<div>
					<h4
						style={{
							fontSize: "16px",
							color: "var(--color-foreground-emp)",
							marginBottom: "12px",
						}}
					>
						Right Alignment
					</h4>
					<ApSankeyDiagram
						data={{
							nodes: [
								{ id: "a", label: "Start" },
								{ id: "b", label: "Middle" },
								{ id: "c", label: "End" },
							],
							links: [
								{ source: "a", target: "b", value: 10 },
								{ source: "b", target: "c", value: 8 },
							],
						}}
						nodeAlignment="right"
						style={{ height: "250px", width: "100%" }}
					/>
				</div>
			</section>

			<section style={{ marginBottom: "48px" }}>
				<SectionHeader>Node Sizing</SectionHeader>
				<SectionDescription>
					Adjust node width and padding to control the visual density of the
					diagram.
				</SectionDescription>

				<div style={{ marginBottom: "32px" }}>
					<h4
						style={{
							fontSize: "16px",
							color: "var(--color-foreground-emp)",
							marginBottom: "12px",
						}}
					>
						Compact (nodeWidth: 16, nodePadding: 8)
					</h4>
					<ApSankeyDiagram
						data={{
							nodes: [
								{ id: "1", label: "Start" },
								{ id: "2", label: "Middle" },
								{ id: "3", label: "End" },
							],
							links: [
								{ source: "1", target: "2", value: 15 },
								{ source: "2", target: "3", value: 10 },
							],
						}}
						nodeWidth={16}
						nodePadding={8}
						style={{ height: "250px", width: "100%" }}
					/>
				</div>

				<div>
					<h4
						style={{
							fontSize: "16px",
							color: "var(--color-foreground-emp)",
							marginBottom: "12px",
						}}
					>
						Spacious (nodeWidth: 32, nodePadding: 24)
					</h4>
					<ApSankeyDiagram
						data={{
							nodes: [
								{ id: "1", label: "Start" },
								{ id: "2", label: "Middle" },
								{ id: "3", label: "End" },
							],
							links: [
								{ source: "1", target: "2", value: 15 },
								{ source: "2", target: "3", value: 10 },
							],
						}}
						nodeWidth={32}
						nodePadding={24}
						style={{ height: "250px", width: "100%" }}
					/>
				</div>
			</section>

			<section style={{ marginBottom: "48px" }}>
				<SectionHeader>Interactive Callbacks</SectionHeader>
				<SectionDescription>
					Click on nodes or links to trigger custom actions. Try clicking on the
					diagram below.
				</SectionDescription>
				<ApSankeyDiagram
					data={{
						nodes: [
							{ id: "input", label: "Input" },
							{ id: "process", label: "Process" },
							{ id: "output", label: "Output" },
						],
						links: [
							{
								source: "input",
								target: "process",
								value: 20,
								metadata: { duration: "2s", cost: "$0.05" },
							},
							{
								source: "process",
								target: "output",
								value: 18,
								metadata: { duration: "1s", cost: "$0.03" },
							},
						],
					}}
					style={{ height: "300px", width: "100%" }}
					onNodeClick={(node) => {
						alert(`Clicked node: ${node.label} (ID: ${node.id})`);
					}}
					onLinkClick={(link) => {
						const metadata = link.metadata
							? JSON.stringify(link.metadata)
							: "None";
						alert(
							`Clicked link from ${link.source} to ${link.target}\nValue: ${link.value}\nMetadata: ${metadata}`,
						);
					}}
				/>
			</section>

			<section style={{ marginBottom: "48px" }}>
				<SectionHeader>Multi-Stage Complex Flow</SectionHeader>
				<SectionDescription>
					Visualize complex branching flows with multiple stages and convergence
					points. Long labels are automatically truncated - hover to see full
					text.
				</SectionDescription>
				<div style={{ maxWidth: "1200px" }}>
					<ApSankeyDiagram
						data={{
							nodes: [
								{ id: "input", label: "Initial Data Input Processing System" },
								{
									id: "stage1a",
									label: "Primary Validation and Transformation Stage",
								},
								{
									id: "stage1b",
									label: "Secondary Data Enrichment Pipeline Module",
								},
								{
									id: "stage1c",
									label: "Tertiary Quality Assurance and Verification",
								},
								{
									id: "stage2a",
									label: "Advanced Analytics Processing Engine",
								},
								{
									id: "stage2b",
									label: "Machine Learning Model Inference Service",
								},
								{
									id: "stage2c",
									label: "Real-time Data Aggregation and Filtering",
								},
								{ id: "output1", label: "Final Processed Output Data Storage" },
								{
									id: "output2",
									label: "Error Handling and Logging System Infrastructure",
								},
							],
							links: [
								{ source: "input", target: "stage1a", value: 100 },
								{ source: "input", target: "stage1b", value: 80 },
								{ source: "input", target: "stage1c", value: 60 },
								{ source: "stage1a", target: "stage2a", value: 50 },
								{ source: "stage1a", target: "stage2b", value: 50 },
								{ source: "stage1b", target: "stage2b", value: 40 },
								{ source: "stage1b", target: "stage2c", value: 40 },
								{ source: "stage1c", target: "stage2c", value: 60 },
								{ source: "stage2a", target: "output1", value: 50 },
								{ source: "stage2b", target: "output1", value: 45 },
								{ source: "stage2b", target: "output2", value: 45 },
								{ source: "stage2c", target: "output2", value: 40 },
							],
						}}
						style={{ height: "500px", width: "100%" }}
					/>
				</div>
			</section>
		</PageContainer>
	);
}
