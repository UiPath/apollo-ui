import { ThemeProvider as MuiThemeProvider } from "@mui/material";
import {
	apolloMaterialUiThemeDark,
	apolloMaterialUiThemeDarkHC,
	apolloMaterialUiThemeFutureDark,
	apolloMaterialUiThemeFutureLight,
	apolloMaterialUiThemeLight,
	apolloMaterialUiThemeLightHC,
} from "@uipath/apollo-react/material/theme";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

export const THEMES = ["light", "dark", "future-light", "future-dark"] as const;
export type Theme = (typeof THEMES)[number];

const ALL_THEME_CLASSES = [
	"light",
	"dark",
	"light-hc",
	"dark-hc",
	"future-light",
	"future-dark",
];

/** High contrast variants only exist for the classic themes. */
const supportsHighContrast = (theme: Theme) =>
	theme === "light" || theme === "dark";

interface ThemeContextType {
	theme: Theme;
	highContrast: boolean;
	setTheme: (theme: Theme) => void;
	toggleHighContrast: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setTheme] = useState<Theme>(() => {
		const savedTheme = localStorage.getItem("theme") as Theme;
		return THEMES.includes(savedTheme) ? savedTheme : "light";
	});

	const [highContrast, setHighContrast] = useState<boolean>(() => {
		const savedHC = localStorage.getItem("highContrast");
		return savedHC === "true";
	});

	useEffect(() => {
		const root = document.body;
		root.classList.remove(...ALL_THEME_CLASSES);

		if (highContrast && supportsHighContrast(theme)) {
			root.classList.add(`${theme}-hc`);
		} else {
			root.classList.add(theme);
		}

		localStorage.setItem("theme", theme);
		localStorage.setItem("highContrast", String(highContrast));
	}, [theme, highContrast]);

	const toggleHighContrast = () => {
		setHighContrast((prev) => !prev);
	};

	const muiTheme = useMemo(() => {
		switch (theme) {
			case "future-dark":
				return apolloMaterialUiThemeFutureDark;
			case "future-light":
				return apolloMaterialUiThemeFutureLight;
			case "dark":
				return highContrast
					? apolloMaterialUiThemeDarkHC
					: apolloMaterialUiThemeDark;
			default:
				return highContrast
					? apolloMaterialUiThemeLightHC
					: apolloMaterialUiThemeLight;
		}
	}, [theme, highContrast]);

	return (
		<ThemeContext.Provider
			value={{ theme, highContrast, setTheme, toggleHighContrast }}
		>
			<MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
