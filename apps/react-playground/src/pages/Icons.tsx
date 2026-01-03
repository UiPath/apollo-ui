import { Icon, iconNames } from "@uipath/apollo-react/core";
import * as ApolloIcons from "@uipath/apollo-react/icons";
import type React from "react";
import { useState } from "react";

import {
	PageContainer,
	PageDescription,
	PageTitle,
	SectionDescription,
	SectionHeader,
} from "../components/SharedStyles";
import {
	Grid,
	IconBrowserCard,
	IconBrowserGrid,
	IconCard,
	IconCircle,
	IconDimensions,
	IconInfo,
	IconLabel,
	IconName,
	IconValue,
	IconVisual,
	SearchInput,
} from "./Icons.styles";

export function Icons() {
	const [searchTerm, setSearchTerm] = useState("");

	// Icon sizing tokens from Apollo Core
	const sizeTokens = Object.entries(Icon)
		.map(([name, value]) => ({ name, value: value as string }))
		.sort((a, b) => parseFloat(a.value) - parseFloat(b.value));

	// Filter icon names based on search
	const filteredIconNames = searchTerm
		? iconNames.filter(
				(name) =>
					name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					name
						.replace(/([A-Z])/g, " $1")
						.toLowerCase()
						.includes(searchTerm.toLowerCase()),
			)
		: iconNames;

	return (
		<PageContainer>
			<PageTitle>Icons</PageTitle>
			<PageDescription>
				Complete Apollo icon library with {iconNames.length} icons and sizing
				tokens
			</PageDescription>

			<div style={{ display: "flex", flexDirection: "column", gap: "56px" }}>
				{/* Icon Browser */}
				<section>
					<SectionHeader>
						Icon Library ({filteredIconNames.length} icons)
					</SectionHeader>
					<SectionDescription>
						Search and browse all available icons in the Apollo Design System
					</SectionDescription>

					<SearchInput
						type="text"
						placeholder="Search icons... (e.g., 'arrow', 'alert', 'user')"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>

					<IconBrowserGrid>
						{filteredIconNames.map((iconName) => {
							const IconComponent = (
								ApolloIcons as Record<
									string,
									React.ComponentType<{
										size?: string | number;
										color?: string;
									}>
								>
							)[iconName];
							if (!IconComponent) return null;

							const handleCopySvg = (e: React.MouseEvent<HTMLDivElement>) => {
								const svgElement = e.currentTarget.querySelector("svg");
								if (svgElement) {
									// Clone the SVG to avoid modifying the original
									const clonedSvg = svgElement.cloneNode(true) as SVGElement;

									// Format the SVG with proper indentation
									const serializer = new XMLSerializer();
									const svgString = serializer.serializeToString(clonedSvg);

									// Pretty print the SVG
									const formatted = formatXml(svgString);
									navigator.clipboard.writeText(formatted);
								}
							};

							const formatXml = (xml: string): string => {
								const PADDING = "  "; // 2 spaces for indentation
								const reg = /(>)(<)(\/*)/g;
								let pad = 0;

								xml = xml.replace(reg, "$1\n$2$3");

								return xml
									.split("\n")
									.map((node) => {
										let indent = 0;
										if (node.match(/.+<\/\w[^>]*>$/)) {
											indent = 0;
										} else if (node.match(/^<\/\w/) && pad > 0) {
											pad -= 1;
										} else if (node.match(/^<\w[^>]*[^/]>.*$/)) {
											indent = 1;
										} else {
											indent = 0;
										}

										pad += indent;
										return PADDING.repeat(pad - indent) + node;
									})
									.join("\n");
							};

							return (
								<IconBrowserCard
									key={iconName}
									onClick={handleCopySvg}
									color="var(--color-foreground)"
									title={`Click to copy SVG: ${iconName}`}
								>
									<IconComponent size={48} color="var(--color-foreground)" />
									<IconLabel>{iconName}</IconLabel>
								</IconBrowserCard>
							);
						})}
					</IconBrowserGrid>

					{filteredIconNames.length === 0 && (
						<div
							style={{
								textAlign: "center",
								padding: "48px",
								color: "var(--color-foreground-de-emp)",
								fontSize: "16px",
							}}
						>
							No icons found matching &quot;{searchTerm}&quot;
						</div>
					)}
				</section>

				{/* Icon Sizing Tokens */}
				<section>
					<SectionHeader>Icon Sizing Tokens</SectionHeader>
					<SectionDescription>
						Standard icon sizes for consistent spacing ({sizeTokens.length}{" "}
						tokens)
					</SectionDescription>

					<Grid>
						{sizeTokens.map((token) => (
							<IconCard key={token.name}>
								<IconInfo>
									<IconName>{token.name}</IconName>
									<IconValue>{token.value}</IconValue>
								</IconInfo>

								<IconVisual>
									<IconCircle $size={token.value} />
								</IconVisual>

								<IconDimensions>
									<div>W: {token.value}</div>
									<div>H: {token.value}</div>
								</IconDimensions>
							</IconCard>
						))}
					</Grid>
				</section>
			</div>
		</PageContainer>
	);
}
