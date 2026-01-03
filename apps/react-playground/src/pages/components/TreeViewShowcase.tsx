import FolderIcon from "@mui/icons-material/Folder";
import GroupIcon from "@mui/icons-material/Group";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PersonIcon from "@mui/icons-material/Person";
import { ApTreeView } from "@uipath/apollo-react/material/components";
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
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: var(--color-background);
  border-radius: 12px;
  border: 2px solid var(--color-border);
`;

const Label = styled.div`
  font-size: 14px;
  color: var(--color-foreground-de-emp);
  font-weight: 600;
  margin-bottom: 8px;
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
`;

const SelectedInfo = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: var(--color-background-hover);
  border-radius: 8px;
  font-size: 14px;
  color: var(--color-foreground);
`;

export function TreeViewShowcase() {
	const [selectedFileId, setSelectedFileId] = useState<string | undefined>("6");
	const [selectedTeamMember, setSelectedTeamMember] = useState<
		string | undefined
	>();

	const fileSystemData = [
		{
			id: "1",
			title: "src",
			description: "Source code directory",
			icon: <FolderIcon />,
			iconColor: "var(--color-warning)",
			children: [
				{
					id: "2",
					title: "components",
					description: "React components",
					icon: <FolderIcon />,
					iconColor: "var(--color-warning)",
					children: [
						{
							id: "3",
							title: "Header.tsx",
							description: "Main header component",
							icon: <InsertDriveFileIcon />,
							iconColor: "var(--color-info)",
							additionalInfo: "2.4 KB",
						},
						{
							id: "4",
							title: "Footer.tsx",
							description: "Main footer component",
							icon: <InsertDriveFileIcon />,
							iconColor: "var(--color-info)",
							additionalInfo: "1.8 KB",
						},
					],
				},
				{
					id: "5",
					title: "pages",
					description: "Page components",
					icon: <FolderIcon />,
					iconColor: "var(--color-warning)",
					children: [
						{
							id: "6",
							title: "Home.tsx",
							description: "Home page",
							icon: <InsertDriveFileIcon />,
							iconColor: "var(--color-info)",
							additionalInfo: "5.2 KB",
						},
						{
							id: "7",
							title: "About.tsx",
							description: "About page",
							icon: <InsertDriveFileIcon />,
							iconColor: "var(--color-info)",
							additionalInfo: "3.1 KB",
							disabled: true,
						},
					],
				},
				{
					id: "8",
					title: "App.tsx",
					description: "Main application component",
					icon: <InsertDriveFileIcon />,
					iconColor: "var(--color-success)",
					additionalInfo: "4.7 KB",
				},
			],
		},
		{
			id: "9",
			title: "public",
			description: "Public assets",
			icon: <FolderIcon />,
			iconColor: "var(--color-warning)",
			children: [
				{
					id: "10",
					title: "index.html",
					icon: <InsertDriveFileIcon />,
					additionalInfo: "512 B",
				},
				{
					id: "11",
					title: "favicon.ico",
					icon: <InsertDriveFileIcon />,
					additionalInfo: "15 KB",
				},
			],
		},
		{
			id: "12",
			title: "package.json",
			description: "NPM package configuration",
			icon: <InsertDriveFileIcon />,
			iconColor: "var(--color-error)",
			additionalInfo: "1.2 KB",
		},
		{
			id: "13",
			title: "tsconfig.json",
			description: "TypeScript configuration",
			icon: <InsertDriveFileIcon />,
			iconColor: "var(--color-info)",
			additionalInfo: "856 B",
		},
	];

	const organizationData = [
		{
			id: "1",
			title: "Engineering",
			description: "Engineering department",
			icon: <GroupIcon />,
			iconColor: "var(--color-primary)",
			additionalInfo: "24 members",
			children: [
				{
					id: "2",
					title: "Frontend",
					description: "Frontend team",
					icon: <GroupIcon />,
					additionalInfo: "12 members",
					children: [
						{
							id: "3",
							title: "Alice Johnson",
							description: "Senior Frontend Developer",
							icon: <PersonIcon />,
							titleColor: "var(--color-success)",
						},
						{
							id: "4",
							title: "Bob Smith",
							description: "Frontend Developer",
							icon: <PersonIcon />,
						},
					],
				},
				{
					id: "5",
					title: "Backend",
					description: "Backend team",
					icon: <GroupIcon />,
					additionalInfo: "12 members",
					children: [
						{
							id: "6",
							title: "Carol Williams",
							description: "Senior Backend Developer",
							icon: <PersonIcon />,
							titleColor: "var(--color-success)",
						},
						{
							id: "7",
							title: "David Brown",
							description: "Backend Developer - On leave",
							icon: <PersonIcon />,
							disabled: true,
						},
					],
				},
			],
		},
		{
			id: "8",
			title: "Design",
			description: "Design department",
			icon: <GroupIcon />,
			iconColor: "var(--color-primary)",
			additionalInfo: "8 members",
			children: [
				{
					id: "9",
					title: "Eve Davis",
					description: "Lead Designer",
					icon: <PersonIcon />,
					titleColor: "var(--color-success)",
				},
				{
					id: "10",
					title: "Frank Miller",
					description: "UI/UX Designer",
					icon: <PersonIcon />,
				},
			],
		},
	];

	const simpleData = [
		{
			id: "1",
			title: "Item 1",
			children: [
				{ id: "2", title: "Item 1.1" },
				{ id: "3", title: "Item 1.2" },
			],
		},
		{
			id: "4",
			title: "Item 2",
			children: [
				{ id: "5", title: "Item 2.1" },
				{ id: "6", title: "Item 2.2" },
			],
		},
	];

	return (
		<PageContainer>
			<PageTitle>Tree View</PageTitle>
			<PageDescription>
				Hierarchical data display component for nested structures
			</PageDescription>

			<ShowcaseSection>
				<SectionTitle>Interactive Selection with Chevron</SectionTitle>
				<ComponentRow>
					<Label>
						File browser with selection tracking and chevron indicator
					</Label>
					<ApTreeView
						items={fileSystemData}
						selectedItemId={selectedFileId}
						onSelectedItemsChange={setSelectedFileId}
						showSelectedChevron
					/>
					{selectedFileId && (
						<SelectedInfo>
							Selected item ID: <strong>{selectedFileId}</strong>
						</SelectedInfo>
					)}
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Rich Content Examples</SectionTitle>
				<ComponentRow>
					<Label>
						Tree with icons, colors, descriptions (tooltips), and additional
						info
					</Label>
					<ApTreeView
						items={organizationData}
						selectedItemId={selectedTeamMember}
						onSelectedItemsChange={setSelectedTeamMember}
					/>
					{selectedTeamMember && (
						<SelectedInfo>
							Selected team member: <strong>{selectedTeamMember}</strong>
						</SelectedInfo>
					)}
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Expansion Control</SectionTitle>
				<TwoColumnGrid>
					<ComponentRow>
						<Label>All items expanded</Label>
						<ApTreeView items={simpleData} expanded={true} />
					</ComponentRow>
					<ComponentRow>
						<Label>All items collapsed (default)</Label>
						<ApTreeView items={simpleData} expanded={false} />
					</ComponentRow>
				</TwoColumnGrid>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Specific Items Expanded</SectionTitle>
				<ComponentRow>
					<Label>
						Only &quot;src&quot; and &quot;components&quot; folders expanded
					</Label>
					<ApTreeView items={fileSystemData} expanded={["1", "2"]} />
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Flat List Mode</SectionTitle>
				<ComponentRow>
					<Label>Disable expand/collapse for flat display</Label>
					<ApTreeView items={fileSystemData} disableExpandCollapse />
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Disabled Items</SectionTitle>
				<TwoColumnGrid>
					<ComponentRow>
						<Label>File system with disabled file (About.tsx)</Label>
						<ApTreeView items={fileSystemData} expanded={["1", "5"]} />
					</ComponentRow>
					<ComponentRow>
						<Label>Organization with disabled member (David Brown)</Label>
						<ApTreeView items={organizationData} expanded={true} />
					</ComponentRow>
				</TwoColumnGrid>
			</ShowcaseSection>
		</PageContainer>
	);
}
