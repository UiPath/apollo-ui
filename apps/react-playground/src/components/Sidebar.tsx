import { useLocation } from "react-router-dom";
import {
	NavIcon,
	NavLabel,
	NavLink,
	NavSection,
	Overlay,
	SidebarContainer,
	SidebarNav,
	SubNav,
	SubNavLink,
} from "./Sidebar.styles";

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
	const location = useLocation();

	const navigation = [
		{
			label: "Home",
			path: "/",
			icon: "🏠",
		},
		{
			label: "Core",
			path: "/core",
			icon: "🎨",
			children: [
				{ label: "CSS Variables", path: "/core/css-variables" },
				{ label: "Colors", path: "/core/colors" },
				{ label: "Typography", path: "/core/fonts" },
				{ label: "Spacing & Padding", path: "/core/spacing" },
				{ label: "Shadows", path: "/core/shadows" },
				{ label: "Borders & Strokes", path: "/core/borders" },
				{ label: "Icons", path: "/core/icons" },
				{ label: "Breakpoints", path: "/core/screens" },
			],
		},
		{
			label: "Components",
			path: "/components",
			icon: "🧩",
		},
	];

	const isActivePath = (path: string) => {
		if (path === "/") {
			return location.pathname === "/";
		}
		return location.pathname.startsWith(path);
	};

	return (
		<>
			{isOpen && <Overlay onClick={onClose} />}

			<SidebarContainer $isOpen={isOpen}>
				<SidebarNav>
					{navigation.map((item) => (
						<NavSection key={item.path}>
							<NavLink
								to={item.path}
								onClick={onClose}
								$isActive={isActivePath(item.path)}
							>
								<NavIcon>{item.icon}</NavIcon>
								<NavLabel>{item.label}</NavLabel>
							</NavLink>

							{item.children && (
								<SubNav>
									{item.children.map((child) => (
										<SubNavLink
											key={child.path}
											to={child.path}
											onClick={onClose}
											$isActive={location.pathname === child.path}
										>
											{child.label}
										</SubNavLink>
									))}
								</SubNav>
							)}
						</NavSection>
					))}
				</SidebarNav>
			</SidebarContainer>
		</>
	);
}
