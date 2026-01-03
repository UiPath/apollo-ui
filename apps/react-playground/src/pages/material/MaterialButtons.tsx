import { Button, Fab, IconButton } from "@mui/material";
import {
	PageContainer,
	PageDescription,
	PageTitle,
	SectionDescription,
	SectionHeader,
} from "../../components/SharedStyles";

export function MaterialButtons() {
	return (
		<PageContainer>
			<PageTitle>Buttons</PageTitle>
			<PageDescription>
				Material UI Button, IconButton, and Fab components with Apollo theme
				overrides. Includes customized colors, hover states, focus indicators,
				and sizing variants.
			</PageDescription>

			<section style={{ marginBottom: "48px" }}>
				<SectionHeader>Standard Buttons</SectionHeader>
				<SectionDescription>
					Primary action buttons with three variants: contained (solid),
					outlined (border), and text (minimal).
				</SectionDescription>
				<div
					style={{
						display: "flex",
						gap: "16px",
						flexWrap: "wrap",
						marginBottom: "16px",
					}}
				>
					<Button variant="contained">Contained</Button>
					<Button variant="outlined">Outlined</Button>
					<Button variant="text">Text</Button>
				</div>
				<div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
					<Button variant="contained" disabled>
						Disabled
					</Button>
					<Button variant="outlined" disabled>
						Disabled
					</Button>
					<Button variant="text" disabled>
						Disabled
					</Button>
				</div>
			</section>

			<section style={{ marginBottom: "48px" }}>
				<SectionHeader>Icon Buttons</SectionHeader>
				<SectionDescription>
					Icon-only buttons for compact actions with hover and focus states.
				</SectionDescription>
				<div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
					<IconButton aria-label="home">🏠</IconButton>
					<IconButton aria-label="search">🔍</IconButton>
					<IconButton aria-label="settings">⚙️</IconButton>
					<IconButton aria-label="notifications">🔔</IconButton>
					<IconButton aria-label="profile">👤</IconButton>
					<IconButton aria-label="delete">🗑️</IconButton>
					<IconButton aria-label="edit">✏️</IconButton>
					<IconButton disabled aria-label="disabled">
						🏠
					</IconButton>
				</div>
			</section>

			<section style={{ marginBottom: "48px" }}>
				<SectionHeader>Floating Action Buttons (FAB)</SectionHeader>
				<SectionDescription>
					Circular floating action buttons for primary actions.
				</SectionDescription>
				<div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
					<Fab color="primary" aria-label="add">
						➕
					</Fab>
					<Fab color="secondary" aria-label="edit">
						✏️
					</Fab>
					<Fab disabled aria-label="delete">
						🗑️
					</Fab>
				</div>
			</section>

			<section style={{ marginBottom: "48px" }}>
				<SectionHeader>Sizes</SectionHeader>
				<SectionDescription>
					All button types in different sizes (small, medium, large).
				</SectionDescription>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "24px",
					}}
				>
					<div>
						<div
							style={{
								fontSize: "14px",
								fontWeight: 600,
								marginBottom: "8px",
								color: "var(--color-foreground-emp)",
							}}
						>
							Standard Buttons
						</div>
						<div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
							<Button variant="contained" size="small">
								Small
							</Button>
							<Button variant="contained" size="medium">
								Medium
							</Button>
							<Button variant="contained" size="large">
								Large
							</Button>
						</div>
					</div>

					<div>
						<div
							style={{
								fontSize: "14px",
								fontWeight: 600,
								marginBottom: "8px",
								color: "var(--color-foreground-emp)",
							}}
						>
							Icon Buttons
						</div>
						<div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
							<IconButton size="small" aria-label="small">
								🔔
							</IconButton>
							<IconButton size="medium" aria-label="medium">
								🔔
							</IconButton>
							<IconButton size="large" aria-label="large">
								🔔
							</IconButton>
						</div>
					</div>

					<div>
						<div
							style={{
								fontSize: "14px",
								fontWeight: 600,
								marginBottom: "8px",
								color: "var(--color-foreground-emp)",
							}}
						>
							Floating Action Buttons
						</div>
						<div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
							<Fab size="small" color="primary" aria-label="small">
								➕
							</Fab>
							<Fab size="medium" color="primary" aria-label="medium">
								➕
							</Fab>
							<Fab size="large" color="primary" aria-label="large">
								➕
							</Fab>
						</div>
					</div>
				</div>
			</section>

			<section style={{ marginBottom: "48px" }}>
				<SectionHeader>With Icons</SectionHeader>
				<SectionDescription>
					Buttons with start and end icons for enhanced visual communication.
				</SectionDescription>
				<div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
					<Button variant="contained" startIcon={<span>⬇️</span>}>
						Download
					</Button>
					<Button variant="outlined" endIcon={<span>➡️</span>}>
						Next
					</Button>
					<Button variant="text" startIcon={<span>✏️</span>}>
						Edit
					</Button>
					<Button variant="contained" startIcon={<span>🗑️</span>}>
						Delete
					</Button>
				</div>
			</section>

			<section style={{ marginBottom: "48px" }}>
				<SectionHeader>Color Variants</SectionHeader>
				<SectionDescription>
					Buttons and icon buttons with different color props.
				</SectionDescription>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "16px",
					}}
				>
					<div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
						<Button variant="contained">Default</Button>
						<Button variant="contained" color="primary">
							Primary
						</Button>
						<Button variant="contained" color="secondary">
							Secondary
						</Button>
					</div>
					<div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
						<IconButton color="default" aria-label="default">
							🔗
						</IconButton>
						<IconButton color="primary" aria-label="primary">
							❤️
						</IconButton>
						<IconButton color="secondary" aria-label="secondary">
							⭐
						</IconButton>
					</div>
				</div>
			</section>

			<section>
				<SectionHeader>Warning Buttons</SectionHeader>
				<SectionDescription>
					Special warning variant using custom Apollo styling for destructive
					actions.
				</SectionDescription>
				<div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
					<Button variant="contained" className="warning">
						Warning Action
					</Button>
					<Button variant="contained" className="warning" disabled>
						Disabled Warning
					</Button>
				</div>
			</section>
		</PageContainer>
	);
}
