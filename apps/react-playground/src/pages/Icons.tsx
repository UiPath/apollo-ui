import { iconNames } from "@uipath/apollo-react/components";
import { Icon } from "@uipath/apollo-react/core";
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
										width?: number;
										height?: number;
										color?: string;
									}>
								>
							)[iconName];
							if (!IconComponent) return null;

							return (
								<IconBrowserCard
									key={iconName}
									onClick={() => {
										navigator.clipboard.writeText(iconName);
									}}
									color="var(--color-foreground)"
									title={iconName}
								>
									<IconComponent
										width={20}
										height={20}
										color="var(--color-foreground)"
									/>
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
