import { THEMES, type Theme, useTheme } from "../contexts/ThemeContext";
import {
	CheckboxBox,
	CheckboxInput,
	CheckboxLabel,
	CheckboxText,
	HighContrastCheckbox,
	ThemeControls,
	ThemeSelect,
} from "./ThemeToggle.styles";

const THEME_LABELS: Record<Theme, string> = {
	light: "☀️ Light",
	dark: "🌙 Dark",
	"future-light": "✨ Future Light",
	"future-dark": "🌌 Future Dark",
};

export function ThemeToggle() {
	const { theme, highContrast, setTheme, toggleHighContrast } = useTheme();
	const hcSupported = theme === "light" || theme === "dark";

	return (
		<ThemeControls>
			<ThemeSelect
				value={theme}
				onChange={(e) => setTheme(e.target.value as Theme)}
				aria-label="Select theme"
			>
				{THEMES.map((t) => (
					<option key={t} value={t}>
						{THEME_LABELS[t]}
					</option>
				))}
			</ThemeSelect>

			<HighContrastCheckbox>
				<CheckboxLabel $disabled={!hcSupported}>
					<CheckboxInput
						type="checkbox"
						checked={highContrast && hcSupported}
						onChange={toggleHighContrast}
						disabled={!hcSupported}
						aria-label="Toggle high contrast mode"
					/>
					<CheckboxBox $checked={highContrast && hcSupported}>
						{highContrast && hcSupported && "✓"}
					</CheckboxBox>
					<CheckboxText>High Contrast</CheckboxText>
				</CheckboxLabel>
			</HighContrastCheckbox>
		</ThemeControls>
	);
}
