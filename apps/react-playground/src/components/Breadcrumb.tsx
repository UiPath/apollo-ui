import { useLocation } from "react-router-dom";
import {
	BreadcrumbContainer,
	BreadcrumbInner,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbNav,
	BreadcrumbSeparator,
	BreadcrumbText,
} from "./Breadcrumb.styles";
import { ThemeToggle } from "./ThemeToggle";

export function Breadcrumb() {
	const location = useLocation();
	const pathnames = location.pathname.split("/").filter((x) => x);

	// Define human-readable labels for routes
	const routeLabels: Record<string, string> = {
		core: "Core",
		material: "Material Overrides",
		components: "Components",
		"css-variables": "CSS Variables",
		colors: "Colors",
		fonts: "Typography",
		spacing: "Spacing & Padding",
		shadows: "Shadows",
		borders: "Borders & Strokes",
		icons: "Icons",
		screens: "Breakpoints",
		// Material component routes
		alert: "Alert",
		autocomplete: "Autocomplete",
		"button-base": "Button Base",
		buttons: "Buttons",
		checkbox: "Checkbox",
		chip: "Chip",
		"circular-progress": "Circular Progress",
		datepicker: "Datepicker",
		dialog: "Dialog",
		divider: "Divider",
		"form-controls": "Form Controls",
		"input-base": "Input Base",
		inputs: "Inputs",
		"linear-progress": "Linear Progress",
		link: "Link",
		list: "List",
		"menu-item": "Menu Item",
		radio: "Radio",
		select: "Select",
		slider: "Slider",
		snackbar: "Snackbar",
		stepper: "Stepper",
		switch: "Switch",
		tabs: "Tabs",
		"text-field": "Text Field",
		tooltip: "Tooltip",
		typography: "Typography",
		// Apollo component routes
		"alert-bar": "Alert Bar",
		badge: "Badge",
		button: "Button",
		chat: "Chat",
		"text-area": "Text Area",
		"tool-call": "Tool Call",
		"tree-view": "Tree View",
		skeleton: "Skeleton",
	};

	return (
		<BreadcrumbContainer>
			<BreadcrumbInner>
				<BreadcrumbNav>
					<BreadcrumbLink to="/" $isActive={pathnames.length === 0}>
						Home
					</BreadcrumbLink>

					{pathnames.map((segment, index) => {
						const path = `/${pathnames.slice(0, index + 1).join("/")}`;
						const isLast = index === pathnames.length - 1;
						const label = routeLabels[segment] || segment;

						return (
							<BreadcrumbItem key={path}>
								<BreadcrumbSeparator>→</BreadcrumbSeparator>
								{isLast ? (
									<BreadcrumbText>{label}</BreadcrumbText>
								) : (
									<BreadcrumbLink to={path}>{label}</BreadcrumbLink>
								)}
							</BreadcrumbItem>
						);
					})}
				</BreadcrumbNav>
			</BreadcrumbInner>

			<ThemeToggle />
		</BreadcrumbContainer>
	);
}
