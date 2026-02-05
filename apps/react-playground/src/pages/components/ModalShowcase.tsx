import { FontVariantToken } from "@uipath/apollo-react";
import {
	ApAccordion,
	ApButton,
	ApModal,
	ApTypography,
} from "@uipath/apollo-react/material/components";
import { useState } from "react";
import styled from "styled-components";
import { CodeBlock } from "../../components/CodeBlock";
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
	gap: 16px;
`;

const ButtonGroup = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
`;

const Label = styled.div`
	font-size: 14px;
	color: var(--color-foreground-de-emp);
	font-weight: 600;
	margin-bottom: 8px;
`;

const basicModalCode = `
import { ApModal, ApButton } from "@uipath/apollo-react/material/components";
import { useState } from "react";

export function Example() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<ApButton
				label="Open Modal"
				onClick={() => setOpen(true)}
			/>

			<ApModal
				open={open}
				onClose={() => setOpen(false)}
				header="Basic Modal"
				message="This is a basic modal with default configuration."
			/>
		</>
	);
}
`;

const withActionsCode = `
import { ApModal, ApButton } from "@uipath/apollo-react/material/components";
import { useState } from "react";

export function Example() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<ApButton
				label="Open Modal with Actions"
				onClick={() => setOpen(true)}
			/>

			<ApModal
				open={open}
				onClose={() => setOpen(false)}
				header="Modal with Actions"
				message="This modal includes primary and secondary action buttons."
				primaryAction={{
					label: "Confirm",
					onClick: () => console.log("Primary action clicked"),
				}}
				secondaryAction={{
					label: "Cancel",
					onClick: () => console.log("Secondary action clicked"),
				}}
			/>
		</>
	);
}
`;

const sizesCode = `
import { ApModal, ApButton } from "@uipath/apollo-react/material/components";
import { useState } from "react";

export function Example() {
	const [openSmall, setOpenSmall] = useState(false);
	const [openMedium, setOpenMedium] = useState(false);
	const [openLarge, setOpenLarge] = useState(false);

	return (
		<>
			<ApButton label="Small Modal" onClick={() => setOpenSmall(true)} />
			<ApButton label="Medium Modal" onClick={() => setOpenMedium(true)} />
			<ApButton label="Large Modal" onClick={() => setOpenLarge(true)} />

			<ApModal
				open={openSmall}
				onClose={() => setOpenSmall(false)}
				header="Small Modal"
				size="small"
				message="This is a small modal (480px width)."
			/>

			<ApModal
				open={openMedium}
				onClose={() => setOpenMedium(false)}
				header="Medium Modal"
				size="medium"
				message="This is a medium modal (600px width)."
			/>

			<ApModal
				open={openLarge}
				onClose={() => setOpenLarge(false)}
				header="Large Modal"
				size="large"
				message="This is a large modal (800px width)."
			/>
		</>
	);
}
`;

const loadingStateCode = `
import { ApModal, ApButton } from "@uipath/apollo-react/material/components";
import { useState } from "react";

export function Example() {
	const [open, setOpen] = useState(false);
	const [primaryLoading, setPrimaryLoading] = useState(false);
	const [secondaryLoading, setSecondaryLoading] = useState(false);

	const handlePrimary = () => {
		setPrimaryLoading(true);
		// Simulate async operation
		setTimeout(() => {
			setPrimaryLoading(false);
			setOpen(false);
			alert("Saved!");
		}, 2000);
	};

	const handleSecondary = () => {
		setSecondaryLoading(true);
		setTimeout(() => {
			setSecondaryLoading(false);
			setOpen(false);
		}, 1500);
	};

	return (
		<>
			<ApButton
				label="Open Modal"
				onClick={() => setOpen(true)}
			/>

			<ApModal
				open={open}
				onClose={() => setOpen(false)}
				header="Loading State Example"
				message="Click a button to see loading states."
				primaryAction={{
					label: "Save",
					onClick: handlePrimary,
					loading: primaryLoading,
				}}
				secondaryAction={{
					label: "Cancel",
					onClick: handleSecondary,
					loading: secondaryLoading,
				}}
			/>
		</>
	);
}
`;

