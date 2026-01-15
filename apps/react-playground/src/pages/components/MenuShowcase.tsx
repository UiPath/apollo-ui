import {
	ApButton,
	ApIcon,
	ApMenu,
} from "@uipath/apollo-react/material/components";
import type { IMenuItem } from "@uipath/apollo-react/material/components";
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
  flex-wrap: wrap;
  gap: 16px;
  padding: 24px;
  background: var(--color-background);
  border-radius: 12px;
  border: 2px solid var(--color-border);
  align-items: flex-start;
`;

const Label = styled.div`
  font-size: 14px;
  color: var(--color-foreground-de-emp);
  font-weight: 600;
  width: 100%;
  margin-bottom: 8px;
`;

export function MenuShowcase() {
	const [anchorEl1, setAnchorEl1] = useState<null | HTMLElement>(null);
	const [anchorEl2, setAnchorEl2] = useState<null | HTMLElement>(null);
	const [anchorEl3, setAnchorEl3] = useState<null | HTMLElement>(null);
	const [anchorEl4, setAnchorEl4] = useState<null | HTMLElement>(null);

	const basicMenuItems: IMenuItem[] = [
		{
			variant: "item",
			title: "Profile",
			onClick: () => {
				alert("Profile clicked");
				setAnchorEl1(null);
			},
			startIcon: <ApIcon name="person" size="20px" />,
		},
		{
			variant: "item",
			title: "Settings",
			onClick: () => {
				alert("Settings clicked");
				setAnchorEl1(null);
			},
			startIcon: <ApIcon name="settings" size="20px" />,
		},
		{ variant: "separator" },
		{
			variant: "item",
			title: "Logout",
			onClick: () => {
				alert("Logout clicked");
				setAnchorEl1(null);
			},
			startIcon: <ApIcon name="logout" size="20px" />,
		},
	];

	const menuWithSubtitles: IMenuItem[] = [
		{
			variant: "item",
			title: "New File",
			subtitle: "Create a new file in the project",
			onClick: () => {
				alert("New File");
				setAnchorEl2(null);
			},
			startIcon: <ApIcon name="insert_drive_file" size="20px" />,
		},
		{
			variant: "item",
			title: "New Folder",
			subtitle: "Create a new folder in the project",
			onClick: () => {
				alert("New Folder");
				setAnchorEl2(null);
			},
			startIcon: <ApIcon name="create_new_folder" size="20px" />,
		},
		{ variant: "separator" },
		{
			variant: "item",
			title: "Import",
			subtitle: "Import files from external source",
			onClick: () => {
				alert("Import");
				setAnchorEl2(null);
			},
			startIcon: <ApIcon name="upload" size="20px" />,
		},
	];

	const menuWithStates: IMenuItem[] = [
		{
			variant: "item",
			title: "Active Item",
			isSelected: true,
			onClick: () => {
				alert("Active Item");
				setAnchorEl3(null);
			},
		},
		{
			variant: "item",
			title: "Normal Item",
			onClick: () => {
				alert("Normal Item");
				setAnchorEl3(null);
			},
		},
		{
			variant: "item",
			title: "Disabled Item",
			disabled: true,
			onClick: () => {
				alert("This should not appear");
			},
		},
		{ variant: "separator" },
		{ variant: "section", title: "Section Header" },
		{
			variant: "item",
			title: "Item in Section",
			onClick: () => {
				alert("Item in Section");
				setAnchorEl3(null);
			},
		},
	];

	const nestedMenu: IMenuItem[] = [
		{
			variant: "submenu",
			title: "File",
			startIcon: <ApIcon name="folder" size="20px" />,
			subItems: [
				{
					variant: "item",
					title: "New",
					onClick: () => {
						alert("New");
						setAnchorEl4(null);
					},
				},
				{
					variant: "item",
					title: "Open",
					onClick: () => {
						alert("Open");
						setAnchorEl4(null);
					},
				},
				{
					variant: "item",
					title: "Save",
					onClick: () => {
						alert("Save");
						setAnchorEl4(null);
					},
				},
			],
		},
		{
			variant: "submenu",
			title: "Edit",
			startIcon: <ApIcon name="edit" size="20px" />,
			subItems: [
				{
					variant: "item",
					title: "Cut",
					onClick: () => {
						alert("Cut");
						setAnchorEl4(null);
					},
				},
				{
					variant: "item",
					title: "Copy",
					onClick: () => {
						alert("Copy");
						setAnchorEl4(null);
					},
				},
				{
					variant: "item",
					title: "Paste",
					onClick: () => {
						alert("Paste");
						setAnchorEl4(null);
					},
				},
			],
		},
		{ variant: "separator" },
		{
			variant: "item",
			title: "About",
			onClick: () => {
				alert("About");
				setAnchorEl4(null);
			},
			startIcon: <ApIcon name="info" size="20px" />,
		},
	];

	return (
		<PageContainer>
			<PageTitle>Menu</PageTitle>
			<PageDescription>
				Dropdown menu component with support for icons, subtitles, sections, and
				nested items
			</PageDescription>

			<ShowcaseSection>
				<SectionTitle>Basic Menu</SectionTitle>
				<ComponentRow>
					<Label>Simple menu with icons and dividers</Label>
					<ApButton
						label="Open Basic Menu"
						onClick={(e) => setAnchorEl1(e.currentTarget as HTMLElement)}
					/>
					<ApMenu
						anchorEl={anchorEl1}
						isOpen={Boolean(anchorEl1)}
						onClose={() => setAnchorEl1(null)}
						menuItems={basicMenuItems}
					/>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Menu with Subtitles</SectionTitle>
				<ComponentRow>
					<Label>Menu items with descriptive subtitles</Label>
					<ApButton
						label="Open Menu with Subtitles"
						onClick={(e) => setAnchorEl2(e.currentTarget as HTMLElement)}
					/>
					<ApMenu
						anchorEl={anchorEl2}
						isOpen={Boolean(anchorEl2)}
						onClose={() => setAnchorEl2(null)}
						menuItems={menuWithSubtitles}
					/>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Menu with States</SectionTitle>
				<ComponentRow>
					<Label>Menu with selected, disabled, and section header items</Label>
					<ApButton
						label="Open Menu with States"
						onClick={(e) => setAnchorEl3(e.currentTarget as HTMLElement)}
					/>
					<ApMenu
						anchorEl={anchorEl3}
						isOpen={Boolean(anchorEl3)}
						onClose={() => setAnchorEl3(null)}
						menuItems={menuWithStates}
					/>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Nested Menu</SectionTitle>
				<ComponentRow>
					<Label>Menu with submenu items (hover over items with arrows)</Label>
					<ApButton
						label="Open Nested Menu"
						onClick={(e) => setAnchorEl4(e.currentTarget as HTMLElement)}
					/>
					<ApMenu
						anchorEl={anchorEl4}
						isOpen={Boolean(anchorEl4)}
						onClose={() => setAnchorEl4(null)}
						menuItems={nestedMenu}
					/>
				</ComponentRow>
			</ShowcaseSection>
		</PageContainer>
	);
}
