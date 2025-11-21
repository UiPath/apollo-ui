import * as ApolloCore from "@uipath/apollo-react/core";

import {
	PageContainer,
	PageDescription,
	PageTitle,
} from "../components/SharedStyles";
import {
	Grid,
	IconCard,
	IconCircle,
	IconDimensions,
	IconInfo,
	IconName,
	IconValue,
	IconVisual,
} from "./Icons.styles";

export function Icons() {
	const icons = Object.entries(ApolloCore)
		.filter(
			([key, value]) => key.startsWith("Icon") && typeof value === "string",
		)
		.map(([name, value]) => ({ name, value: value as unknown as string }))
		.sort((a, b) => parseFloat(a.value) - parseFloat(b.value));

	return (
		<PageContainer>
			<PageTitle>Icons</PageTitle>
			<PageDescription>
				Icon sizing and spacing standards ({icons.length} tokens)
			</PageDescription>

			<Grid>
				{icons.map((icon) => (
					<IconCard key={icon.name}>
						<IconInfo>
							<IconName>{icon.name}</IconName>
							<IconValue>{icon.value}</IconValue>
						</IconInfo>

						<IconVisual>
							<IconCircle $size={icon.value} />
						</IconVisual>

						<IconDimensions>
							<div>W: {icon.value}</div>
							<div>H: {icon.value}</div>
						</IconDimensions>
					</IconCard>
				))}
			</Grid>
		</PageContainer>
	);
}
