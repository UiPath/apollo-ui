import * as ApolloCore from "@uipath/apollo-react/core";
import { ApSankeyDiagram } from "@uipath/apollo-react/material/components";
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
				<SectionHeader>Agent Trace Flow with Metadata</SectionHeader>
				<SectionDescription>
					Complex multi-stage trace flow showing agent job execution paths
					through LLM calls, tool invocations, guardrails, and final
					outcomes. Hover over links to see metadata. Use zoom controls to
					navigate.
				</SectionDescription>
				<ApSankeyDiagram
					data={{
						nodes: [
							{ id: "all_traces", label: "All Traces" },
							// Stage 1: Entry routing
							{ id: "api_call", label: "LLM API Call" },
							{ id: "context", label: "Context Grounding Index Search" },
							{ id: "direct_tool", label: "Direct Tool Invocation" },
							// Stage 2: Processing
							{ id: "memory", label: "Apply Dynamic Few Shot Memory" },
							{ id: "guardrails", label: "Input Guardrails" },
							{ id: "rag_retrieval", label: "RAG Document Retrieval" },
							{ id: "fn_call_parse", label: "Function Call Parsing" },
							// Stage 3: Tool execution
							{ id: "web_search", label: "Tool Call - Web Search" },
							{ id: "code_exec", label: "Tool Call - Code Execution" },
							{ id: "db_query", label: "Tool Call - Database Query" },
							{ id: "api_integration", label: "Tool Call - External API" },
							// Stage 4: Result validation & retry
							{ id: "result_validation", label: "Result Validation" },
							{ id: "confidence_check", label: "Confidence Score Check" },
							{ id: "retry_orchestrator", label: "Retry Orchestrator" },
							// Stage 5: Post-processing
							{ id: "output_guardrails", label: "Output Guardrails" },
							{ id: "response_format", label: "Response Formatting" },
							{ id: "escalation", label: "Human Escalation" },
							// Stage 6: Logging & audit
							{ id: "audit_log", label: "Audit Log & Compliance" },
							{ id: "telemetry", label: "Telemetry Export" },
							// Stage 7: Outcomes
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
							{
								id: "timeout",
								label: "Timeout",
								color: ApolloCore.ColorWarning500,
							},
						],
						links: [
							// Stage 1: Entry routing
							{
								source: "all_traces",
								target: "api_call",
								value: 45,
								metadata: { "Total jobs": 45, "P95 latency": "1.2s", "Agent units": "90" },
							},
							{
								source: "all_traces",
								target: "context",
								value: 30,
								metadata: { "Total jobs": 30, "P95 latency": "0.8s", "Agent units": "60" },
							},
							{
								source: "all_traces",
								target: "direct_tool",
								value: 15,
								metadata: { "Total jobs": 15, "P95 latency": "0.3s", "Agent units": "15" },
							},
							// Stage 2: LLM API Call fan-out
							{
								source: "api_call",
								target: "memory",
								value: 18,
								metadata: { "Total jobs": 18, "P95 latency": "2.1s", "Agent units": "36" },
							},
							{
								source: "api_call",
								target: "guardrails",
								value: 15,
								metadata: { "Total jobs": 15, "P95 latency": "0.5s", "Agent units": "30" },
							},
							{
								source: "api_call",
								target: "fn_call_parse",
								value: 12,
								metadata: { "Total jobs": 12, "P95 latency": "0.2s", "Agent units": "12" },
							},
							// Stage 2: Context grounding fan-out
							{
								source: "context",
								target: "rag_retrieval",
								value: 20,
								metadata: { "Total jobs": 20, "P95 latency": "1.5s", "Agent units": "40" },
							},
							{ source: "context", target: "guardrails", value: 10 },
							// Stage 2: Direct tool fan-out
							{ source: "direct_tool", target: "fn_call_parse", value: 15 },
							// Stage 3: Processing → Tool execution
							{ source: "memory", target: "web_search", value: 8 },
							{ source: "memory", target: "db_query", value: 10 },
							{
								source: "guardrails",
								target: "web_search",
								value: 10,
								metadata: { "Total jobs": 10, "P95 latency": "3.2s", "Agent units": "50" },
							},
							{ source: "guardrails", target: "code_exec", value: 8 },
							{ source: "guardrails", target: "escalation", value: 7 },
							{ source: "rag_retrieval", target: "api_integration", value: 12 },
							{ source: "rag_retrieval", target: "db_query", value: 8 },
							{ source: "fn_call_parse", target: "web_search", value: 9 },
							{ source: "fn_call_parse", target: "code_exec", value: 10 },
							{ source: "fn_call_parse", target: "api_integration", value: 8 },
							// Stage 4: Tool execution → Result validation
							{
								source: "web_search",
								target: "result_validation",
								value: 18,
								metadata: { "Total jobs": 18, "P95 latency": "0.3s", "Agent units": "18" },
							},
							{ source: "web_search", target: "confidence_check", value: 9 },
							{ source: "code_exec", target: "result_validation", value: 12 },
							{ source: "code_exec", target: "confidence_check", value: 6 },
							{ source: "db_query", target: "result_validation", value: 10 },
							{ source: "db_query", target: "confidence_check", value: 8 },
							{ source: "api_integration", target: "result_validation", value: 10 },
							{ source: "api_integration", target: "confidence_check", value: 10 },
							// Stage 4: Validation → Retry or forward
							{
								source: "result_validation",
								target: "output_guardrails",
								value: 35,
								metadata: { "Total jobs": 35, "P95 latency": "0.4s", "Agent units": "35" },
							},
							{ source: "result_validation", target: "retry_orchestrator", value: 15 },
							{ source: "confidence_check", target: "output_guardrails", value: 18 },
							{ source: "confidence_check", target: "retry_orchestrator", value: 10 },
							{ source: "confidence_check", target: "escalation", value: 5 },
							// Retry loops back into post-processing (longer path)
							{
								source: "retry_orchestrator",
								target: "response_format",
								value: 16,
								metadata: { "Total jobs": 16, "P95 latency": "4.8s", "Retry attempts": "2.3 avg" },
							},
							{ source: "retry_orchestrator", target: "escalation", value: 9 },
							// Stage 5: Post-processing
							{
								source: "output_guardrails",
								target: "audit_log",
								value: 32,
								metadata: { "Total jobs": 32, "P95 latency": "0.1s", "Agent units": "32" },
							},
							{ source: "output_guardrails", target: "telemetry", value: 15 },
							{ source: "output_guardrails", target: "faulted", value: 6 },
							{ source: "response_format", target: "audit_log", value: 10 },
							{ source: "response_format", target: "telemetry", value: 6 },
							// Stage 6: Logging → Outcomes (longest paths: 8 columns deep)
							{
								source: "audit_log",
								target: "successful",
								value: 36,
								metadata: { "Total jobs": 36, "P95 latency": "0.05s", "Agent units": "36" },
							},
							{ source: "audit_log", target: "faulted", value: 6 },
							{ source: "telemetry", target: "successful", value: 16 },
							{ source: "telemetry", target: "timeout", value: 5 },
							// Escalation → Outcomes
							{ source: "escalation", target: "successful", value: 8 },
							{ source: "escalation", target: "faulted", value: 10 },
							{ source: "escalation", target: "timeout", value: 3 },
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
