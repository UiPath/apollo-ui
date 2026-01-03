import {
	Avatar,
	Divider,
	List,
	ListItem,
	ListItemAvatar,
	ListItemButton,
	ListItemIcon,
	ListItemText,
} from "@mui/material";
import { useState } from "react";
import {
	PageContainer,
	PageDescription,
	PageTitle,
	SectionDescription,
	SectionHeader,
} from "../../components/SharedStyles";

export function MaterialList() {
	const [selectedIndex, setSelectedIndex] = useState(0);

	return (
		<PageContainer>
			<PageTitle>List</PageTitle>
			<PageDescription>
				Material UI List components with Apollo theme overrides. Displays lists
				of items with various configurations and interactive states.
			</PageDescription>

			<section style={{ marginBottom: "48px" }}>
				<SectionHeader>Basic List</SectionHeader>
				<SectionDescription>
					Standard list items with primary and secondary text.
				</SectionDescription>
				<List
					sx={{
						maxWidth: 500,
						border: "1px solid var(--color-border)",
						borderRadius: "8px",
					}}
				>
					<ListItem>
						<ListItemText primary="Single-line item" />
					</ListItem>
					<ListItem>
						<ListItemText primary="Two-line item" secondary="Secondary text" />
					</ListItem>
					<ListItem>
						<ListItemText
							primary="Three-line item"
							secondary="This is a longer secondary text that demonstrates multiline content in a list item."
						/>
					</ListItem>
				</List>
			</section>

			<section style={{ marginBottom: "48px" }}>
				<SectionHeader>With Icons</SectionHeader>
				<SectionDescription>
					List items with leading icons for visual clarity.
				</SectionDescription>
				<List
					sx={{
						maxWidth: 500,
						border: "1px solid var(--color-border)",
						borderRadius: "8px",
					}}
				>
					<ListItem>
						<ListItemIcon>🏠</ListItemIcon>
						<ListItemText primary="Home" secondary="Dashboard" />
					</ListItem>
					<ListItem>
						<ListItemIcon>⚙️</ListItemIcon>
						<ListItemText primary="Settings" secondary="Preferences" />
					</ListItem>
					<ListItem>
						<ListItemIcon>👤</ListItemIcon>
						<ListItemText primary="Profile" secondary="Account info" />
					</ListItem>
				</List>
			</section>

			<section style={{ marginBottom: "48px" }}>
				<SectionHeader>With Avatars</SectionHeader>
				<SectionDescription>List items with avatar icons.</SectionDescription>
				<List
					sx={{
						maxWidth: 500,
						border: "1px solid var(--color-border)",
						borderRadius: "8px",
					}}
				>
					<ListItem>
						<ListItemAvatar>
							<Avatar>👤</Avatar>
						</ListItemAvatar>
						<ListItemText primary="John Doe" secondary="john@example.com" />
					</ListItem>
					<ListItem>
						<ListItemAvatar>
							<Avatar>👤</Avatar>
						</ListItemAvatar>
						<ListItemText primary="Jane Smith" secondary="jane@example.com" />
					</ListItem>
				</List>
			</section>

			<section style={{ marginBottom: "48px" }}>
				<SectionHeader>Interactive List</SectionHeader>
				<SectionDescription>
					Clickable list items with hover and selection states.
				</SectionDescription>
				<List
					sx={{
						maxWidth: 500,
						border: "1px solid var(--color-border)",
						borderRadius: "8px",
					}}
				>
					{["Inbox", "Drafts", "Sent", "Trash"].map((text, index) => (
						<ListItem key={text} disablePadding>
							<ListItemButton
								selected={selectedIndex === index}
								onClick={() => setSelectedIndex(index)}
							>
								<ListItemIcon>
									{index === 0 && "📧"}
									{index === 1 && "✉️"}
									{index === 2 && "📤"}
									{index === 3 && "🗑️"}
								</ListItemIcon>
								<ListItemText primary={text} />
							</ListItemButton>
						</ListItem>
					))}
				</List>
			</section>

			<section style={{ marginBottom: "48px" }}>
				<SectionHeader>With Dividers</SectionHeader>
				<SectionDescription>
					List items separated by dividers.
				</SectionDescription>
				<List
					sx={{
						maxWidth: 500,
						border: "1px solid var(--color-border)",
						borderRadius: "8px",
					}}
				>
					<ListItem>
						<ListItemText primary="Item One" secondary="First item" />
					</ListItem>
					<Divider component="li" />
					<ListItem>
						<ListItemText primary="Item Two" secondary="Second item" />
					</ListItem>
					<Divider component="li" />
					<ListItem>
						<ListItemText primary="Item Three" secondary="Third item" />
					</ListItem>
				</List>
			</section>

			<section style={{ marginBottom: "48px" }}>
				<SectionHeader>Dense List</SectionHeader>
				<SectionDescription>
					Compact list with reduced spacing.
				</SectionDescription>
				<List
					dense
					sx={{
						maxWidth: 500,
						border: "1px solid var(--color-border)",
						borderRadius: "8px",
					}}
				>
					<ListItem>
						<ListItemIcon>📁</ListItemIcon>
						<ListItemText primary="Documents" />
					</ListItem>
					<ListItem>
						<ListItemIcon>🖼️</ListItemIcon>
						<ListItemText primary="Images" />
					</ListItem>
					<ListItem>
						<ListItemIcon>🎵</ListItemIcon>
						<ListItemText primary="Music" />
					</ListItem>
					<ListItem>
						<ListItemIcon>🎬</ListItemIcon>
						<ListItemText primary="Videos" />
					</ListItem>
				</List>
			</section>

			<section>
				<SectionHeader>Disabled Items</SectionHeader>
				<SectionDescription>
					List with disabled interactive items.
				</SectionDescription>
				<List
					sx={{
						maxWidth: 500,
						border: "1px solid var(--color-border)",
						borderRadius: "8px",
					}}
				>
					<ListItem disablePadding>
						<ListItemButton>
							<ListItemText primary="Active item" />
						</ListItemButton>
					</ListItem>
					<ListItem disablePadding>
						<ListItemButton disabled>
							<ListItemText primary="Disabled item" />
						</ListItemButton>
					</ListItem>
					<ListItem disablePadding>
						<ListItemButton>
							<ListItemText primary="Another active item" />
						</ListItemButton>
					</ListItem>
				</List>
			</section>
		</PageContainer>
	);
}
