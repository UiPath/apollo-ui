import { TextField } from "@mui/material";
import { useState } from "react";
import {
	PageContainer,
	PageDescription,
	PageTitle,
	SectionDescription,
	SectionHeader,
} from "../../components/SharedStyles";
import { TextFieldGrid, VariantSection } from "./MaterialTextField.styles";

export function MaterialTextField() {
	const [value, setValue] = useState("");

	return (
		<PageContainer>
			<PageTitle>Text Field</PageTitle>
			<PageDescription>
				Material UI TextField component with Apollo theme overrides. Includes
				customized borders, focus states, labels, and helper text styling.
			</PageDescription>

			<VariantSection>
				<SectionHeader>Outlined Variant</SectionHeader>
				<SectionDescription>
					Standard outlined text fields with Apollo border and focus styling.
				</SectionDescription>
				<TextFieldGrid>
					<TextField
						label="Default"
						variant="outlined"
						placeholder="Enter text..."
					/>
					<TextField
						label="With Value"
						variant="outlined"
						value={value}
						onChange={(e) => setValue(e.target.value)}
					/>
					<TextField label="Disabled" variant="outlined" disabled />
					<TextField
						label="Error State"
						variant="outlined"
						error
						helperText="This field has an error"
					/>
				</TextFieldGrid>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Filled Variant</SectionHeader>
				<SectionDescription>
					Filled text fields with background color and subtle borders.
				</SectionDescription>
				<TextFieldGrid>
					<TextField
						label="Default"
						variant="filled"
						placeholder="Enter text..."
					/>
					<TextField label="Disabled" variant="filled" disabled />
					<TextField
						label="Error State"
						variant="filled"
						error
						helperText="This field has an error"
					/>
				</TextFieldGrid>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Standard Variant</SectionHeader>
				<SectionDescription>
					Standard text fields with bottom border only.
				</SectionDescription>
				<TextFieldGrid>
					<TextField
						label="Default"
						variant="standard"
						placeholder="Enter text..."
					/>
					<TextField label="Disabled" variant="standard" disabled />
					<TextField
						label="Error State"
						variant="standard"
						error
						helperText="This field has an error"
					/>
				</TextFieldGrid>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Size Variants</SectionHeader>
				<SectionDescription>
					Text fields in different sizes (small and medium).
				</SectionDescription>
				<TextFieldGrid>
					<TextField label="Small" variant="outlined" size="small" />
					<TextField label="Medium" variant="outlined" size="medium" />
				</TextFieldGrid>
			</VariantSection>

			<VariantSection>
				<SectionHeader>With Helper Text</SectionHeader>
				<SectionDescription>
					Text fields with helper text for additional context or instructions.
				</SectionDescription>
				<TextFieldGrid>
					<TextField
						label="Email"
						variant="outlined"
						helperText="Enter your email address"
						placeholder="user@example.com"
					/>
					<TextField
						label="Password"
						variant="outlined"
						type="password"
						helperText="Must be at least 8 characters"
					/>
				</TextFieldGrid>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Required Fields</SectionHeader>
				<SectionDescription>
					Text fields marked as required with asterisk indicator.
				</SectionDescription>
				<TextFieldGrid>
					<TextField label="Username" variant="outlined" required />
					<TextField label="Email" variant="outlined" required />
					<TextField label="Phone" variant="outlined" required />
				</TextFieldGrid>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Multiline Text Fields</SectionHeader>
				<SectionDescription>
					Text areas with multiple rows for longer text input.
				</SectionDescription>
				<TextFieldGrid>
					<TextField
						label="Description"
						variant="outlined"
						multiline
						rows={4}
						placeholder="Enter a detailed description..."
						helperText="Maximum 500 characters"
						fullWidth
					/>
					<TextField
						label="Comments"
						variant="outlined"
						multiline
						rows={3}
						placeholder="Add your comments..."
						fullWidth
					/>
				</TextFieldGrid>
			</VariantSection>
		</PageContainer>
	);
}
