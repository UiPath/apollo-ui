import { Link } from "react-router-dom";
import { PageContainer } from "../components/SharedStyles";
import {
	ComponentCard,
	ComponentGrid,
	ComponentIcon,
	ComponentLabel,
	Description,
	FeatureCard,
	FeaturesGrid,
	FeatureTitle,
	Subtitle,
	Title,
} from "./MaterialHome.styles";

export function ComponentsHome() {
	const components = [
		{ label: "Accordion", path: "/components/accordion", icon: "📂" },
		{ label: "Alert Bar", path: "/components/alert-bar", icon: "⚠️" },
		{ label: "Badge", path: "/components/badge", icon: "🏷️" },
		{ label: "Button", path: "/components/button", icon: "🔘" },
		{ label: "Chat", path: "/components/chat", icon: "💬" },
		{ label: "Chip", path: "/components/chip", icon: "🔖" },
		{
			label: "Circular Progress",
			path: "/components/circular-progress",
			icon: "🔄",
		},
		{ label: "Icon", path: "/components/icon", icon: "⭐" },
		{ label: "Icon Button", path: "/components/icon-button", icon: "🎯" },
		{ label: "Popover", path: "/components/popover", icon: "📋" },
		{ label: "Link", path: "/components/link", icon: "🔗" },
		{ label: "Menu", path: "/components/menu", icon: "☰" },
		{ label: "Modal", path: "/components/modal", icon: "🪟" },
		{
			label: "Progress Spinner",
			path: "/components/progress-spinner",
			icon: "⌛",
		},
		{ label: "Skeleton", path: "/components/skeleton", icon: "⏳" },
		{ label: "Text Area", path: "/components/text-area", icon: "📝" },
		{ label: "Text Field", path: "/components/text-field", icon: "✏️" },
		{ label: "Tool Call", path: "/components/tool-call", icon: "🔧" },
		{ label: "Tooltip", path: "/components/tooltip", icon: "💭" },
		{ label: "Tree View", path: "/components/tree-view", icon: "🌳" },
		{ label: "Typography", path: "/components/typography", icon: "🔤" },
	];

	return (
		<PageContainer>
			<Title>Apollo Components</Title>
			<Subtitle>
				Full-featured React components built with the Apollo Design System
			</Subtitle>
			<Description>
				These are complete, production-ready components that leverage Apollo
				design tokens and provide rich functionality out of the box. Each
				component is fully customizable and integrates seamlessly with your
				application.
			</Description>

			<FeaturesGrid>
				<FeatureCard>
					<ComponentIcon>🎨</ComponentIcon>
					<FeatureTitle>Apollo Design Tokens</FeatureTitle>
					<p>
						Built from the ground up using Apollo core tokens for consistent
						styling
					</p>
				</FeatureCard>
				<FeatureCard>
					<ComponentIcon>🌓</ComponentIcon>
					<FeatureTitle>Theme Support</FeatureTitle>
					<p>Full light and dark mode support with multiple theme variants</p>
				</FeatureCard>
				<FeatureCard>
					<ComponentIcon>🔧</ComponentIcon>
					<FeatureTitle>Highly Configurable</FeatureTitle>
					<p>
						Extensive configuration options to adapt components to your needs
					</p>
				</FeatureCard>
			</FeaturesGrid>

			<ComponentGrid>
				{components.map((component) => (
					<Link
						key={component.path}
						to={component.path}
						style={{ textDecoration: "none", color: "inherit" }}
					>
						<ComponentCard>
							<ComponentIcon>{component.icon}</ComponentIcon>
							<ComponentLabel>{component.label}</ComponentLabel>
						</ComponentCard>
					</Link>
				))}
			</ComponentGrid>
		</PageContainer>
	);
}
