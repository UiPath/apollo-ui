"use client";

import { type ChangeEvent, startTransition, useEffect, useState } from "react";
import { Button } from "@/registry/button/button";
import { Card } from "@/registry/card/card";
import { Input } from "@/registry/input/input";
import { Label } from "@/registry/label/label";
import type { ThemeConfig } from "@/registry/shell/shell-theme-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/tabs/tabs";
import { themes } from "../../themes";

const CUSTOM_THEME_STORAGE_KEY = "apollo-vertex-custom-theme";
const THEME_STORAGE_KEY = "apollo-vertex-theme";

const defaultCustomTheme: ThemeConfig = themes.default.config;

const colorFields = [
  { key: "background", label: "Background" },
  { key: "foreground", label: "Foreground" },
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
  { key: "destructive", label: "Destructive" },
  { key: "border", label: "Border" },
  { key: "muted", label: "Muted" },
] as const;

function linearToSrgb(val: number): number {
  if (val <= 0.0031308) {
    return 12.92 * val;
  }
  return 1.055 * val ** (1 / 2.4) - 0.055;
}
/**
 * Convert OKLCH string to Hex
 * @param {string} oklchString - OKLCH color string (e.g., "oklch(70% 0.15 30)" or "oklch(0.7 0.15 30deg)" or "oklch(1 0 0 / 10%)")
 * @returns {string} Hex color string (e.g., "#ff5733")
 */
