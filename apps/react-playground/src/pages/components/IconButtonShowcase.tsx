import { ApIcon, ApIconButton } from "@uipath/apollo-react/material/components";
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
  align-items: center;
`;

const Label = styled.div`
  font-size: 14px;
  color: var(--color-foreground-de-emp);
  font-weight: 600;
  width: 100%;
  margin-bottom: 8px;
`;

export function IconButtonShowcase() {
	const [count, setCount] = useState(0);

	return (
		<PageContainer>
			<PageTitle>Icon Button</PageTitle>
			<PageDescription>
				Clickable icon buttons with various colors and sizes
			</PageDescription>

			<ShowcaseSection>
				<SectionTitle>Colors</SectionTitle>
				<ComponentRow>
					<Label>Primary</Label>
					<ApIconButton
						color="primary"
						label="Primary icon button"
						onClick={() => alert("Primary clicked!")}
					>
						<ApIcon name="favorite" />
					</ApIconButton>

					<Label>Secondary</Label>
					<ApIconButton
						color="secondary"
						label="Secondary icon button"
						onClick={() => alert("Secondary clicked!")}
					>
						<ApIcon name="star" />
					</ApIconButton>

					<Label>Success</Label>
					<ApIconButton
						color="success"
						label="Success icon button"
						onClick={() => alert("Success clicked!")}
					>
						<ApIcon name="check_circle" />
					</ApIconButton>

					<Label>Error</Label>
					<ApIconButton
						color="error"
						label="Error icon button"
						onClick={() => alert("Error clicked!")}
					>
						<ApIcon name="error" />
					</ApIconButton>

					<Label>Warning</Label>
					<ApIconButton
						color="warning"
						label="Warning icon button"
						onClick={() => alert("Warning clicked!")}
					>
						<ApIcon name="warning" />
					</ApIconButton>

					<Label>Info</Label>
					<ApIconButton
						color="info"
						label="Info icon button"
						onClick={() => alert("Info clicked!")}
					>
						<ApIcon name="info" />
					</ApIconButton>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Sizes</SectionTitle>
				<ComponentRow>
					<Label>Small</Label>
					<ApIconButton
						size="small"
						label="Small icon button"
						onClick={() => alert("Small clicked!")}
					>
						<ApIcon name="settings" size="16px" />
					</ApIconButton>

					<Label>Medium (default)</Label>
					<ApIconButton
						size="medium"
						label="Medium icon button"
						onClick={() => alert("Medium clicked!")}
					>
						<ApIcon name="settings" size="20px" />
					</ApIconButton>

					<Label>Large</Label>
					<ApIconButton
						size="large"
						label="Large icon button"
						onClick={() => alert("Large clicked!")}
					>
						<ApIcon name="settings" size="24px" />
					</ApIconButton>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>States</SectionTitle>
				<ComponentRow>
					<Label>Default</Label>
					<ApIconButton
						label="Default icon button"
						onClick={() => alert("Default clicked!")}
					>
						<ApIcon name="add" />
					</ApIconButton>

					<Label>Disabled</Label>
					<ApIconButton disabled label="Disabled icon button">
						<ApIcon name="add" />
					</ApIconButton>

					<Label>Interactive Counter</Label>
					<ApIconButton
						label="Increment counter"
						onClick={() => setCount(count + 1)}
					>
						<ApIcon name="add" />
					</ApIconButton>
					<span
						style={{
							color: "var(--color-foreground-emp)",
							fontSize: "16px",
							fontWeight: "bold",
						}}
					>
						{count}
					</span>
					<ApIconButton
						label="Decrement counter"
						onClick={() => setCount(count - 1)}
					>
						<ApIcon name="remove" />
					</ApIconButton>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Common Use Cases</SectionTitle>
				<ComponentRow>
					<Label>Navigation</Label>
					<ApIconButton label="Go back" onClick={() => alert("Back!")}>
						<ApIcon name="arrow_back" />
					</ApIconButton>
					<ApIconButton label="Go forward" onClick={() => alert("Forward!")}>
						<ApIcon name="arrow_forward" />
					</ApIconButton>

					<Label>Actions</Label>
					<ApIconButton label="Edit" onClick={() => alert("Edit!")}>
						<ApIcon name="edit" />
					</ApIconButton>
					<ApIconButton label="Delete" onClick={() => alert("Delete!")}>
						<ApIcon name="delete" />
					</ApIconButton>
					<ApIconButton label="Save" onClick={() => alert("Save!")}>
						<ApIcon name="save" />
					</ApIconButton>

					<Label>Menu</Label>
					<ApIconButton label="Open menu" onClick={() => alert("Menu!")}>
						<ApIcon name="menu" />
					</ApIconButton>
					<ApIconButton label="More options" onClick={() => alert("More!")}>
						<ApIcon name="more_vert" />
					</ApIconButton>

					<Label>Visibility Toggle</Label>
					<ApIconButton
						label="Toggle visibility"
						onClick={() => alert("Toggle!")}
					>
						<ApIcon name="visibility" />
					</ApIconButton>
					<ApIconButton
						label="Toggle visibility off"
						onClick={() => alert("Toggle off!")}
					>
						<ApIcon name="visibility_off" />
					</ApIconButton>
				</ComponentRow>
			</ShowcaseSection>
		</PageContainer>
	);
}
