import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AppContainer, MainContent } from "./App.styles";
import { Breadcrumb } from "./components/Breadcrumb";
import { Sidebar } from "./components/Sidebar";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Borders } from "./pages/Borders";
import { Colors } from "./pages/Colors";
import { ComponentsHome } from "./pages/ComponentsHome";
import { CoreHome } from "./pages/CoreHome";
import { CssVariables } from "./pages/CssVariables";
import { Fonts } from "./pages/Fonts";
import { Icons } from "./pages/Icons";
import { MainHome } from "./pages/MainHome";
import { MaterialHome } from "./pages/MaterialHome";
import { Screens } from "./pages/Screens";
import { Shadows } from "./pages/Shadows";
import { Spacing } from "./pages/Spacing";
import { AccordionShowcase } from "./pages/components/AccordionShowcase";
import { AlertBarShowcase } from "./pages/components/AlertBarShowcase";
import { ApChatShowcase } from "./pages/components/ApChatShowcase";
import { BadgeShowcase } from "./pages/components/BadgeShowcase";
import { ButtonShowcase } from "./pages/components/ButtonShowcase";
import { ChipShowcase } from "./pages/components/ChipShowcase";
import { CircularProgressShowcase } from "./pages/components/CircularProgressShowcase";
import { IconButtonShowcase } from "./pages/components/IconButtonShowcase";
import { IconShowcase } from "./pages/components/IconShowcase";
import { LinkShowcase } from "./pages/components/LinkShowcase";
import { MenuShowcase } from "./pages/components/MenuShowcase";
import { ProgressSpinnerShowcase } from "./pages/components/ProgressSpinnerShowcase";
import { SkeletonShowcase } from "./pages/components/SkeletonShowcase";
import { TextAreaShowcase } from "./pages/components/TextAreaShowcase";
import { TextFieldShowcase } from "./pages/components/TextFieldShowcase";
import { ToolCallShowcase } from "./pages/components/ToolCallShowcase";
import { TooltipShowcase } from "./pages/components/TooltipShowcase";
import { TreeViewShowcase } from "./pages/components/TreeViewShowcase";
import { TypographyShowcase } from "./pages/components/TypographyShowcase";
import { MaterialAlert } from "./pages/material/MaterialAlert";
import { MaterialAutocomplete } from "./pages/material/MaterialAutocomplete";
import { MaterialButtonBase } from "./pages/material/MaterialButtonBase";
import { MaterialButtons } from "./pages/material/MaterialButtons";
import { MaterialCheckbox } from "./pages/material/MaterialCheckbox";
import { MaterialChip } from "./pages/material/MaterialChip";
import { MaterialCircularProgress } from "./pages/material/MaterialCircularProgress";
import { MaterialDatepicker } from "./pages/material/MaterialDatepicker";
import { MaterialDialog } from "./pages/material/MaterialDialog";
import { MaterialDivider } from "./pages/material/MaterialDivider";
import { MaterialFormControls } from "./pages/material/MaterialFormControls";
import { MaterialInputBase } from "./pages/material/MaterialInputBase";
import { MaterialInputs } from "./pages/material/MaterialInputs";
import { MaterialLinearProgress } from "./pages/material/MaterialLinearProgress";
import { MaterialLink } from "./pages/material/MaterialLink";
import { MaterialList } from "./pages/material/MaterialList";
import { MaterialMenuItem } from "./pages/material/MaterialMenuItem";
import { MaterialRadio } from "./pages/material/MaterialRadio";
import { MaterialSelect } from "./pages/material/MaterialSelect";
import { MaterialSlider } from "./pages/material/MaterialSlider";
import { MaterialSnackbar } from "./pages/material/MaterialSnackbar";
import { MaterialStepper } from "./pages/material/MaterialStepper";
import { MaterialSwitch } from "./pages/material/MaterialSwitch";
import { MaterialTabs } from "./pages/material/MaterialTabs";
import { MaterialTextField } from "./pages/material/MaterialTextField";
import { MaterialTooltip } from "./pages/material/MaterialTooltip";
import { MaterialTypography } from "./pages/material/MaterialTypography";
import { ApSankeyShowcase } from "./pages/components/ApSankeyShowcase";

