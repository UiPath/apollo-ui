import { Slider } from "@mui/material";
import { useState } from "react";
import {
	PageContainer,
	PageDescription,
	PageTitle,
	SectionDescription,
	SectionHeader,
} from "../../components/SharedStyles";
import { SliderContainer, VariantSection } from "./MaterialSlider.styles";

export function MaterialSlider() {
	const [value, setValue] = useState(30);
	const [rangeValue, setRangeValue] = useState<number[]>([20, 40]);

	return (
		<PageContainer>
			<PageTitle>Slider</PageTitle>
			<PageDescription>
				Material UI Slider component with Apollo theme overrides. Features
				custom track styling, thumb indicators, and value labels.
			</PageDescription>

			<VariantSection>
				<SectionHeader>Basic Slider</SectionHeader>
				<SectionDescription>
					Standard slider with Apollo theme styling.
				</SectionDescription>
				<SliderContainer>
					<Slider defaultValue={50} />
				</SliderContainer>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Controlled Slider</SectionHeader>
				<SectionDescription>
					Slider with controlled state management.
				</SectionDescription>
				<SliderContainer>
					<Slider
						value={value}
						onChange={(_, val) => setValue(val as number)}
					/>
					<div style={{ marginTop: "8px" }}>Value: {value}</div>
				</SliderContainer>
			</VariantSection>

			<VariantSection>
				<SectionHeader>With Value Label</SectionHeader>
				<SectionDescription>
					Slider displaying value label on thumb.
				</SectionDescription>
				<SliderContainer>
					<Slider defaultValue={30} valueLabelDisplay="auto" />
					<Slider defaultValue={50} valueLabelDisplay="on" />
				</SliderContainer>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Discrete Slider</SectionHeader>
				<SectionDescription>
					Slider with discrete steps and marks.
				</SectionDescription>
				<SliderContainer>
					<Slider
						defaultValue={30}
						step={10}
						marks
						min={0}
						max={100}
						valueLabelDisplay="auto"
					/>
				</SliderContainer>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Custom Marks</SectionHeader>
				<SectionDescription>
					Slider with custom labeled marks.
				</SectionDescription>
				<SliderContainer>
					<Slider
						defaultValue={20}
						step={null}
						marks={[
							{ value: 0, label: "0°C" },
							{ value: 20, label: "20°C" },
							{ value: 37, label: "37°C" },
							{ value: 100, label: "100°C" },
						]}
						valueLabelDisplay="auto"
					/>
				</SliderContainer>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Range Slider</SectionHeader>
				<SectionDescription>
					Slider with two thumbs for selecting a range.
				</SectionDescription>
				<SliderContainer>
					<Slider
						value={rangeValue}
						onChange={(_, val) => setRangeValue(val as number[])}
						valueLabelDisplay="auto"
						min={0}
						max={100}
					/>
					<div style={{ marginTop: "8px" }}>
						Range: {rangeValue[0]} - {rangeValue[1]}
					</div>
				</SliderContainer>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Color Variants</SectionHeader>
				<SectionDescription>
					Sliders with different color props.
				</SectionDescription>
				<SliderContainer>
					<Slider defaultValue={30} color="primary" />
					<Slider defaultValue={50} color="secondary" />
				</SliderContainer>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Size Variants</SectionHeader>
				<SectionDescription>
					Sliders in different sizes (small, medium).
				</SectionDescription>
				<SliderContainer>
					<Slider defaultValue={30} size="small" />
					<Slider defaultValue={50} size="medium" />
				</SliderContainer>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Disabled State</SectionHeader>
				<SectionDescription>Slider in disabled state.</SectionDescription>
				<SliderContainer>
					<Slider defaultValue={30} disabled />
				</SliderContainer>
			</VariantSection>
		</PageContainer>
	);
}
