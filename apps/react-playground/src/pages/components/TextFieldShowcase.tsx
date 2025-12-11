import { ApTextField } from "@uipath/apollo-react/material/components";
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

export function TextFieldShowcase() {
	const [value1, setValue1] = useState("");
	const [value2, setValue2] = useState("");
	const [value3, setValue3] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	return (
		<PageContainer>
			<PageTitle>Text Field</PageTitle>
			<PageDescription>
				Single-line text input component with various configurations
			</PageDescription>

			<ShowcaseSection>
				<SectionTitle>Basic Text Fields</SectionTitle>
				<ComponentRow>
					<Label>Standard text field</Label>
					<ApTextField
						value={value1}
						onChange={setValue1}
						placeholder="Enter text..."
					/>
				</ComponentRow>

				<ComponentRow>
					<Label>With label</Label>
					<ApTextField
						label="Username"
						value={value2}
						onChange={setValue2}
						placeholder="Enter your username"
					/>
				</ComponentRow>

				<ComponentRow>
					<Label>With helper text</Label>
					<ApTextField
						label="Full Name"
						value={value3}
						onChange={setValue3}
						placeholder="John Doe"
						helperText="Enter your first and last name"
					/>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Input Types</SectionTitle>
				<ComponentRow>
					<Label>Email input</Label>
					<ApTextField
						type="email"
						label="Email"
						value={email}
						onChange={setEmail}
						placeholder="you@example.com"
					/>
				</ComponentRow>

				<ComponentRow>
					<Label>Password input</Label>
					<ApTextField
						type="password"
						label="Password"
						value={password}
						onChange={setPassword}
						placeholder="Enter your password"
					/>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>States</SectionTitle>
				<ComponentRow>
					<Label>Disabled state</Label>
					<ApTextField
						label="Disabled Field"
						value="This field is disabled"
						disabled
					/>
				</ComponentRow>

				<ComponentRow>
					<Label>Read-only state</Label>
					<ApTextField
						label="Read Only Field"
						value="This field is read-only"
						readOnly
						readOnlyTooltip="This field cannot be edited"
					/>
				</ComponentRow>

				<ComponentRow>
					<Label>Error state</Label>
					<ApTextField
						label="Required Field"
						value=""
						placeholder="This field is required"
						errorMessage="This field cannot be empty"
					/>
				</ComponentRow>

				<ComponentRow>
					<Label>Required field</Label>
					<ApTextField
						label="Required Input"
						required
						value=""
						placeholder="This field is required"
					/>
				</ComponentRow>
			</ShowcaseSection>
		</PageContainer>
	);
}
