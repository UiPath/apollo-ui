import { CircularProgress } from "@mui/material";
import {
	PageContainer,
	PageDescription,
	PageTitle,
	SectionDescription,
	SectionHeader,
} from "../../components/SharedStyles";
import {
	ProgressGrid,
	VariantSection,
} from "./MaterialCircularProgress.styles";

export function MaterialCircularProgress() {
	return (
		<PageContainer>
			<PageTitle>Circular Progress</PageTitle>
			<PageDescription>
				Material UI CircularProgress component with Apollo theme overrides.
				Features custom colors and size variants for loading indicators.
			</PageDescription>

			<VariantSection>
				<SectionHeader>Basic Circular Progress</SectionHeader>
				<SectionDescription>
					Standard circular progress indicators.
				</SectionDescription>
				<ProgressGrid>
					<CircularProgress />
				</ProgressGrid>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Color Variants</SectionHeader>
				<SectionDescription>
					Circular progress with different color props.
				</SectionDescription>
				<ProgressGrid>
					<CircularProgress color="primary" />
					<CircularProgress color="secondary" />
					<CircularProgress color="success" />
					<CircularProgress color="error" />
					<CircularProgress color="warning" />
					<CircularProgress color="info" />
				</ProgressGrid>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Size Variants</SectionHeader>
				<SectionDescription>
					Circular progress in different sizes.
				</SectionDescription>
				<ProgressGrid>
					<CircularProgress size={20} />
					<CircularProgress size={30} />
					<CircularProgress size={40} />
					<CircularProgress size={60} />
					<CircularProgress size={80} />
				</ProgressGrid>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Determinate Progress</SectionHeader>
				<SectionDescription>
					Circular progress with specific value (determinate).
				</SectionDescription>
				<ProgressGrid>
					<CircularProgress variant="determinate" value={25} />
					<CircularProgress variant="determinate" value={50} />
					<CircularProgress variant="determinate" value={75} />
					<CircularProgress variant="determinate" value={100} />
				</ProgressGrid>
			</VariantSection>

			<VariantSection>
				<SectionHeader>With Label</SectionHeader>
				<SectionDescription>
					Circular progress with percentage label.
				</SectionDescription>
				<ProgressGrid>
					<div style={{ position: "relative", display: "inline-flex" }}>
						<CircularProgress variant="determinate" value={75} size={80} />
						<div
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								bottom: 0,
								right: 0,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<span>75%</span>
						</div>
					</div>
				</ProgressGrid>
			</VariantSection>
		</PageContainer>
	);
}
