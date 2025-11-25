import { FontFamily, Typography } from "@uipath/apollo-react/core";

import {
	PageContainer,
	PageDescription,
	PageTitle,
	SectionDescription,
	SectionHeader,
} from "../components/SharedStyles";
import {
	Badge,
	DecorativeCorner,
	FamilyCard,
	FamilyHeader,
	FamilyTitle,
	FamilyTitleRow,
	FamilyValue,
	FontFamilyReference,
	Grid,
	PropertyBadges,
	SampleText,
	TokenChip,
	TokenChips,
	TokenCount,
	TokenName,
	TokensLabel,
	TypeCard,
	TypeCardHeader,
} from "./Fonts.styles";

type FontToken = {
	fontFamily?: string;
	fontSize?: string;
	lineHeight?: string;
	fontWeight?: number | string;
	letterSpacing?: string;
};

export function Fonts() {
	// Use the FontFamily namespace which contains only font family tokens (strings)
	const fontFamilyTokens = Object.entries(FontFamily).map(([name, value]) => ({
		name,
		value: value as string,
	}));

	// Use the Typography namespace which contains only typography tokens (objects)
	const typographyTokens = Object.entries(Typography).map(([name, value]) => ({
		name,
		value: value as FontToken,
	}));

	// Combine all font tokens for total count
	const fontTokens = [...fontFamilyTokens, ...typographyTokens];

	const realisticSamples = [
		"Design systems enable teams to build consistent experiences",
		"Typography creates hierarchy and improves readability",
		"Choose fonts that reflect your brand personality",
	];

	// Group all tokens by their font family value (deduplicate)
	const tokensByFamily = fontTokens.reduce(
		(acc, token) => {
			let familyValue: string | undefined;

			if (
				typeof token.value === "string" &&
				token.name.toLowerCase().includes("family")
			) {
				familyValue = token.value;
			} else if (typeof token.value === "object" && token.value.fontFamily) {
				familyValue = token.value.fontFamily;
			}

			if (familyValue) {
				const normalizedFamily = familyValue.trim();

				if (!acc[normalizedFamily]) {
					acc[normalizedFamily] = {
						tokens: [],
						tokenNames: new Set<string>(),
					};
				}
				if (!acc[normalizedFamily].tokenNames.has(token.name)) {
					acc[normalizedFamily].tokens.push(token);
					acc[normalizedFamily].tokenNames.add(token.name);
				}
			}

			return acc;
		},
		{} as Record<
			string,
			{ tokens: typeof fontTokens; tokenNames: Set<string> }
		>,
	);

	// Filter to only show families that have the actual fontFamily tokens
	const uniqueFamilies = Object.entries(tokensByFamily).reduce(
		(acc, [family, data]) => {
			const hasFamilyToken = data.tokens.some((t) =>
				t.name.toLowerCase().includes("family"),
			);
			if (hasFamilyToken) {
				acc[family] = data;
			}
			return acc;
		},
		{} as Record<
			string,
			{ tokens: typeof fontTokens; tokenNames: Set<string> }
		>,
	);

	// Sort typography tokens by font size for visual scale
	const sortedTypography = [...typographyTokens].sort((a, b) => {
		const sizeA = parseFloat(a.value.fontSize || "0");
		const sizeB = parseFloat(b.value.fontSize || "0");
		return sizeB - sizeA;
	});

	return (
		<PageContainer>
			<PageTitle>Typography</PageTitle>
			<PageDescription>
				Complete typography system ({fontTokens.length} tokens)
			</PageDescription>

			<div style={{ display: "flex", flexDirection: "column", gap: "56px" }}>
				{/* Typography Scale - Visual Hierarchy */}
				{sortedTypography.length > 0 && (
					<section>
						<SectionHeader>Type Scale</SectionHeader>
						<SectionDescription>
							Visual hierarchy from largest to smallest
						</SectionDescription>

						<Grid>
							{sortedTypography.map((token, index) => {
								const fontStyle = token.value;
								const sampleIndex = index % realisticSamples.length;

								return (
									<TypeCard key={token.name}>
										<DecorativeCorner />

										<TypeCardHeader>
											<TokenName>{token.name}</TokenName>
										</TypeCardHeader>

										<PropertyBadges>
											{fontStyle.fontSize && (
												<Badge $primary>{fontStyle.fontSize}</Badge>
											)}
											{fontStyle.fontWeight && (
												<Badge>Weight: {fontStyle.fontWeight}</Badge>
											)}
											{fontStyle.lineHeight && (
												<Badge>Line: {fontStyle.lineHeight}</Badge>
											)}
											{fontStyle.letterSpacing &&
												fontStyle.letterSpacing !== "0" && (
													<Badge>Spacing: {fontStyle.letterSpacing}</Badge>
												)}
										</PropertyBadges>

										<SampleText
											$fontFamily={fontStyle.fontFamily}
											$fontSize={fontStyle.fontSize}
											$lineHeight={fontStyle.lineHeight}
											$fontWeight={fontStyle.fontWeight}
											$letterSpacing={fontStyle.letterSpacing}
										>
											{realisticSamples[sampleIndex]}
										</SampleText>

										{fontStyle.fontFamily && (
											<FontFamilyReference>
												{fontStyle.fontFamily}
											</FontFamilyReference>
										)}
									</TypeCard>
								);
							})}
						</Grid>
					</section>
				)}

				{/* Font Family Showcase */}
				{Object.keys(uniqueFamilies).length > 0 && (
					<section>
						<SectionHeader>Font Families</SectionHeader>
						<SectionDescription>
							Core typefaces used throughout the system with all related tokens
						</SectionDescription>

						<div
							style={{ display: "flex", flexDirection: "column", gap: "32px" }}
						>
							{Object.entries(uniqueFamilies).map(([family, { tokens }]) => (
								<FamilyCard key={family}>
									<FamilyHeader>
										<FamilyTitleRow>
											<FamilyTitle>
												{family.split(",")[0]?.trim().replace(/['"]/g, "")}
											</FamilyTitle>
											<TokenCount>
												{tokens.length} token{tokens.length !== 1 ? "s" : ""}
											</TokenCount>
										</FamilyTitleRow>
										<FamilyValue>{family}</FamilyValue>

										<div>
											<TokensLabel>Tokens using this family:</TokensLabel>
											<TokenChips>
												{tokens.map((t) => (
													<TokenChip key={t.name}>{t.name}</TokenChip>
												))}
											</TokenChips>
										</div>
									</FamilyHeader>
								</FamilyCard>
							))}
						</div>
					</section>
				)}
			</div>
		</PageContainer>
	);
}
