import { ApProgressSpinner } from "@uipath/apollo-react/material/components";
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

const SpinnerItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  min-width: 100px;

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

const sizes = [
	{ size: "xs" as const, pixels: "12px" },
	{ size: "s" as const, pixels: "16px" },
	{ size: "m" as const, pixels: "24px" },
	{ size: "l" as const, pixels: "32px" },
	{ size: "xl" as const, pixels: "44px" },
	{ size: "xxl" as const, pixels: "72px" },
] as const;

const colors = [
	{ color: "primary" as const, label: "Primary" },
	{ color: "secondary" as const, label: "Secondary" },
	{ color: "success" as const, label: "Success" },
	{ color: "error" as const, label: "Error" },
	{ color: "warning" as const, label: "Warning" },
	{ color: "info" as const, label: "Info" },
	{ color: "inherit" as const, label: "Inherit" },
] as const;

export function ProgressSpinnerShowcase() {
	return (
		<PageContainer>
			<PageTitle>Progress Spinner</PageTitle>
			<PageDescription>
				A loading spinner with predefined sizes and color variants
			</PageDescription>

			<ShowcaseSection>
				<SectionTitle>Default (Medium, Primary)</SectionTitle>
				<ComponentRow>
					<ApProgressSpinner />
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Sizes</SectionTitle>
				<ComponentRow>
					{sizes.map(({ size, pixels }) => (
						<SpinnerItem key={size}>
							<ApProgressSpinner size={size} />
							<Label>
								{size} ({pixels})
							</Label>
						</SpinnerItem>
					))}
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Colors (Medium Size)</SectionTitle>
				<ComponentRow>
					{colors.map(({ color, label }) => (
						<SpinnerItem key={color}>
							<ApProgressSpinner size="m" color={color} />
							<Label>{label}</Label>
						</SpinnerItem>
					))}
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>All Combinations (Sample)</SectionTitle>
				<ComponentRow>
					<SpinnerItem>
						<ApProgressSpinner size="xs" color="primary" />
						<Label>XS Primary</Label>
					</SpinnerItem>
					<SpinnerItem>
						<ApProgressSpinner size="s" color="secondary" />
						<Label>S Secondary</Label>
					</SpinnerItem>
					<SpinnerItem>
						<ApProgressSpinner size="m" color="success" />
						<Label>M Success</Label>
					</SpinnerItem>
					<SpinnerItem>
						<ApProgressSpinner size="l" color="error" />
						<Label>L Error</Label>
					</SpinnerItem>
					<SpinnerItem>
						<ApProgressSpinner size="xl" color="warning" />
						<Label>XL Warning</Label>
					</SpinnerItem>
					<SpinnerItem>
						<ApProgressSpinner size="xxl" color="info" />
						<Label>XXL Info</Label>
					</SpinnerItem>
				</ComponentRow>
			</ShowcaseSection>
		</PageContainer>
	);
}
