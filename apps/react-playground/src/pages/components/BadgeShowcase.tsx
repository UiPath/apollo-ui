import { ApBadge, StatusTypes } from "@uipath/apollo-react/material/components";
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
	flex-wrap: wrap;
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
	width: 100%;
	margin-bottom: 8px;
`;

export function BadgeShowcase() {
	return (
		<PageContainer>
			<PageTitle>Badge</PageTitle>
			<PageDescription>
				Small status indicators and labels for displaying metadata and status
				information
			</PageDescription>

			<ShowcaseSection>
				<SectionTitle>Status Types</SectionTitle>
				<ComponentRow>
					<Label>Different status variants</Label>
					<ApBadge label="Success" status={StatusTypes.SUCCESS} />
					<ApBadge label="Error" status={StatusTypes.ERROR} />
					<ApBadge label="Warning" status={StatusTypes.WARNING} />
					<ApBadge label="Info" status={StatusTypes.INFO} />
					<ApBadge label="Neutral" status={StatusTypes.NONE} />
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Labels</SectionTitle>
				<ComponentRow>
					<Label>Various label examples</Label>
					<ApBadge label="New" status={StatusTypes.INFO} />
					<ApBadge label="Beta" status={StatusTypes.WARNING} />
					<ApBadge label="Premium" status={StatusTypes.SUCCESS} />
					<ApBadge label="Deprecated" status={StatusTypes.ERROR} />
					<ApBadge label="Draft" status={StatusTypes.NONE} />
				</ComponentRow>
			</ShowcaseSection>
		</PageContainer>
	);
}
