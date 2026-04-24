"use client";

import { Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import {
  brandingStore,
  type ThemeMode,
  useBrandingHasChanges,
  useBrandingStore,
} from "./branding-store";
import { hexToOklchString, toHexForPicker } from "./color-utils";

const DEFAULT_PRIMARY_COLOR = "oklch(0.64 0.115 208)";
const DEFAULT_ACCENT_COLOR = "oklch(0.78 0.112 207.1)";

const COLOR_FIELDS = [
  {
    key: "primaryColor" as const,
    label: "Primary",
    defaultValue: DEFAULT_PRIMARY_COLOR,
  },
  {
    key: "accentColor" as const,
    label: "Accent",
    defaultValue: DEFAULT_ACCENT_COLOR,
  },
];

export function CustomizeAppearance() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const branding = useBrandingStore();
  const hasChanges = useBrandingHasChanges();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void brandingStore.hydrate();
  }, []);

  useEffect(() => {
    if (!hasChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const isCustom = branding.themeMode === "custom";
  const hasLogo = !!branding.logoUrl;
  const hasAnyCustomization =
    isCustom ||
    !!branding.primaryColor ||
    !!branding.accentColor ||
    hasLogo ||
    !!branding.appTitle;

  const handleFieldChange = (key: keyof typeof branding, value: string) => {
    brandingStore.setCurrent({ [key]: value });
  };

  const handleModeChange = (mode: ThemeMode) => {
    if (mode === branding.themeMode) return;

    if (mode === "default") {
      brandingStore.setCurrent({
        themeMode: mode,
        primaryColor: "",
        accentColor: "",
      });
    } else {
      brandingStore.setCurrent({
        themeMode: mode,
        primaryColor: branding.primaryColor || DEFAULT_PRIMARY_COLOR,
        accentColor: branding.accentColor || DEFAULT_ACCENT_COLOR,
      });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Logo file is too large", {
        description: "Maximum size is 10MB.",
      });
      return;
    }

    if (file.size > 500 * 1024) {
      toast.warning("Large logo file", {
        description:
          "Consider using a smaller image (under 500KB) for better performance.",
      });
    }

    try {
      await brandingStore.stageLogo(file);
    } catch (error) {
      toast.error("Failed to read logo file", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleRemoveLogo = () => {
    brandingStore.removeLogo();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await brandingStore.save();
      toast.success("Settings saved", {
        description: "Your appearance changes have been applied.",
      });
    } catch (error) {
      toast.error("Failed to save settings", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      await brandingStore.reset();
      toast.success("Defaults restored", {
        description: "Appearance has been reset to defaults.",
      });
    } catch (error) {
      toast.error("Failed to reset settings", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="@container px-4 sm:px-6 lg:px-8 py-6">
      <PageHeader size="content">
        <PageHeaderTitle>Customize appearance</PageHeaderTitle>
        <PageHeaderDescription className="text-sm">
          Changes to the appearance apply to all users in your organization
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid grid-cols-4 @md:grid-cols-8 @3xl:grid-cols-12 gap-x-4 gap-y-8 mt-6">
        <div className="col-span-4 @md:col-span-8 @3xl:col-span-7 space-y-2">
          <Label>Company logo</Label>
          <div className="relative w-16 h-16 group/logo">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full border-2 border-dashed border-border rounded-lg overflow-hidden flex items-center justify-center bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
            >
              {hasLogo ? (
                <img
                  src={branding.logoUrl}
                  alt={branding.logoAlt || "Logo preview"}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
            {hasLogo && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity hover:bg-destructive/90"
                aria-label="Remove logo"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              void handleLogoUpload(e);
            }}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground">
            PNG or SVG, under 500KB recommended
          </p>
        </div>

        <div className="col-span-4 @md:col-span-8 @3xl:col-span-7 space-y-2">
          <Label htmlFor="app-title">Company name</Label>
          <Input
            id="app-title"
            type="text"
            value={branding.appTitle}
            onChange={(e) => handleFieldChange("appTitle", e.target.value)}
            placeholder="Enter company name..."
            className="max-w-sm"
          />
        </div>

        <div className="col-span-4 @md:col-span-8 @3xl:col-span-7">
          <Label>Theming</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Choose between built-in themes or a custom theme
          </p>
        </div>

        <div className="col-span-4 @md:col-span-4 @3xl:col-span-3 @3xl:col-start-1">
          <Card
            selectable="standard"
            selected={!isCustom}
            onClick={() => handleModeChange("default")}
          >
            <span className="text-base font-semibold text-foreground mb-1">
              Default themes
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Light, dark, and system preference.
            </p>
          </Card>
        </div>

        <div className="col-span-4 @md:col-span-4 @3xl:col-span-3">
          <Card
            selectable="standard"
            selected={isCustom}
            onClick={() => handleModeChange("custom")}
          >
            <span className="text-base font-semibold text-foreground mb-1">
              Custom theme
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Apply your brand colors. Light theme only.
            </p>
          </Card>
        </div>

        <Collapsible
          className="col-span-4 @md:col-span-8 @3xl:col-span-6 @3xl:col-start-1"
          open={isCustom}
        >
          <CollapsibleContent className="transition-opacity duration-200 data-[state=closed]:opacity-0 data-[state=open]:opacity-100">
            <div className="grid grid-cols-2 gap-4 pt-1">
              {COLOR_FIELDS.map(({ key, label, defaultValue }) => {
                const rawValue = branding[key];
                const displayValue = rawValue || defaultValue;
                const hexForPicker = toHexForPicker(displayValue);

                return (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={key}>{label}</Label>
                    <div className="relative">
                      <input
                        type="color"
                        value={hexForPicker}
                        className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded cursor-pointer border-0 p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded [&::-moz-color-swatch]:border-0"
                        onChange={(e) =>
                          handleFieldChange(
                            key,
                            hexToOklchString(e.target.value),
                          )
                        }
                        title={`Pick ${label.toLowerCase()} color`}
                      />
                      <Input
                        id={key}
                        value={displayValue}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        className="text-sm pl-10"
                        placeholder={defaultValue}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="col-span-4 @md:col-span-8 @3xl:col-span-6 @3xl:col-start-1 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              void handleReset();
            }}
            disabled={isSaving || !hasAnyCustomization}
          >
            Reset to defaults
          </Button>
          <Button
            onClick={() => {
              void handleSave();
            }}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <>
                <Spinner className="mr-2" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
