import { useTheme } from "../contexts/ThemeContext";
import {
	CheckboxBox,
	CheckboxInput,
	CheckboxLabel,
	CheckboxText,
	HighContrastCheckbox,
	ThemeControls,
	ToggleButton,
} from "./ThemeToggle.styles";

export function ThemeToggle() {
	const { theme, highContrast, toggleTheme, toggleHighContrast } = useTheme();

	return (
		<ThemeControls>
			<ToggleButton
				onClick={toggleTheme}
				aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
				title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
			>
				{theme === "light" ? "🌙" : "☀️"}
			</ToggleButton>

			<HighContrastCheckbox>
				<CheckboxLabel>
					<CheckboxInput
						type="checkbox"
						checked={highContrast}
						onChange={toggleHighContrast}
						aria-label="Toggle high contrast mode"
					/>
					<CheckboxBox $checked={highContrast}>
						{highContrast && "✓"}
					</CheckboxBox>
					<CheckboxText>High Contrast</CheckboxText>
				</CheckboxLabel>
			</HighContrastCheckbox>
		</ThemeControls>
	);
}
