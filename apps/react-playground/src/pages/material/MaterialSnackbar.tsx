import { Button, Snackbar } from "@mui/material";
import { useState } from "react";
import {
	PageContainer,
	PageDescription,
	PageTitle,
	SectionDescription,
	SectionHeader,
} from "../../components/SharedStyles";

export function MaterialSnackbar() {
	const [open, setOpen] = useState(false);

	return (
		<PageContainer>
			<PageTitle>Snackbar</PageTitle>
			<PageDescription>
				Material UI Snackbar component with Apollo theme overrides. Features
				custom styling for notifications and toast messages.
			</PageDescription>

			<section style={{ marginBottom: "48px" }}>
				<SectionHeader>Basic Snackbar</SectionHeader>
				<SectionDescription>
					Standard snackbar notification with Apollo theme styling.
				</SectionDescription>
				<Button variant="outlined" onClick={() => setOpen(true)}>
					Show Snackbar
				</Button>
				<Snackbar
					open={open}
					autoHideDuration={3000}
					onClose={() => setOpen(false)}
					message="This is a snackbar notification"
				/>
			</section>
		</PageContainer>
	);
}
