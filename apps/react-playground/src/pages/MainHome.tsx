import {
	Header,
	MainContainer,
	MainDescription,
	MainTitle,
	SectionCard,
	SectionDescription,
	SectionGrid,
	SectionIcon,
	SectionLink,
	SectionTitle,
	WipBadge,
} from "./MainHome.styles";

export function MainHome() {
	const sections = [
		{
			title: "Core",
			description:
				"Design tokens, colors, typography, spacing, and foundational elements",
			path: "/core",
			icon: "🎨",
			status: "available",
		},
		{
			title: "Material Overrides",
			description:
				"Material UI component theme overrides with Apollo design system",
			path: "/material",
			icon: "🎭",
			status: "available",
		},
		{
			title: "Components",
			description: "React components library built with Apollo design system",
			path: "/components",
			icon: "🧩",
			status: "wip",
		},
	];

	return (
		<MainContainer>
			<Header>
				<MainTitle>Apollo React</MainTitle>
				<MainDescription>
					Explore our design tokens and component library
				</MainDescription>
			</Header>

			<SectionGrid>
				{sections.map((section) => (
					<SectionLink key={section.path} to={section.path}>
						<SectionCard
							$opacity={section.status === "wip" ? 0.6 : 1}
							onMouseEnter={(e) => {
								if (section.status === "available") {
									e.currentTarget.style.transform = "translateY(-8px)";
									e.currentTarget.style.boxShadow =
										"var(--shadow-hover-primary)";
									e.currentTarget.style.borderColor = "var(--color-primary)";
								}
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.transform = "translateY(0)";
								e.currentTarget.style.boxShadow = "var(--shadow-hover-md)";
								e.currentTarget.style.borderColor = "var(--color-border)";
							}}
						>
							{section.status === "wip" && <WipBadge>WIP</WipBadge>}

							<SectionIcon>{section.icon}</SectionIcon>
							<SectionTitle>{section.title}</SectionTitle>
							<SectionDescription>{section.description}</SectionDescription>
						</SectionCard>
					</SectionLink>
				))}
			</SectionGrid>
		</MainContainer>
	);
}
