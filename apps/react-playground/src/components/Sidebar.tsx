import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
	FolderChevron,
	FolderIcon,
	FolderItem,
	FolderLabel,
	FolderSearchIcon,
	FolderSearchInput,
	FolderSearchWrap,
	FolderTree,
	OrchestratorHeader,
	OrchestratorLogo,
	OrchestratorTitle,
	ProtoLink,
	PrototypesChevron,
	PrototypesHeader,
	PrototypesLinks,
	PrototypesSection,
	SidebarContainer,
	SidebarDivider,
	SidebarNav,
	TopNav,
	TopNavIcon,
	TopNavItem,
} from "./Sidebar.styles";

// ─────────────────────────────────────────────────────────────────────────────
// Folder tree mock data (matches the Orchestrator screenshot)
// ─────────────────────────────────────────────────────────────────────────────

interface FolderNode {
	id: string;
	label: string;
	children?: FolderNode[];
}

const FOLDER_TREE: FolderNode[] = [
	{ id: "demo-gs", label: "Demo GS Invoice Proce…" },
	{ id: "lead-scoring", label: "Lead scoring agent 2 1…" },
	{
		id: "maestro-1",
		label: "Maestro w multiple ent…",
		children: [
			{ id: "maestro-1a", label: "Sub-folder A" },
			{ id: "maestro-1b", label: "Sub-folder B" },
		],
	},
	{ id: "maestro-2", label: "Maestro w multiple ent…" },
	{ id: "maestro-3", label: "Maestro w multiple ent…" },
	{ id: "maestro-4", label: "Maestro w multiple ent…" },
	{ id: "maestro-5", label: "Maestro w multiple ent…" },
	{ id: "solution-api", label: "Solution w API" },
	{ id: "solution-28", label: "Solution 28" },
	{ id: "solution-cs", label: "Solution with CS" },
	{ id: "solution-cs2", label: "Solution with CS 2" },
	{ id: "agent-3api", label: "agent with 3 api wfs" },
	{ id: "api-4", label: "api 4" },
	{
		id: "demo-trigger",
		label: "demo trigger",
		children: [
			{ id: "demo-trigger-a", label: "Child trigger A" },
		],
	},
	{ id: "destination-high", label: "destination high" },
	{ id: "destination-low", label: "destination low" },
	{ id: "dev-work", label: "dev work" },
	{ id: "fara-numere", label: "fara numere" },
	{ id: "folder-w-feed", label: "folder w feed" },
	{ id: "hw-solution", label: "hw solution" },
	{ id: "interm", label: "interm" },
];

const PROTOTYPES = [
	{ label: "Execution Target (OR-92995)", path: "/prototypes/execution-target" },
	{ label: "User Event Triggers", path: "/prototypes/user-event-triggers" },
];

// ─────────────────────────────────────────────────────────────────────────────

export function Sidebar() {
	const location = useLocation();

	const [selectedFolder, setSelectedFolder] = useState("maestro-5");
	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
		new Set(["maestro-1"]),
	);
	const [folderSearch, setFolderSearch] = useState("");
	const [activeTopNav, setActiveTopNav] = useState<string | null>(null);
	const [prototypesExpanded, setPrototypesExpanded] = useState(true);

	const onPrototypePath = location.pathname.startsWith("/prototypes");

	function toggleFolder(id: string) {
		setExpandedFolders((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	function matchesSearch(label: string) {
		if (!folderSearch) return true;
		return label.toLowerCase().includes(folderSearch.toLowerCase());
	}

	function renderFolder(node: FolderNode, depth = 0) {
		const hasChildren = !!node.children?.length;
		const expanded = expandedFolders.has(node.id);
		const isActive = selectedFolder === node.id;

		// Filter: show node if it or any descendant matches search
		const selfMatches = matchesSearch(node.label);
		const childMatches = node.children?.some((c) => matchesSearch(c.label));
		if (!selfMatches && !childMatches) return null;

		return (
			<div key={node.id}>
				<FolderItem
					$isActive={isActive}
					$depth={depth}
					onClick={() => {
						setSelectedFolder(node.id);
						setActiveTopNav(null);
						if (hasChildren) toggleFolder(node.id);
					}}
					title={node.label}
				>
					<FolderChevron
						$visible={hasChildren}
						$expanded={expanded}
					>
						▶
					</FolderChevron>
					<FolderIcon>{hasChildren ? (expanded ? "📂" : "📁") : "📁"}</FolderIcon>
					<FolderLabel>{node.label}</FolderLabel>
				</FolderItem>

				{hasChildren && expanded && (
					<div>
						{node.children!.map((child) => renderFolder(child, depth + 1))}
					</div>
				)}
			</div>
		);
	}

	return (
		<SidebarContainer>
			{/* ── UiPath Orchestrator branding ────────────── */}
			<OrchestratorHeader>
				<OrchestratorLogo>U</OrchestratorLogo>
				<OrchestratorTitle>Orchestrator</OrchestratorTitle>
			</OrchestratorHeader>

			<SidebarNav>
				{/* ── Top nav items ─────────────────────────── */}
				<TopNav>
					{[
						{ id: "tenant", icon: "🏢", label: "Tenant" },
						{ id: "registry", icon: "📦", label: "Registry" },
						{ id: "my-folders", icon: "📂", label: "My Folders" },
					].map(({ id, icon, label }) => (
						<TopNavItem
							key={id}
							$isActive={activeTopNav === id}
							onClick={() => {
								setActiveTopNav((prev) => (prev === id ? null : id));
								setSelectedFolder("");
							}}
						>
							<TopNavIcon>{icon}</TopNavIcon>
							{label}
						</TopNavItem>
					))}
				</TopNav>

				<SidebarDivider />

				{/* ── Folder search ──────────────────────────── */}
				<FolderSearchWrap>
					<FolderSearchIcon>🔍</FolderSearchIcon>
					<FolderSearchInput
						placeholder="Search"
						value={folderSearch}
						onChange={(e) => setFolderSearch(e.target.value)}
					/>
				</FolderSearchWrap>

				{/* ── Folder tree ────────────────────────────── */}
				<FolderTree>
					{FOLDER_TREE.map((node) => renderFolder(node))}
				</FolderTree>

				{/* ── Prototypes nav ─────────────────────────── */}
				<PrototypesSection>
					<PrototypesHeader
						$isActive={onPrototypePath}
						onClick={() => setPrototypesExpanded((p) => !p)}
					>
						🧪 Prototypes
						<PrototypesChevron $expanded={prototypesExpanded}>▼</PrototypesChevron>
					</PrototypesHeader>
					<PrototypesLinks $expanded={prototypesExpanded}>
						{PROTOTYPES.map(({ label, path }) => (
							<ProtoLink
								key={path}
								to={path}
								$isActive={location.pathname === path}
								title={label}
							>
								{label}
							</ProtoLink>
						))}
					</PrototypesLinks>
				</PrototypesSection>
			</SidebarNav>
		</SidebarContainer>
	);
}
