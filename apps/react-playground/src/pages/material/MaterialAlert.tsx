import { Alert } from "@mui/material";
import {
	PageContainer,
	PageDescription,
	PageTitle,
	SectionDescription,
	SectionHeader,
} from "../../components/SharedStyles";
import { AlertStack, VariantSection } from "./MaterialAlert.styles";

export function MaterialAlert() {
	return (
		<PageContainer>
			<PageTitle>Alert</PageTitle>
			<PageDescription>
				Material UI Alert component with Apollo theme overrides. Features custom
				severity colors, icons, and close button styling.
			</PageDescription>

			<VariantSection>
				<SectionHeader>Severity Variants</SectionHeader>
				<SectionDescription>
					Alerts with different severity levels (error, warning, info, success).
				</SectionDescription>
				<AlertStack>
					<Alert severity="error">This is an error alert</Alert>
					<Alert severity="warning">This is a warning alert</Alert>
					<Alert severity="info">This is an info alert</Alert>
					<Alert severity="success">This is a success alert</Alert>
				</AlertStack>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Outlined Variant</SectionHeader>
				<SectionDescription>
					Alerts with outlined style instead of filled background.
				</SectionDescription>
				<AlertStack>
					<Alert variant="outlined" severity="error">
						This is an outlined error alert
					</Alert>
					<Alert variant="outlined" severity="warning">
						This is an outlined warning alert
					</Alert>
					<Alert variant="outlined" severity="info">
						This is an outlined info alert
					</Alert>
					<Alert variant="outlined" severity="success">
						This is an outlined success alert
					</Alert>
				</AlertStack>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Filled Variant</SectionHeader>
				<SectionDescription>
					Alerts with filled style for higher emphasis.
				</SectionDescription>
				<AlertStack>
					<Alert variant="filled" severity="error">
						This is a filled error alert
					</Alert>
					<Alert variant="filled" severity="warning">
						This is a filled warning alert
					</Alert>
					<Alert variant="filled" severity="info">
						This is a filled info alert
					</Alert>
					<Alert variant="filled" severity="success">
						This is a filled success alert
					</Alert>
				</AlertStack>
			</VariantSection>

			<VariantSection>
				<SectionHeader>With Close Button</SectionHeader>
				<SectionDescription>
					Alerts with a close button for dismissal.
				</SectionDescription>
				<AlertStack>
					<Alert severity="info" onClose={() => alert("Alert closed!")}>
						This alert can be closed
					</Alert>
					<Alert
						variant="outlined"
						severity="warning"
						onClose={() => alert("Alert closed!")}
					>
						This outlined alert can be closed
					</Alert>
				</AlertStack>
			</VariantSection>
		</PageContainer>
	);
}
