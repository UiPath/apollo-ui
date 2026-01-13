import { ApIcon } from "@uipath/apollo-react/material/components";
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

const SectionDescription = styled.p`
  font-size: 14px;
  color: var(--color-foreground-de-emp);
  margin-bottom: 16px;
`;

const ComponentRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 24px;
  background: var(--color-background);
  border-radius: 12px;
  border: 2px solid var(--color-border);
  align-items: center;
`;

const IconItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  min-width: 100px;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);
  }
`;

const Label = styled.div`
  font-size: 11px;
  color: var(--color-foreground-de-emp);
  font-weight: 600;
  text-align: center;
  word-break: break-word;
`;

const SearchInput = styled.input`
  padding: 12px 16px;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--color-background);
  color: var(--color-foreground-emp);
  margin-bottom: 16px;
  width: 100%;
  max-width: 400px;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

const materialIcons = [
	"home",
	"search",
	"settings",
	"favorite",
	"star",
	"delete",
	"edit",
	"check",
	"close",
	"add",
	"remove",
	"arrow_forward",
	"arrow_back",
	"arrow_upward",
	"arrow_downward",
	"expand_more",
	"expand_less",
	"menu",
	"more_vert",
	"more_horiz",
	"info",
	"warning",
	"error",
	"help",
	"visibility",
	"visibility_off",
	"person",
	"lock",
	"check_circle",
	"cancel",
	"save",
	"download",
	"upload",
	"refresh",
	"folder",
	"folder_open",
	"description",
] as const;

const customIcons = [
	{ name: "agent", label: "Agent" },
	{ name: "agentic_process", label: "Agentic Process" },
	{ name: "api_automation", label: "API Automation" },
	{ name: "app", label: "App" },
	{ name: "arrow_down", label: "Arrow Down" },
	{ name: "arrow_right", label: "Arrow Right" },
	{ name: "attention_badge", label: "Attention Badge" },
	{ name: "automation", label: "Automation" },
	{ name: "autopilot", label: "Autopilot" },
	{ name: "autopilot_color", label: "Autopilot Color" },
	{ name: "autopilot_toggle", label: "Autopilot Toggle" },
	{ name: "basic_auth_user", label: "Basic Auth User" },
	{ name: "book_2", label: "Book 2" },
	{ name: "burger", label: "Burger" },
	{ name: "category", label: "Category" },
	{ name: "chevron", label: "Chevron" },
	{ name: "cloud_download", label: "Cloud Download" },
	{ name: "dashboard", label: "Dashboard" },
	{ name: "date_time", label: "Date Time" },
	{ name: "directory_app", label: "Directory App" },
	{ name: "directory_group", label: "Directory Group" },
	{ name: "directory_user", label: "Directory User" },
	{ name: "error", label: "Error" },
	{ name: "expand_message", label: "Expand Message" },
	{ name: "history", label: "History" },
	{ name: "info", label: "Info" },
	{ name: "library", label: "Library" },
	{ name: "line_arrow", label: "Line Arrow" },
	{ name: "line_arrow_left", label: "Line Arrow Left" },
	{ name: "line_arrow_right", label: "Line Arrow Right" },
	{ name: "local_group", label: "Local Group" },
	{ name: "machine", label: "Machine" },
	{ name: "model", label: "Model" },
	{ name: "navigate_browser", label: "Navigate Browser" },
	{ name: "new_chat", label: "New Chat" },
	{ name: "right_panel_close", label: "Right Panel Close" },
	{ name: "right_panel_open", label: "Right Panel Open" },
	{ name: "robot", label: "Robot" },
	{ name: "screenplay", label: "Screenplay" },
	{ name: "success", label: "Success" },
	{ name: "template", label: "Template" },
	{ name: "user", label: "User" },
	{ name: "waffle", label: "Waffle" },
	{ name: "warning", label: "Warning" },
	{ name: "website", label: "Website" },
] as const;

const sizes = ["16px", "24px", "32px", "48px"] as const;

export function IconShowcase() {
	const [searchTerm, setSearchTerm] = useState("");

	const filteredCustomIcons = customIcons.filter(
		(icon) =>
			icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			icon.label.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	return (
		<PageContainer>
			<PageTitle>Icon</PageTitle>
			<PageDescription>
				Icon component with support for Material Icons (normal & outlined) and
				custom UiPath icons
			</PageDescription>

			<ShowcaseSection>
				<SectionTitle>Material Icons (Normal Variant)</SectionTitle>
				<SectionDescription>
					Standard Material Design icons using the "normal" variant
				</SectionDescription>
				<ComponentRow>
					{materialIcons.map((icon) => (
						<IconItem key={icon}>
							<ApIcon name={icon} variant="normal" size="24px" />
							<Label>{icon}</Label>
						</IconItem>
					))}
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Material Icons (Outlined Variant)</SectionTitle>
				<SectionDescription>
					Outlined version of Material Design icons
				</SectionDescription>
				<ComponentRow>
					{materialIcons.slice(0, 18).map((icon) => (
						<IconItem key={icon}>
							<ApIcon name={icon} variant="outlined" size="24px" />
							<Label>{icon}</Label>
						</IconItem>
					))}
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>
					Custom UiPath Icons ({filteredCustomIcons.length} icons)
				</SectionTitle>
				<SectionDescription>
					Custom icon set from UiPath legacy portal icons
				</SectionDescription>
				<SearchInput
					type="text"
					placeholder="Search custom icons..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
				<ComponentRow>
					{filteredCustomIcons.map((icon) => (
						<IconItem key={icon.name}>
							<ApIcon name={icon.name} variant="custom" size="24px" />
							<Label>{icon.label}</Label>
						</IconItem>
					))}
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Sizes</SectionTitle>
				<SectionDescription>
					Icons can be displayed in different sizes
				</SectionDescription>
				<ComponentRow>
					{sizes.map((size) => (
						<IconItem key={size}>
							<ApIcon name="star" size={size} />
							<Label>{size}</Label>
						</IconItem>
					))}
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Custom Colors (Material)</SectionTitle>
				<SectionDescription>
					Material icons with custom colors applied
				</SectionDescription>
				<ComponentRow>
					<IconItem>
						<ApIcon name="favorite" color="var(--color-primary)" size="32px" />
						<Label>Primary</Label>
					</IconItem>
					<IconItem>
						<ApIcon
							name="favorite"
							color="var(--color-brand-primary)"
							size="32px"
						/>
						<Label>Brand Orange</Label>
					</IconItem>
					<IconItem>
						<ApIcon name="favorite" color="var(--color-secondary)" size="32px" />
						<Label>Purple</Label>
					</IconItem>
					<IconItem>
						<ApIcon name="favorite" color="#00ff00" size="32px" />
						<Label>Green</Label>
					</IconItem>
					<IconItem>
						<ApIcon name="favorite" color="#ff0000" size="32px" />
						<Label>Red</Label>
					</IconItem>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Custom Colors (Custom Icons)</SectionTitle>
				<SectionDescription>
					Custom UiPath icons with custom colors applied
				</SectionDescription>
				<ComponentRow>
					<IconItem>
						<ApIcon
							name="robot"
							variant="custom"
							color="var(--color-primary)"
							size="32px"
						/>
						<Label>Primary</Label>
					</IconItem>
					<IconItem>
						<ApIcon
							name="robot"
							variant="custom"
							color="var(--color-brand-primary)"
							size="32px"
						/>
						<Label>Brand Orange</Label>
					</IconItem>
					<IconItem>
						<ApIcon
							name="robot"
							variant="custom"
							color="var(--color-secondary)"
							size="32px"
						/>
						<Label>Purple</Label>
					</IconItem>
					<IconItem>
						<ApIcon
							name="agent"
							variant="custom"
							color="#00ff00"
							size="32px"
						/>
						<Label>Agent (Green)</Label>
					</IconItem>
					<IconItem>
						<ApIcon
							name="automation"
							variant="custom"
							color="#0066ff"
							size="32px"
						/>
						<Label>Automation (Blue)</Label>
					</IconItem>
				</ComponentRow>
			</ShowcaseSection>
		</PageContainer>
	);
}