function App() {
	return (
		<ThemeProvider>
			<BrowserRouter>
				<AppContainer>
					<Sidebar />
					<MainContent>
						<Breadcrumb />
						<Routes>
							<Route path="/" element={<MainHome />} />
							<Route path="/core" element={<CoreHome />} />
							<Route path="/core/css-variables" element={<CssVariables />} />
							<Route path="/core/colors" element={<Colors />} />
							<Route path="/core/fonts" element={<Fonts />} />
							<Route path="/core/spacing" element={<Spacing />} />
							<Route path="/core/shadows" element={<Shadows />} />
							<Route path="/core/borders" element={<Borders />} />
							<Route path="/core/icons" element={<Icons />} />
							<Route path="/core/screens" element={<Screens />} />
							<Route path="/material" element={<MaterialHome />} />
							<Route path="/material/alert" element={<MaterialAlert />} />
							<Route
								path="/material/autocomplete"
								element={<MaterialAutocomplete />}
							/>
							<Route
								path="/material/button-base"
								element={<MaterialButtonBase />}
							/>
							<Route path="/material/buttons" element={<MaterialButtons />} />
							<Route path="/material/checkbox" element={<MaterialCheckbox />} />
							<Route path="/material/chip" element={<MaterialChip />} />
							<Route
								path="/material/circular-progress"
								element={<MaterialCircularProgress />}
							/>
							<Route
								path="/material/datepicker"
								element={<MaterialDatepicker />}
							/>
							<Route path="/material/dialog" element={<MaterialDialog />} />
							<Route path="/material/divider" element={<MaterialDivider />} />
							<Route
								path="/material/form-controls"
								element={<MaterialFormControls />}
							/>
							<Route
								path="/material/input-base"
								element={<MaterialInputBase />}
							/>
							<Route path="/material/inputs" element={<MaterialInputs />} />
							<Route
								path="/material/linear-progress"
								element={<MaterialLinearProgress />}
							/>
							<Route path="/material/link" element={<MaterialLink />} />
							<Route path="/material/list" element={<MaterialList />} />
							<Route
								path="/material/menu-item"
								element={<MaterialMenuItem />}
							/>
							<Route path="/material/radio" element={<MaterialRadio />} />
							<Route path="/material/select" element={<MaterialSelect />} />
							<Route path="/material/slider" element={<MaterialSlider />} />
							<Route path="/material/snackbar" element={<MaterialSnackbar />} />
							<Route path="/material/stepper" element={<MaterialStepper />} />
							<Route path="/material/switch" element={<MaterialSwitch />} />
							<Route path="/material/tabs" element={<MaterialTabs />} />
							<Route
								path="/material/text-field"
								element={<MaterialTextField />}
							/>
							<Route path="/material/tooltip" element={<MaterialTooltip />} />
							<Route
								path="/material/typography"
								element={<MaterialTypography />}
							/>
							<Route path="/components" element={<ComponentsHome />} />
							<Route
								path="/components/accordion"
								element={<AccordionShowcase />}
							/>
							<Route
								path="/components/alert-bar"
								element={<AlertBarShowcase />}
							/>
							<Route path="/components/badge" element={<BadgeShowcase />} />
							<Route path="/components/button" element={<ButtonShowcase />} />
							<Route path="/components/chat" element={<ApChatShowcase />} />
							<Route path="/components/chip" element={<ChipShowcase />} />
							<Route path="/components/link" element={<LinkShowcase />} />
							<Route
								path="/components/skeleton"
								element={<SkeletonShowcase />}
							/>
							<Route
								path="/components/text-area"
								element={<TextAreaShowcase />}
							/>
							<Route
								path="/components/text-field"
								element={<TextFieldShowcase />}
							/>
							<Route
								path="/components/tool-call"
								element={<ToolCallShowcase />}
							/>
							<Route
								path="/components/tree-view"
								element={<TreeViewShowcase />}
							/>
							<Route
								path="/components/typography"
								element={<TypographyShowcase />}
							/>
							<Route
								path="/components/circular-progress"
								element={<CircularProgressShowcase />}
							/>
							<Route path="/components/icon" element={<IconShowcase />} />
							<Route
								path="/components/icon-button"
								element={<IconButtonShowcase />}
							/>
							<Route path="/components/menu" element={<MenuShowcase />} />
							<Route
								path="/components/progress-spinner"
								element={<ProgressSpinnerShowcase />}
							/>
							<Route path="/components/tooltip" element={<TooltipShowcase />} />
							<Route
								path="/components/sankey-diagram"
								element={<ApSankeyShowcase />}
							/>
						</Routes>
					</MainContent>
				</AppContainer>
			</BrowserRouter>
		</ThemeProvider>
	);
}

export default App;