function oklchToHex(oklchString: string): string {
  // Parse OKLCH string with optional alpha channel
  const match = oklchString.match(
    /oklch\s*\(\s*([0-9.]+)%?\s+([0-9.]+)\s+([0-9.]+)(?:deg)?(?:\s*\/\s*([0-9.]+)%?)?\s*\)/i,
  );

  if (!match) {
    throw new Error("Invalid OKLCH string format");
  }

  let l = parseFloat(match[1]);
  const c = parseFloat(match[2]);
  const h = parseFloat(match[3]);
  // Alpha is optional, defaults to 1 (fully opaque)
  let alpha = match[4] ? parseFloat(match[4]) : 1;

  // Convert percentage lightness to 0-1 range
  if (oklchString.includes("%") && match[1].includes("%")) {
    l = l / 100;
  }

  // Convert percentage alpha to 0-1 range (e.g., "/ 10%" means 10% opacity)
  if (match[4] && oklchString.includes(`/ ${match[4]}%`)) {
    alpha = alpha / 100;
  }

  // Convert OKLCH to OKLAB
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  // Convert OKLAB to linear RGB
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  let r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let b_rgb = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  // Convert linear RGB to sRGB
  r = linearToSrgb(r);
  g = linearToSrgb(g);
  b_rgb = linearToSrgb(b_rgb);

  // Clamp and convert to 8-bit
  r = Math.max(0, Math.min(255, Math.round(r * 255)));
  g = Math.max(0, Math.min(255, Math.round(g * 255)));
  b_rgb = Math.max(0, Math.min(255, Math.round(b_rgb * 255)));

  // For semi-transparent colors, we approximate against a dark background
  // This is a simplification since color pickers don't handle transparency well
  if (alpha < 1) {
    // Assume dark background ~20% lightness
    const bgValue = 51; // roughly 20% in sRGB
    r = Math.round(r * alpha + bgValue * (1 - alpha));
    g = Math.round(g * alpha + bgValue * (1 - alpha));
    b_rgb = Math.round(b_rgb * alpha + bgValue * (1 - alpha));
  }

  // Convert to hex
  return `#${[r, g, b_rgb].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

export function ThemeCustomizer() {
  const [customTheme, setCustomTheme] =
    useState<ThemeConfig>(defaultCustomTheme);
  const [activeTab, setActiveTab] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        setCustomTheme(parsed);
      } catch (e) {
        console.error("Failed to parse saved custom theme", e);
      }
    }
  }, []);

  const handleColorChange = (
    mode: "light" | "dark",
    field: string,
    value: string,
  ) => {
    startTransition(() => {
      const updatedTheme = {
        ...customTheme,
        [mode]: {
          ...customTheme[mode],
          [field]: value,
        },
      };

      setCustomTheme(updatedTheme);

      localStorage.setItem(
        CUSTOM_THEME_STORAGE_KEY,
        JSON.stringify(updatedTheme),
      );
      localStorage.setItem(THEME_STORAGE_KEY, "custom");

      window.dispatchEvent(
        new CustomEvent("theme-change", { detail: "custom" }),
      );
    });
  };

  const handleReset = () => {
    setCustomTheme(defaultCustomTheme);

    localStorage.setItem(
      CUSTOM_THEME_STORAGE_KEY,
      JSON.stringify(defaultCustomTheme),
    );
    localStorage.setItem(THEME_STORAGE_KEY, "custom");

    window.dispatchEvent(new CustomEvent("theme-change", { detail: "custom" }));
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(customTheme, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "custom-theme.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const imported = JSON.parse(content);
        setCustomTheme(imported);

        localStorage.setItem(
          CUSTOM_THEME_STORAGE_KEY,
          JSON.stringify(imported),
        );
        localStorage.setItem(THEME_STORAGE_KEY, "custom");

        window.dispatchEvent(
          new CustomEvent("theme-change", { detail: "custom" }),
        );

        alert("Theme imported and applied successfully!");
      } catch (_error) {
        alert("Failed to import theme. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleLoadPreset = (presetName: keyof typeof themes) => {
    const presetTheme = themes[presetName].config;
    setCustomTheme(presetTheme);

    // Save and apply instantly
    localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(presetTheme));
    localStorage.setItem(THEME_STORAGE_KEY, "custom");

    // Dispatch event to notify theme change
    window.dispatchEvent(new CustomEvent("theme-change", { detail: "custom" }));
  };

  const currentModeTheme = customTheme[activeTab];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Theme Editor</h3>
              <p className="text-sm text-muted-foreground">
                Changes apply instantly
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Reset to Default
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                Export
              </Button>
              <label>
                <Button variant="outline" size="sm" asChild>
                  <span>Import</span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Load from preset:</Label>
            <div className="flex gap-2">
              {Object.entries(themes).map(([key, theme]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadPreset(key as keyof typeof themes)}
                >
                  {theme.name}
                </Button>
              ))}
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "light" | "dark")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="light">Light Mode</TabsTrigger>
              <TabsTrigger value="dark">Dark Mode</TabsTrigger>
            </TabsList>

            <TabsContent value="light" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                {colorFields.map(({ key, label }) => {
                  const themeValue =
                    currentModeTheme?.[key as keyof typeof currentModeTheme] ||
                    "";
                  const isOklch = themeValue.includes("oklch");
                  const hexValue = isOklch
                    ? oklchToHex(themeValue)
                    : themeValue;

                  return (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={`light-${key}`}>{label}</Label>
                      <div className="flex gap-2 items-start">
                        <div className="flex-1 space-y-2">
                          <Input
                            id={`light-${key}`}
                            value={themeValue}
                            onChange={(e) =>
                              handleColorChange("light", key, e.target.value)
                            }
                            className="font-mono text-sm"
                            placeholder="oklch(...)"
                          />
                        </div>
                        <input
                          type="color"
                          value={hexValue}
                          className="w-10 h-10 rounded border cursor-pointer"
                          onChange={(e) => {
                            handleColorChange("light", key, e.target.value);
                          }}
                          title="Pick a color"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="dark" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                {colorFields.map(({ key, label }) => {
                  const themeValue =
                    currentModeTheme?.[key as keyof typeof currentModeTheme] ||
                    "";
                  const isOklch = themeValue.includes("oklch");
                  const hexValue = isOklch
                    ? oklchToHex(themeValue)
                    : themeValue;

                  return (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={`dark-${key}`}>{label}</Label>
                      <div className="flex gap-2 items-start">
                        <div className="flex-1 space-y-2">
                          <Input
                            id={`dark-${key}`}
                            value={themeValue}
                            onChange={(e) =>
                              handleColorChange("dark", key, e.target.value)
                            }
                            className="font-mono text-sm"
                            placeholder="oklch(...)"
                          />
                        </div>
                        <input
                          type="color"
                          value={hexValue}
                          className="w-10 h-10 rounded border cursor-pointer"
                          onChange={(e) => {
                            handleColorChange("dark", key, e.target.value);
                          }}
                          title="Pick a color"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Preview</h3>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="p-4 border rounded-lg bg-card text-card-foreground">
            <h4 className="font-semibold mb-2">Card Component</h4>
            <p className="text-muted-foreground">
              This is a preview of the card component with your custom theme.
            </p>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Input field" />
            <Input placeholder="Disabled" disabled />
          </div>
        </div>
      </Card>
    </div>
  );
}
