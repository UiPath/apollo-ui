import { ApCircularProgress } from "@uipath/apollo-react/material/components";
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
  align-items: center;
`;

const ProgressItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  min-width: 120px;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);
  }
`;

const Label = styled.div`
  font-size: 12px;
  color: var(--color-foreground-de-emp);
  font-weight: 600;
  text-align: center;
`;

const sizes = [16, 24, 32, 48, 64, 96] as const;

export function CircularProgressShowcase() {
	return (
		<PageContainer>
			<PageTitle>Circular Progress</PageTitle>
			<PageDescription>
				A circular loading indicator with customizable size and color
			</PageDescription>

			<ShowcaseSection>
				<SectionTitle>Default (Primary Color)</SectionTitle>
				<ComponentRow>
					<ApCircularProgress />
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Sizes</SectionTitle>
				<ComponentRow>
					{sizes.map((size) => (
						<ProgressItem key={size}>
							<ApCircularProgress size={size} />
							<Label>{size}px</Label>
						</ProgressItem>
					))}
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Custom Colors</SectionTitle>
				<ComponentRow>
					<ProgressItem>
						<ApCircularProgress color="var(--color-primary)" />
						<Label>Primary</Label>
					</ProgressItem>
					<ProgressItem>
						<ApCircularProgress color="var(--color-brand-primary)" />
						<Label>Brand Orange</Label>
					</ProgressItem>
					<ProgressItem>
						<ApCircularProgress color="var(--color-secondary)" />
						<Label>Purple</Label>
					</ProgressItem>
					<ProgressItem>
						<ApCircularProgress color="#00ff00" />
						<Label>Green</Label>
					</ProgressItem>
				</ComponentRow>
			</ShowcaseSection>
		</PageContainer>
	);
}
