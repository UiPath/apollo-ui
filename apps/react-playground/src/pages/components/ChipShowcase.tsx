import { ApChip } from "@uipath/apollo-react/material/components";
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

export function ChipShowcase() {
	const [chips, setChips] = useState([
		{ id: 1, label: "React", active: true },
		{ id: 2, label: "TypeScript", active: true },
		{ id: 3, label: "Node.js", active: true },
		{ id: 4, label: "Python", active: true },
	]);

	const handleDelete = (id: number) => {
		setChips(chips.filter((chip) => chip.id !== id));
	};

	const handleClick = (id: number) => {
		setChips(
			chips.map((chip) =>
				chip.id === id ? { ...chip, active: !chip.active } : chip,
			),
		);
	};

	return (
		<PageContainer>
			<PageTitle>Chip</PageTitle>
			<PageDescription>
				Compact elements for tags, filters, and selections
			</PageDescription>

			<ShowcaseSection>
				<SectionTitle>Basic Chips</SectionTitle>
				<ComponentRow>
					<Label>Simple chip labels</Label>
					<ApChip label="JavaScript" />
					<ApChip label="CSS" />
					<ApChip label="HTML" />
					<ApChip label="GraphQL" />
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Interactive Chips</SectionTitle>
				<ComponentRow>
					<Label>Clickable and deletable chips</Label>
					{chips.map((chip) => (
						<ApChip
							key={chip.id}
							label={chip.label}
							onClick={() => handleClick(chip.id)}
							onDelete={() => handleDelete(chip.id)}
							color={chip.active ? "primary" : "default"}
						/>
					))}
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Loading Chips</SectionTitle>
				<ComponentRow>
					<Label>Simple loading chips</Label>
					<ApChip label="JavaScript" loading onDelete={() => {}} />
					<ApChip label="CSS" loading onDelete={() => {}} />
					<ApChip label="HTML" loading onDelete={() => {}} />
					<ApChip label="GraphQL" loading onDelete={() => {}} />
				</ComponentRow>
			</ShowcaseSection>
		</PageContainer>
	);
}
