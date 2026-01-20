import { ApAccordion } from "@uipath/apollo-react/material/components";
import styled from "styled-components";
import { Search } from "@uipath/apollo-react/icons";

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

const AccordionContent = styled.div`
	font-size: 14px;
	color: var(--color-foreground-de-emp);
	padding: 10px 40px 10px 40px;
	box-sizing: border-box;
`;

export function AccordionShowcase() {
	return (
		<PageContainer>
			<PageTitle>Accordion</PageTitle>
			<PageDescription>
				Accordions allow users to expand and collapse sections of content,
				helping to manage large amounts of information in a compact space.
			</PageDescription>

			<ShowcaseSection>
				<SectionTitle>Default</SectionTitle>
				<ComponentRow>
					<div style={{ width: "284px" }}>
						<ApAccordion label="Accordion Title">
							<AccordionContent tabIndex={0}>Child</AccordionContent>
							<AccordionContent tabIndex={0}>Child</AccordionContent>
							<AccordionContent tabIndex={0}>Child</AccordionContent>
							<AccordionContent tabIndex={0}>Child</AccordionContent>
						</ApAccordion>
						<ApAccordion label="Accordion Title" defaultExpanded>
							<AccordionContent tabIndex={0}>Child</AccordionContent>
							<AccordionContent tabIndex={0}>Child</AccordionContent>
							<AccordionContent tabIndex={0}>Child</AccordionContent>
						</ApAccordion>
						<ApAccordion label="Accordion Title">
							<AccordionContent tabIndex={0}>Child</AccordionContent>
							<AccordionContent tabIndex={0}>Child</AccordionContent>
							<AccordionContent tabIndex={0}>Child</AccordionContent>
						</ApAccordion>
						<ApAccordion label="Accordion Title">
							<AccordionContent tabIndex={0}>Child</AccordionContent>
							<AccordionContent tabIndex={0}>Child</AccordionContent>
							<AccordionContent tabIndex={0}>Child</AccordionContent>
						</ApAccordion>
						<ApAccordion label="Accordion Title">
							<AccordionContent tabIndex={0}>Child</AccordionContent>
							<AccordionContent tabIndex={0}>Child</AccordionContent>
							<AccordionContent tabIndex={0}>Child</AccordionContent>
						</ApAccordion>
					</div>
				</ComponentRow>

				<ComponentRow>
					<div style={{ width: "284px" }}>
						<ApAccordion label="Accordion Title">
							<AccordionContent tabIndex={0}>Test</AccordionContent>
							<AccordionContent tabIndex={0}>Child</AccordionContent>
							<AccordionContent tabIndex={0}>Child</AccordionContent>
							<AccordionContent tabIndex={0}>Child</AccordionContent>
						</ApAccordion>
					</div>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Icon Customization</SectionTitle>
				<ComponentRow>
					<Label> Custom Start Icon</Label>
					<ApAccordion
						label="Accordion Title"
						startIcon={<Search size="20px" />}
						disableDivider
					>
						<AccordionContent tabIndex={0}>
							This is the content inside the accordion. It can include text,
							images, or any other elements.
						</AccordionContent>
					</ApAccordion>
					<ApAccordion
						label="Accordion Title"
						startIcon={<Search size="20px" />}
					>
						<AccordionContent tabIndex={0}>
							This is the content inside the accordion. It can include text,
							images, or any other elements.
						</AccordionContent>
					</ApAccordion>
				</ComponentRow>
				<ComponentRow>
					<Label> Expand Icon Position: Start</Label>
					<ApAccordion
						label="Accordion Title"
						startIcon={<Search size="20px" />}
						expandIconPosition="start"
						disableDivider
					>
						<AccordionContent tabIndex={0}>
							This is the content inside the accordion. It can include text,
							images, or any other elements.
						</AccordionContent>
					</ApAccordion>
					<ApAccordion label="Accordion Title" expandIconPosition="start">
						<AccordionContent tabIndex={0}>
							This is the content inside the accordion. It can include text,
							images, or any other elements.
						</AccordionContent>
					</ApAccordion>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Customization</SectionTitle>
				<ComponentRow>
					<Label>Custom Font Size</Label>
					<ApAccordion
						label="Accordion Title"
						labelFontSize="20px"
						disableDivider
					>
						<AccordionContent tabIndex={0}>
							This is the content inside the accordion. It can include text,
							images, or any other elements.
						</AccordionContent>
					</ApAccordion>
					<ApAccordion label="Accordion Title" labelFontSize="20px">
						<AccordionContent tabIndex={0}>
							This is the content inside the accordion. It can include text,
							images, or any other elements.
						</AccordionContent>
					</ApAccordion>
				</ComponentRow>

				<ComponentRow>
					<Label>Custom Font Weight</Label>
					<ApAccordion
						label="Accordion Title"
						labelFontWeight="700"
						disableDivider
					>
						<AccordionContent tabIndex={0}>
							This is the content inside the accordion. It can include text,
							images, or any other elements.
						</AccordionContent>
					</ApAccordion>
					<ApAccordion label="Accordion Title" labelFontWeight="700">
						<AccordionContent tabIndex={0}>
							This is the content inside the accordion. It can include text,
							images, or any other elements.
						</AccordionContent>
					</ApAccordion>
				</ComponentRow>

				<ComponentRow>
					<Label>Custom Label Color</Label>
					<ApAccordion
						label="Accordion Title"
						labelColor="var(--color-primary)"
						disableDivider
					>
						<AccordionContent tabIndex={0}>
							This is the content inside the accordion. It can include text,
							images, or any other elements.
						</AccordionContent>
					</ApAccordion>
					<ApAccordion
						label="Accordion Title"
						labelColor="var(--color-primary)"
					>
						<AccordionContent tabIndex={0}>
							This is the content inside the accordion. It can include text,
							images, or any other elements.
						</AccordionContent>
					</ApAccordion>
				</ComponentRow>
			</ShowcaseSection>
		</PageContainer>
	);
}
