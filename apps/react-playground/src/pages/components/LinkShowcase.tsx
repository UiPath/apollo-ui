import { ApLink } from "@uipath/apollo-react/material/components";
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

export function LinkShowcase() {
	return (
		<PageContainer>
			<PageTitle>Link</PageTitle>
			<PageDescription>
				Styled hyperlink component with Apollo design tokens
			</PageDescription>

			<ShowcaseSection>
				<SectionTitle>Example</SectionTitle>
				<ComponentRow>
					<ApLink href="https://www.uipath.com" target="_blank">
						Visit UiPath
					</ApLink>
				</ComponentRow>
			</ShowcaseSection>
		</PageContainer>
	);
}
