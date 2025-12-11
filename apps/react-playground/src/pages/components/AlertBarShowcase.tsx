import {
	type AlertBarStatus,
	ApAlertBar,
} from "@uipath/apollo-react/material/components";
import { useState } from "react";
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

export function AlertBarShowcase() {
	const [showAlert1, setShowAlert1] = useState(true);
	const [showAlert2, setShowAlert2] = useState(true);
	const [showAlert3, setShowAlert3] = useState(true);
	const [showAlert4, setShowAlert4] = useState(true);
	const [showAlert5, setShowAlert5] = useState(true);
	const [showAlert6, setShowAlert6] = useState(true);
	const [showAlert7, setShowAlert7] = useState(true);
	const [showAlert8, setShowAlert8] = useState(true);

	return (
		<PageContainer>
			<PageTitle>Alert Bar</PageTitle>
			<PageDescription>
				Notification component for displaying alerts and messages with different
				severity levels
			</PageDescription>

			<ShowcaseSection>
				<SectionTitle>Variants</SectionTitle>

				<ComponentRow>
					<Label>Success Alert</Label>
					{showAlert1 && (
						<ApAlertBar
							status={"success" as AlertBarStatus}
							onCancel={() => setShowAlert1(false)}
						>
							Operation completed successfully!
						</ApAlertBar>
					)}
					{!showAlert1 && (
						<button
							type="button"
							onClick={() => setShowAlert1(true)}
							style={{ padding: "8px 16px" }}
						>
							Show Alert
						</button>
					)}
				</ComponentRow>

				<ComponentRow>
					<Label>Error Alert</Label>
					{showAlert2 && (
						<ApAlertBar
							status={"error" as AlertBarStatus}
							onCancel={() => setShowAlert2(false)}
						>
							An error occurred. Please try again.
						</ApAlertBar>
					)}
					{!showAlert2 && (
						<button
							type="button"
							onClick={() => setShowAlert2(true)}
							style={{ padding: "8px 16px" }}
						>
							Show Alert
						</button>
					)}
				</ComponentRow>

				<ComponentRow>
					<Label>Warning Alert</Label>
					{showAlert3 && (
						<ApAlertBar
							status={"warning" as AlertBarStatus}
							onCancel={() => setShowAlert3(false)}
						>
							This action cannot be undone.
						</ApAlertBar>
					)}
					{!showAlert3 && (
						<button
							type="button"
							onClick={() => setShowAlert3(true)}
							style={{ padding: "8px 16px" }}
						>
							Show Alert
						</button>
					)}
				</ComponentRow>

				<ComponentRow>
					<Label>Info Alert</Label>
					{showAlert4 && (
						<ApAlertBar
							status={"info" as AlertBarStatus}
							onCancel={() => setShowAlert4(false)}
						>
							Here&apos;s some helpful information for you.
						</ApAlertBar>
					)}
					{!showAlert4 && (
						<button
							type="button"
							onClick={() => setShowAlert4(true)}
							style={{ padding: "8px 16px" }}
						>
							Show Alert
						</button>
					)}
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Long Text</SectionTitle>

				<ComponentRow>
					<Label>Success with long message</Label>
					{showAlert5 && (
						<ApAlertBar
							status={"success" as AlertBarStatus}
							onCancel={() => setShowAlert5(false)}
						>
							Your operation has been completed successfully! All validation
							checks have passed, the data has been saved to the database, and
							notifications have been sent to all relevant team members. You can
							now proceed to the next step in your workflow.
						</ApAlertBar>
					)}
					{!showAlert5 && (
						<button
							type="button"
							onClick={() => setShowAlert5(true)}
							style={{ padding: "8px 16px" }}
						>
							Show Alert
						</button>
					)}
				</ComponentRow>

				<ComponentRow>
					<Label>Error with detailed explanation</Label>
					{showAlert6 && (
						<ApAlertBar
							status={"error" as AlertBarStatus}
							onCancel={() => setShowAlert6(false)}
						>
							An error occurred while processing your request. The server
							returned status code 500 indicating an internal server error. This
							could be due to a temporary issue with the backend service. Please
							wait a few moments and try again. If the problem persists, contact
							support with error reference #ERR-2024-12345.
						</ApAlertBar>
					)}
					{!showAlert6 && (
						<button
							type="button"
							onClick={() => setShowAlert6(true)}
							style={{ padding: "8px 16px" }}
						>
							Show Alert
						</button>
					)}
				</ComponentRow>

				<ComponentRow>
					<Label>Warning with multiple sentences</Label>
					{showAlert7 && (
						<ApAlertBar
							status={"warning" as AlertBarStatus}
							onCancel={() => setShowAlert7(false)}
						>
							This action will permanently delete all associated data and cannot
							be undone. Please review your selection carefully before
							proceeding. Make sure you have created a backup if needed. All
							related records, attachments, and metadata will be removed from
							the system immediately.
						</ApAlertBar>
					)}
					{!showAlert7 && (
						<button
							type="button"
							onClick={() => setShowAlert7(true)}
							style={{ padding: "8px 16px" }}
						>
							Show Alert
						</button>
					)}
				</ComponentRow>

				<ComponentRow>
					<Label>Info with comprehensive details</Label>
					{showAlert8 && (
						<ApAlertBar
							status={"info" as AlertBarStatus}
							onCancel={() => setShowAlert8(false)}
						>
							We&apos;ve recently updated our privacy policy and terms of
							service to comply with new data protection regulations. The
							changes include enhanced security measures, improved data handling
							procedures, and more transparent information about how we collect
							and use your data. Please take a moment to review these updates at
							your earliest convenience. You can find the full documentation in
							the legal section of our website.
						</ApAlertBar>
					)}
					{!showAlert8 && (
						<button
							type="button"
							onClick={() => setShowAlert8(true)}
							style={{ padding: "8px 16px" }}
						>
							Show Alert
						</button>
					)}
				</ComponentRow>
			</ShowcaseSection>
		</PageContainer>
	);
}
