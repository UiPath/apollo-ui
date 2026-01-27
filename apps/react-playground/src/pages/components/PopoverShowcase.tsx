import {
	ApAccordion,
	ApButton,
	ApPopover,
} from "@uipath/apollo-react/material/components";
import styled from "styled-components";
import { CodeBlock } from "../../components/CodeBlock";

import {
	PageContainer,
	PageDescription,
	PageTitle,
} from "../../components/SharedStyles";
import { useState } from "react";

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

const defaultExampleCode = `
import { ApPopover, ApButton } from "@uipath/apollo-react/material/components";

export function Example() {
	const [anchorEl, setAnchorEl] =  React.useState<null | HTMLButtonElement>(null);

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const open = Boolean(anchorEl);

	return (
		<div>
			<ApButton 
				aria-describedby="simple-popover" 
				onClick={handleClick} 
				label="Show Popover"
				type="button" 
			/>

			<ApPopover
				anchorEl={anchorEl}
				open={open}
				id='simple-popover'
				onClose={handleClose}
				>
				<div style={{ padding: "16px", maxWidth: "200px" }}>
					This is a basic popover example positioned below and to the left
					of the anchor point.
				</div>
			</ApPopover>
		</div>
	);
}
	`;

const customPositioningCode = `
import { ApPopover, ApButton } from "@uipath/apollo-react/material/components";

export function Example() {
	const [anchorEl, setAnchorEl] =  React.useState<null | HTMLButtonElement>(null);

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const open = Boolean(anchorEl);

	return (
		<div>
			<ApButton
				aria-describedby="custom-popover"
				onClick={handleClick}
				label="Show Popover"
				type="button"
			/>

			<ApPopover
				anchorEl={anchorEl}
				open={open}
				id="custom-popover"
				onClose={handleClose}
				anchorOrigin={{ vertical: "top", horizontal: "right" }}
				transformOrigin={{ vertical: "bottom", horizontal: "left" }}
			>
				<div style={{ padding: "16px", maxWidth: "200px" }}>
					This popover is positioned above and to the right of the anchor
					point.
				</div>
			</ApPopover>
		</div>
	);
}
	`;

const positionOffsetsCode = `
import { ApPopover, ApButton } from "@uipath/apollo-react/material/components";

export function Example() {
	const [anchorEl, setAnchorEl] =  React.useState<null | HTMLButtonElement>(null);

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const open = Boolean(anchorEl);

	return (
		<div>
			<ApButton
				aria-describedby="offset-popover"
				onClick={() => setPopover3(true)}
				label="Show Popover"
				type="button"
			/>

			<ApPopover
				open={popover3}
				id="offset-popover"
				onClose={() => setPopover3(false)}
				anchorPosition={{ top: 20, left: 50 }}
			>
				<div style={{ padding: "16px", maxWidth: "200px" }}>
					This popover is offset by 20px vertically and 50px horizontally
					from application area.
				</div>
	);
}
	`;

export function PopoverShowcase() {
	const [anchorEl1, setAnchorEl1] = useState<null | HTMLButtonElement>(null);
	const [anchorEl2, setAnchorEl2] = useState<null | HTMLButtonElement>(null);
	const [popover3, setPopover3] = useState<boolean>(false);
	return (
		<PageContainer>
			<PageTitle>Popover</PageTitle>
			<PageDescription>
				Popovers are floating elements that display content when triggered by a
				user action. They provide contextual information or options, enhancing
				user interaction without navigating away from the current page.
			</PageDescription>

			<ShowcaseSection>
				<SectionTitle>Default</SectionTitle>
				<ComponentRow>
					<div>
						<ApButton
							aria-describedby="simple-popover"
							onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
								setAnchorEl1(e.currentTarget)
							}
							label="Show Popover"
							type="button"
						/>

						<ApPopover
							anchorEl={anchorEl1}
							open={Boolean(anchorEl1)}
							id="simple-popover"
							onClose={() => setAnchorEl1(null)}
						>
							<div style={{ padding: "16px", maxWidth: "200px" }}>
								This is a basic popover example positioned below and to the left
								of the anchor point.
							</div>
						</ApPopover>
					</div>
					<br />
					<Label>Code Example:</Label>
					<ApAccordion label="Default Component" disableDivider>
						<CodeBlock>{defaultExampleCode}</CodeBlock>
					</ApAccordion>
				</ComponentRow>

				<SectionTitle>Customization</SectionTitle>
				<ComponentRow>
					<Label> Anchor Position and Transform Origin</Label>
					<div>
						<ApButton
							aria-describedby="custom-popover"
							onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
								setAnchorEl2(e.currentTarget)
							}
							label="Show Popover"
							type="button"
						/>

						<ApPopover
							anchorEl={anchorEl2}
							open={Boolean(anchorEl2)}
							id="custom-popover"
							onClose={() => setAnchorEl2(null)}
							anchorOrigin={{ vertical: "top", horizontal: "right" }}
							transformOrigin={{ vertical: "bottom", horizontal: "left" }}
						>
							<div style={{ padding: "16px", maxWidth: "200px" }}>
								This popover is positioned above and to the right of the anchor
								point.
							</div>
						</ApPopover>
					</div>
					<br />

					<Label>Code Example:</Label>
					<ApAccordion label="Custom Positioning" disableDivider>
						<CodeBlock>{customPositioningCode}</CodeBlock>
					</ApAccordion>
				</ComponentRow>

				<ComponentRow>
					<Label> Popover Position Offsets</Label>
					<div>
						<ApButton
							aria-describedby="offset-popover"
							onClick={() => setPopover3(true)}
							label="Show Popover"
							type="button"
						/>

						<ApPopover
							open={popover3}
							id="offset-popover"
							onClose={() => setPopover3(false)}
							anchorPosition={{ top: 20, left: 50 }}
						>
							<div style={{ padding: "16px", maxWidth: "200px" }}>
								This popover is offset by 20px vertically and 50px horizontally
								from application area.
							</div>
						</ApPopover>
					</div>
					<br />

					<Label>Code Example:</Label>
					<ApAccordion label="Popover Position Offsets" disableDivider>
						<CodeBlock>{positionOffsetsCode}</CodeBlock>
					</ApAccordion>
				</ComponentRow>
			</ShowcaseSection>
		</PageContainer>
	);
}