const disabledStateCode = `
import { ApModal, ApButton } from "@uipath/apollo-react/material/components";
import { useState } from "react";

export function Example() {
	const [primaryDisabledOpen, setPrimaryDisabledOpen] = useState(false);
	const [secondaryDisabledOpen, setSecondaryDisabledOpen] = useState(false);

	return (
		<>
			{/* Primary button disabled */}
			<ApButton
				label="Disabled Primary Button"
				onClick={() => setPrimaryDisabledOpen(true)}
			/>
			<ApModal
				open={primaryDisabledOpen}
				onClose={() => setPrimaryDisabledOpen(false)}
				header="Disabled Primary Action"
				message="The primary action button is disabled. This is common when form validation fails or required conditions aren't met."
				primaryAction={{
					label: "Submit",
					onClick: () => setPrimaryDisabledOpen(false),
					disabled: true,
				}}
				secondaryAction={{
					label: "Cancel",
					onClick: () => setPrimaryDisabledOpen(false),
				}}
			/>

			{/* Secondary button disabled */}
			<ApButton
				label="Disabled Secondary Button"
				onClick={() => setSecondaryDisabledOpen(true)}
			/>
			<ApModal
				open={secondaryDisabledOpen}
				onClose={() => setSecondaryDisabledOpen(false)}
				header="Disabled Secondary Action"
				message="The secondary action button is disabled. This can be used to enforce a specific workflow or prevent cancellation."
				primaryAction={{
					label: "Confirm",
					onClick: () => setSecondaryDisabledOpen(false),
				}}
				secondaryAction={{
					label: "Cancel",
					onClick: () => setSecondaryDisabledOpen(false),
					disabled: true,
				}}
			/>
		</>
	);
}
`;

const customContentCode = `
import { ApModal, ApButton, ApTypography } from "@uipath/apollo-react/material/components";
import { useState } from "react";
import { FontVariantToken } from "@uipath/apollo-react";

export function Example() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<ApButton
				label="Open Modal with Custom Content"
				onClick={() => setOpen(true)}
			/>

			<ApModal
				open={open}
				onClose={() => setOpen(false)}
				header="Custom Content Modal"
			>
				<div>
					<ApTypography variant={FontVariantToken.fontSizeH5Bold}>
						Custom Heading
					</ApTypography>
					<ApTypography variant={FontVariantToken.fontSizeM}>
						This modal contains custom React content instead of a simple message.
						You can add any components, forms, or interactive elements here.
					</ApTypography>
				</div>
			</ApModal>
		</>
	);
}
`;

const preventCloseCode = `
import { ApModal, ApButton } from "@uipath/apollo-react/material/components";
import { useState } from "react";

export function Example() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<ApButton
				label="Open Non-Dismissible Modal"
				onClick={() => setOpen(true)}
			/>

			<ApModal
				open={open}
				onClose={() => setOpen(false)}
				header="Non-Dismissible Modal"
				message="This modal cannot be dismissed by clicking outside or pressing ESC. You must use the action button to close it."
				preventClose
				primaryAction={{
					label: "Close",
					onClick: () => setOpen(false),
				}}
			/>
		</>
	);
}
`;

const hideCloseButtonCode = `
import { ApModal, ApButton } from "@uipath/apollo-react/material/components";
import { useState } from "react";

export function Example() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<ApButton
				label="Open Modal without Close Button"
				onClick={() => setOpen(true)}
			/>

			<ApModal
				open={open}
				onClose={() => setOpen(false)}
				header="No Close Button"
				message="This modal doesn't have a close button. You can click outside or use the action button."
				hideCloseButton
				primaryAction={{
					label: "Close",
					onClick: () => setOpen(false),
				}}
			/>
		</>
	);
}
`;

