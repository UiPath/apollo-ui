import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useState } from "react";
import {
	PageContainer,
	PageDescription,
	PageTitle,
	SectionDescription,
	SectionHeader,
} from "../../components/SharedStyles";
import { SelectGrid, VariantSection } from "./MaterialSelect.styles";

export function MaterialSelect() {
	const [basicSelectValue, setBasicSelectValue] = useState("10");
	const [sizeSelectValue, setSizeSelectValue] = useState("10");
	const [variantsSelectValue, setVariantsSelectValue] = useState("10");
	const [multiValue, setMultiValue] = useState<string[]>([]);

	return (
		<PageContainer>
			<PageTitle>Select</PageTitle>
			<PageDescription>
				Material UI Select component with Apollo theme overrides. Features
				custom dropdown styling, menu items, and focus states.
			</PageDescription>

			<VariantSection>
				<SectionHeader>Basic Select</SectionHeader>
				<SectionDescription>
					Standard select dropdown with Apollo theme styling.
				</SectionDescription>
				<SelectGrid>
					<FormControl sx={{ minWidth: 200 }}>
						<InputLabel>Age</InputLabel>
						<Select
							value={basicSelectValue}
							label="Age"
							onChange={(e) => setBasicSelectValue(e.target.value)}
						>
							<MenuItem value={10}>Ten</MenuItem>
							<MenuItem value={20}>Twenty</MenuItem>
							<MenuItem value={30}>Thirty</MenuItem>
						</Select>
					</FormControl>
				</SelectGrid>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Size Variants</SectionHeader>
				<SectionDescription>
					Select components in different sizes (small, medium).
				</SectionDescription>
				<SelectGrid>
					<FormControl size="small" sx={{ minWidth: 150 }}>
						<InputLabel>Small</InputLabel>
						<Select
							value={sizeSelectValue}
							label="Small"
							onChange={(e) => setSizeSelectValue(e.target.value)}
						>
							<MenuItem value={10}>Option 1</MenuItem>
							<MenuItem value={20}>Option 2</MenuItem>
							<MenuItem value={30}>Option 3</MenuItem>
						</Select>
					</FormControl>
					<FormControl sx={{ minWidth: 150 }}>
						<InputLabel>Medium</InputLabel>
						<Select
							value={sizeSelectValue}
							label="Medium"
							onChange={(e) => setSizeSelectValue(e.target.value)}
						>
							<MenuItem value={10}>Option 1</MenuItem>
							<MenuItem value={20}>Option 2</MenuItem>
							<MenuItem value={30}>Option 3</MenuItem>
						</Select>
					</FormControl>
				</SelectGrid>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Variants</SectionHeader>
				<SectionDescription>
					Select with different style variants (outlined, filled, standard).
				</SectionDescription>
				<SelectGrid>
					<FormControl variant="outlined" sx={{ minWidth: 150 }}>
						<InputLabel>Outlined</InputLabel>
						<Select
							value={variantsSelectValue}
							label="Outlined"
							onChange={(e) => setVariantsSelectValue(e.target.value)}
						>
							<MenuItem value={10}>Option 1</MenuItem>
							<MenuItem value={20}>Option 2</MenuItem>
							<MenuItem value={30}>Option 3</MenuItem>
						</Select>
					</FormControl>
					<FormControl variant="filled" sx={{ minWidth: 150 }}>
						<InputLabel>Filled</InputLabel>
						<Select
							value={variantsSelectValue}
							label="Filled"
							onChange={(e) => setVariantsSelectValue(e.target.value)}
						>
							<MenuItem value={10}>Option 1</MenuItem>
							<MenuItem value={20}>Option 2</MenuItem>
							<MenuItem value={30}>Option 3</MenuItem>
						</Select>
					</FormControl>
					<FormControl variant="standard" sx={{ minWidth: 150 }}>
						<InputLabel>Standard</InputLabel>
						<Select
							value={variantsSelectValue}
							label="Standard"
							onChange={(e) => setVariantsSelectValue(e.target.value)}
						>
							<MenuItem value={10}>Option 1</MenuItem>
							<MenuItem value={20}>Option 2</MenuItem>
							<MenuItem value={30}>Option 3</MenuItem>
						</Select>
					</FormControl>
				</SelectGrid>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Multiple Select</SectionHeader>
				<SectionDescription>
					Select component allowing multiple selections.
				</SectionDescription>
				<FormControl sx={{ minWidth: 250 }}>
					<InputLabel>Select tags</InputLabel>
					<Select
						multiple
						value={multiValue}
						label="Select tags"
						onChange={(e) =>
							setMultiValue(
								typeof e.target.value === "string"
									? e.target.value.split(",")
									: e.target.value,
							)
						}
					>
						<MenuItem value="react">React</MenuItem>
						<MenuItem value="angular">Angular</MenuItem>
						<MenuItem value="vue">Vue</MenuItem>
						<MenuItem value="svelte">Svelte</MenuItem>
					</Select>
				</FormControl>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Disabled State</SectionHeader>
				<SectionDescription>
					Select component in disabled state.
				</SectionDescription>
				<FormControl disabled sx={{ minWidth: 200 }}>
					<InputLabel>Disabled</InputLabel>
					<Select value="10" label="Disabled">
						<MenuItem value={10}>Option 1</MenuItem>
						<MenuItem value={20}>Option 2</MenuItem>
						<MenuItem value={30}>Option 3</MenuItem>
					</Select>
				</FormControl>
			</VariantSection>
		</PageContainer>
	);
}
