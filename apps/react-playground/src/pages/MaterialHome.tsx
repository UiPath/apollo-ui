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

export function MaterialHome() {
	const components = [
		{ label: "Alert", path: "/material/alert", icon: "⚠️" },
		{ label: "Autocomplete", path: "/material/autocomplete", icon: "🔍" },
		{ label: "Button Base", path: "/material/button-base", icon: "⚪" },
		{ label: "Buttons", path: "/material/buttons", icon: "🔘" },
		{ label: "Checkbox", path: "/material/checkbox", icon: "☑️" },
		{ label: "Chip", path: "/material/chip", icon: "🏷️" },
		{
			label: "Circular Progress",
			path: "/material/circular-progress",
			icon: "⭕",
		},
		{ label: "Datepicker", path: "/material/datepicker", icon: "📅" },
		{ label: "Dialog", path: "/material/dialog", icon: "💬" },
		{ label: "Divider", path: "/material/divider", icon: "➖" },
		{ label: "Form Controls", path: "/material/form-controls", icon: "📋" },
		{ label: "Input Base", path: "/material/input-base", icon: "📥" },
		{ label: "Inputs", path: "/material/inputs", icon: "✏️" },
		{
			label: "Linear Progress",
			path: "/material/linear-progress",
			icon: "📊",
		},
		{ label: "Link", path: "/material/link", icon: "🔗" },
		{ label: "List", path: "/material/list", icon: "📃" },
		{ label: "Menu Item", path: "/material/menu-item", icon: "📝" },
		{ label: "Radio", path: "/material/radio", icon: "🔘" },
		{ label: "Select", path: "/material/select", icon: "📋" },
		{ label: "Slider", path: "/material/slider", icon: "🎚️" },
		{ label: "Snackbar", path: "/material/snackbar", icon: "📢" },
		{ label: "Stepper", path: "/material/stepper", icon: "🪜" },
		{ label: "Switch", path: "/material/switch", icon: "🔀" },
		{ label: "Tabs", path: "/material/tabs", icon: "📂" },
		{ label: "Text Field", path: "/material/text-field", icon: "✏️" },
		{ label: "Tooltip", path: "/material/tooltip", icon: "💭" },
		{ label: "Typography", path: "/material/typography", icon: "🔤" },
	];

	return (
		<PageContainer>
			<Title>Material UI Overrides</Title>
			<Subtitle>
				Apollo Design System theme customizations for Material UI components
			</Subtitle>
			<Description>
				These overrides apply Apollo design tokens to Material UI components,
				ensuring consistent styling across your application. Each component
				showcases the themed variants with interactive examples.
			</Description>

			<FeaturesGrid>
				<FeatureCard>
					<ComponentIcon>🎨</ComponentIcon>
					<FeatureTitle>Design Token Integration</FeatureTitle>
					<p>
						All overrides use Apollo core tokens for colors, spacing,
						typography, and more
					</p>
				</FeatureCard>
				<FeatureCard>
					<ComponentIcon>🌓</ComponentIcon>
					<FeatureTitle>Dark Mode Support</FeatureTitle>
					<p>
						Seamless light and dark theme support with automatic color
						adaptation
					</p>
				</FeatureCard>
				<FeatureCard>
					<ComponentIcon>♿</ComponentIcon>
					<FeatureTitle>Accessibility First</FeatureTitle>
					<p>
						Enhanced focus indicators and WCAG compliant contrast ratios
						throughout
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