export function ModalShowcase() {
	const [basicOpen, setBasicOpen] = useState(false);
	const [withActionsOpen, setWithActionsOpen] = useState(false);
	const [loadingStateOpen, setLoadingStateOpen] = useState(false);
	const [primaryLoading, setPrimaryLoading] = useState(false);
	const [secondaryLoading, setSecondaryLoading] = useState(false);
	const [primaryDisabledOpen, setPrimaryDisabledOpen] = useState(false);
	const [secondaryDisabledOpen, setSecondaryDisabledOpen] = useState(false);
	const [smallOpen, setSmallOpen] = useState(false);
	const [mediumOpen, setMediumOpen] = useState(false);
	const [largeOpen, setLargeOpen] = useState(false);
	const [customContentOpen, setCustomContentOpen] = useState(false);
	const [preventCloseOpen, setPreventCloseOpen] = useState(false);
	const [noCloseButtonOpen, setNoCloseButtonOpen] = useState(false);

	const handlePrimaryAction = () => {
		setPrimaryLoading(true);
		// Simulate async operation (e.g., API call)
		setTimeout(() => {
			setPrimaryLoading(false);
			setLoadingStateOpen(false);
			alert("Operation completed successfully!");
		}, 2000);
	};

	const handleSecondaryAction = () => {
		setSecondaryLoading(true);
		// Simulate async operation
		setTimeout(() => {
			setSecondaryLoading(false);
			setLoadingStateOpen(false);
		}, 1500);
	};

	return (
		<PageContainer>
			<PageTitle>Modal</PageTitle>
			<PageDescription>
				A centered overlay dialog that displays content above the main page,
				requiring user interaction before returning to the main workflow. Modals
				are used for critical information, confirmations, or form inputs.
			</PageDescription>

			<ShowcaseSection>
				<SectionTitle>Basic Modal</SectionTitle>
				<ComponentRow>
					<Label>Default modal with header and message</Label>
					<ButtonGroup>
						<ApButton
							label="Open Basic Modal"
							onClick={() => setBasicOpen(true)}
						/>
					</ButtonGroup>

					<ApModal
						open={basicOpen}
						onClose={() => setBasicOpen(false)}
						header="Basic Modal"
						message="This is a basic modal with default configuration. Click the close button, press ESC, or click outside to dismiss."
					/>

					<Label>Code Example:</Label>
					<ApAccordion label="Basic Modal" disableDivider>
						<CodeBlock>{basicModalCode}</CodeBlock>
					</ApAccordion>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>With Actions</SectionTitle>
				<ComponentRow>
					<Label>Modal with primary and secondary action buttons</Label>
					<ButtonGroup>
						<ApButton
							label="Open Modal with Actions"
							onClick={() => setWithActionsOpen(true)}
						/>
					</ButtonGroup>

					<ApModal
						open={withActionsOpen}
						onClose={() => setWithActionsOpen(false)}
						header="Modal with Actions"
						message="This modal includes action buttons at the bottom. The primary action confirms the operation, while the secondary action cancels."
						primaryAction={{
							label: "Confirm",
							onClick: () => {
								alert("Primary action clicked");
								setWithActionsOpen(false);
							},
						}}
						secondaryAction={{
							label: "Cancel",
							onClick: () => {
								alert("Secondary action clicked");
								setWithActionsOpen(false);
							},
						}}
					/>

					<Label>Code Example:</Label>
					<ApAccordion label="With Actions" disableDivider>
						<CodeBlock>{withActionsCode}</CodeBlock>
					</ApAccordion>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Loading States</SectionTitle>
				<ComponentRow>
					<Label>Action buttons with loading states for async operations</Label>
					<ButtonGroup>
						<ApButton
							label="Open Modal with Loading States"
							onClick={() => setLoadingStateOpen(true)}
						/>
					</ButtonGroup>

					<ApModal
						open={loadingStateOpen}
						onClose={() => setLoadingStateOpen(false)}
						header="Loading State Example"
						message="Click an action button to see the loading state in action. The parent component controls the loading state and modal closure."
						primaryAction={{
							label: "Save",
							onClick: handlePrimaryAction,
							loading: primaryLoading,
						}}
						secondaryAction={{
							label: "Cancel",
							onClick: handleSecondaryAction,
							loading: secondaryLoading,
						}}
					/>

					<Label>Code Example:</Label>
					<ApAccordion label="Loading States" disableDivider>
						<CodeBlock>{loadingStateCode}</CodeBlock>
					</ApAccordion>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Disabled States</SectionTitle>
				<ComponentRow>
					<Label>
						Action buttons can be disabled to prevent user interaction based on
						conditions (e.g., form validation, permissions, workflow
						enforcement)
					</Label>
					<ButtonGroup>
						<ApButton
							label="Disabled Primary Button"
							onClick={() => setPrimaryDisabledOpen(true)}
						/>
						<ApButton
							label="Disabled Secondary Button"
							onClick={() => setSecondaryDisabledOpen(true)}
						/>
					</ButtonGroup>

					<ApModal
						open={primaryDisabledOpen}
						onClose={() => setPrimaryDisabledOpen(false)}
						header="Disabled Primary Action"
						message="The primary action button is disabled. This is common when form validation fails or required conditions aren't met."
						primaryAction={{
							label: "Submit",
							onClick: () => setPrimaryDisabledOpen(false),
							disabled: true,
						}}
						secondaryAction={{
							label: "Cancel",
							onClick: () => setPrimaryDisabledOpen(false),
						}}
					/>

					<ApModal
						open={secondaryDisabledOpen}
						onClose={() => setSecondaryDisabledOpen(false)}
						header="Disabled Secondary Action"
						message="The secondary action button is disabled. This can be used to enforce a specific workflow or prevent cancellation."
						primaryAction={{
							label: "Confirm",
							onClick: () => setSecondaryDisabledOpen(false),
						}}
						secondaryAction={{
							label: "Cancel",
							onClick: () => setSecondaryDisabledOpen(false),
							disabled: true,
						}}
					/>

					<Label>Code Example:</Label>
					<ApAccordion label="Disabled States" disableDivider>
						<CodeBlock>{disabledStateCode}</CodeBlock>
					</ApAccordion>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Modal Sizes</SectionTitle>
				<ComponentRow>
					<Label>
						Different modal widths: small (480px), medium (600px), large (800px)
					</Label>
					<ButtonGroup>
						<ApButton label="Small Modal" onClick={() => setSmallOpen(true)} />
						<ApButton
							label="Medium Modal"
							onClick={() => setMediumOpen(true)}
						/>
						<ApButton label="Large Modal" onClick={() => setLargeOpen(true)} />
					</ButtonGroup>

					<ApModal
						open={smallOpen}
						onClose={() => setSmallOpen(false)}
						header="Small Modal"
						size="small"
						message="This is a small modal with 480px width."
					/>

					<ApModal
						open={mediumOpen}
						onClose={() => setMediumOpen(false)}
						header="Medium Modal"
						size="medium"
						message="This is a medium modal with 600px width."
					/>

					<ApModal
						open={largeOpen}
						onClose={() => setLargeOpen(false)}
						header="Large Modal"
						size="large"
						message="This is a large modal with 800px width."
					/>

					<Label>Code Example:</Label>
					<ApAccordion label="Modal Sizes" disableDivider>
						<CodeBlock>{sizesCode}</CodeBlock>
					</ApAccordion>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Custom Content</SectionTitle>
				<ComponentRow>
					<Label>Modal with custom React content instead of a message</Label>
					<ButtonGroup>
						<ApButton
							label="Open Modal with Custom Content"
							onClick={() => setCustomContentOpen(true)}
						/>
					</ButtonGroup>

					<ApModal
						open={customContentOpen}
						onClose={() => setCustomContentOpen(false)}
						header="Custom Content Modal"
					>
						<div
							style={{ display: "flex", flexDirection: "column", gap: "16px" }}
						>
							<ApTypography variant={FontVariantToken.fontSizeH4Bold}>
								Custom Heading
							</ApTypography>
							<ApTypography variant={FontVariantToken.fontSizeM}>
								This modal contains custom React content instead of a simple
								message. You can add any components, forms, or interactive
								elements here.
							</ApTypography>
							<ApTypography variant={FontVariantToken.fontSizeS}>
								The modal provides a flexible container for complex UI patterns
								while maintaining consistent styling and behavior.
							</ApTypography>
						</div>
					</ApModal>

					<Label>Code Example:</Label>
					<ApAccordion label="Custom Content" disableDivider>
						<CodeBlock>{customContentCode}</CodeBlock>
					</ApAccordion>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Prevent Close</SectionTitle>
				<ComponentRow>
					<Label>
						Modal that cannot be closed by clicking outside or pressing ESC
						(must use action buttons)
					</Label>
					<ButtonGroup>
						<ApButton
							label="Open Non-Dismissible Modal"
							onClick={() => setPreventCloseOpen(true)}
						/>
					</ButtonGroup>

					<ApModal
						open={preventCloseOpen}
						onClose={() => setPreventCloseOpen(false)}
						header="Non-Dismissible Modal"
						message="This modal cannot be dismissed by clicking outside or pressing ESC. You must use the action buttons to close it."
						preventClose
						primaryAction={{
							label: "Close",
							onClick: () => setPreventCloseOpen(false),
						}}
					/>

					<Label>Code Example:</Label>
					<ApAccordion label="Prevent Close" disableDivider>
						<CodeBlock>{preventCloseCode}</CodeBlock>
					</ApAccordion>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Hide Close Button</SectionTitle>
				<ComponentRow>
					<Label>
						Modal without close button (relies on actions or backdrop)
					</Label>
					<ButtonGroup>
						<ApButton
							label="Open Modal without Close Button"
							onClick={() => setNoCloseButtonOpen(true)}
						/>
					</ButtonGroup>

					<ApModal
						open={noCloseButtonOpen}
						onClose={() => setNoCloseButtonOpen(false)}
						header="No Close Button"
						message="This modal doesn't have a close button in the corner. You can click outside or use the action button below."
						hideCloseButton
						primaryAction={{
							label: "Close",
							onClick: () => setNoCloseButtonOpen(false),
						}}
					/>

					<Label>Code Example:</Label>
					<ApAccordion label="Hide Close Button" disableDivider>
						<CodeBlock>{hideCloseButtonCode}</CodeBlock>
					</ApAccordion>
				</ComponentRow>
			</ShowcaseSection>
		</PageContainer>
	);
}
