import type { Meta, StoryFn } from "@storybook/react-vite";
import type { ComponentType } from "react";
import { Column, Row } from "../layouts";
import * as Icons from ".";

export default {
  title: "Core/Icons",
  parameters: {
    layout: "fullscreen",
  },
} as Meta;

type IconComponent = ComponentType<{ width?: number; height?: number; className?: string }>;

const iconEntries = (
  Object.entries(Icons)
    // only keep Component-like exports (Capitalized name and function value)
    .filter(([name, value]) => /^[A-Z]/.test(name) && typeof value === "function") as [string, IconComponent][]
)
  // ensure stable order
  .sort(([a], [b]) => a.localeCompare(b));

export const AllIcons: StoryFn = () => {
  return (
    <Column p={16} gap={10} style={{ color: "var(--color-foreground)" }}>
      <Column gap={8}>
        <h1 style={{ margin: 0, fontSize: "2rem" }}>Icon Gallery</h1>
        <p style={{ margin: 0 }}>All available icons</p>
      </Column>
      <Row gap={16} wrap="wrap">
        {iconEntries.map(([name, Icon]) => (
          <Column
            key={name}
            align="center"
            gap={16}
            p={24}
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              minWidth: "150px",
              backgroundColor: "var(--color-background)",
              transition: "all 0.2s",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 64,
                width: 64,
              }}
            >
              <Icon />
            </div>
            <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{name}</span>
          </Column>
        ))}
      </Row>
    </Column>
  );
};

export const DifferentSizes: StoryFn = () => {
  const sizes = [16, 24, 32, 48, 64];

  return (
    <Column p={16} gap={10} style={{ color: "var(--color-foreground)" }}>
      <Column gap={8}>
        <h1 style={{ margin: 0, fontSize: "2rem" }}>Icon Sizes</h1>
        <p style={{ margin: 0 }}>Icons displayed at different sizes</p>
      </Column>
      <Column gap={32}>
        {iconEntries.map(([name, Icon]) => (
          <Column key={name} gap={16}>
            <h3 style={{ margin: 0 }}>{name}</h3>
            <Row gap={24} align="end">
              {sizes.map((size) => (
                <Column key={size} align="center" gap={8}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: size,
                      width: size,
                    }}
                  >
                    <Icon width={size} height={size} />
                  </div>
                  <span style={{ fontSize: "0.75rem" }}>{size}px</span>
                </Column>
              ))}
            </Row>
          </Column>
        ))}
      </Column>
    </Column>
  );
};
