import * as ApolloCore from "@uipath/apollo-react/core";
import {
	PageContainer,
	PageDescription,
	PageTitle,
	SectionDescription,
	SectionHeader,
} from "../components/SharedStyles";
import {
	Grid,
	PaddingDemo,
	PaddingInner,
	PaddingOuter,
	Section,
	SizeIndicator,
	SizeMarker,
	SpacingBox,
	SpacingDemo,
	TokenCard,
	TokenInfo,
	TokenName,
	TokenValue,
} from "./Spacing.styles";

export function Spacing() {
	const spacingTokens = Object.entries(ApolloCore)
		.filter(
			([key, value]) => key.startsWith("Spacing") && typeof value === "string",
		)
		.map(([name, value]) => ({ name, value: value as unknown as string }))
		.sort((a, b) => parseFloat(a.value) - parseFloat(b.value));

	const paddingTokens = Object.entries(ApolloCore)
		.filter(
			([key, value]) => key.startsWith("Pad") && typeof value === "string",
		)
		.map(([name, value]) => ({ name, value: value as unknown as string }))
		.sort((a, b) => parseFloat(a.value) - parseFloat(b.value));

	const renderSpacingDemo = (token: { name: string; value: string }) => (
		<TokenCard key={token.name}>
			<TokenInfo>
				<TokenName>{token.name}</TokenName>
				<TokenValue>{token.value}</TokenValue>
			</TokenInfo>

			<SpacingDemo $gap={token.value}>
				<SpacingBox $color={"var(--color-primary)"} />
				<SpacingBox $color="var(--color-secondary)" />
			</SpacingDemo>

			<SizeIndicator $size={token.value}>
				<SizeMarker $left={token.value} />
			</SizeIndicator>
		</TokenCard>
	);

	const renderPaddingDemo = (token: { name: string; value: string }) => (
		<TokenCard key={token.name}>
			<TokenInfo>
				<TokenName>{token.name}</TokenName>
				<TokenValue>{token.value}</TokenValue>
			</TokenInfo>

			<PaddingDemo>
				<PaddingOuter $padding={token.value}>
					<PaddingInner>Content</PaddingInner>
				</PaddingOuter>
			</PaddingDemo>
		</TokenCard>
	);

	return (
		<PageContainer>
			<PageTitle>Spacing & Padding</PageTitle>
			<PageDescription>
				Consistent spacing scale for layouts (
				{spacingTokens.length + paddingTokens.length} tokens)
			</PageDescription>

			<Section $marginBottom="60px">
				<SectionHeader>Spacing Tokens</SectionHeader>
				<SectionDescription>
					Use these for margins and gaps between elements
				</SectionDescription>
				<Grid>{spacingTokens.map(renderSpacingDemo)}</Grid>
			</Section>

			<Section>
				<SectionHeader>Padding Tokens</SectionHeader>
				<SectionDescription>
					Use these for internal spacing within components
				</SectionDescription>
				<Grid>{paddingTokens.map(renderPaddingDemo)}</Grid>
			</Section>
		</PageContainer>
	);
}
