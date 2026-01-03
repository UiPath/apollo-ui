import { Button, Menu, MenuItem } from "@mui/material";
import { useState } from "react";
import {
	PageContainer,
	PageDescription,
	PageTitle,
	SectionDescription,
	SectionHeader,
} from "../../components/SharedStyles";
import { MenuContainer, VariantSection } from "./MaterialMenuItem.styles";

export function MaterialMenuItem() {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [anchorEl2, setAnchorEl2] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const open2 = Boolean(anchorEl2);

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClick2 = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl2(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleClose2 = () => {
		setAnchorEl2(null);
	};

	return (
		<PageContainer>
			<PageTitle>Menu Item</PageTitle>
			<PageDescription>
				Material UI MenuItem component with Apollo theme overrides. Used within
				Menu components to display selectable options with custom styling.
			</PageDescription>

			<VariantSection>
				<SectionHeader>Basic Menu Items</SectionHeader>
				<SectionDescription>
					Standard menu with Apollo themed menu items.
				</SectionDescription>
				<MenuContainer>
					<Button variant="outlined" onClick={handleClick}>
						Open Menu
					</Button>
					<Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
						<MenuItem onClick={handleClose}>Profile</MenuItem>
						<MenuItem onClick={handleClose}>My Account</MenuItem>
						<MenuItem onClick={handleClose}>Settings</MenuItem>
						<MenuItem onClick={handleClose}>Logout</MenuItem>
					</Menu>
				</MenuContainer>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Menu with Icons</SectionHeader>
				<SectionDescription>
					Menu items with leading icons for better visual communication.
				</SectionDescription>
				<MenuContainer>
					<Button variant="outlined" onClick={handleClick2}>
						Open Menu with Icons
					</Button>
					<Menu anchorEl={anchorEl2} open={open2} onClose={handleClose2}>
						<MenuItem onClick={handleClose2}>
							<span style={{ marginRight: "12px" }}>🏠</span>
							Home
						</MenuItem>
						<MenuItem onClick={handleClose2}>
							<span style={{ marginRight: "12px" }}>👤</span>
							Profile
						</MenuItem>
						<MenuItem onClick={handleClose2}>
							<span style={{ marginRight: "12px" }}>⚙️</span>
							Settings
						</MenuItem>
						<MenuItem onClick={handleClose2} disabled>
							<span style={{ marginRight: "12px" }}>🔒</span>
							Locked Option
						</MenuItem>
						<MenuItem onClick={handleClose2}>
							<span style={{ marginRight: "12px" }}>🚪</span>
							Logout
						</MenuItem>
					</Menu>
				</MenuContainer>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Menu Item States</SectionHeader>
				<SectionDescription>
					MenuItem components demonstrate hover, focus, and disabled states with
					Apollo theme styling including custom background colors, text colors,
					and interactive feedback.
				</SectionDescription>
			</VariantSection>
		</PageContainer>
	);
}
