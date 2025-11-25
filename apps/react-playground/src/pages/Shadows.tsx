import { Shadow } from "@uipath/apollo-react/core";
import {
	PageContainer,
	PageDescription,
	PageTitle,
} from "../components/SharedStyles";
import {
	Grid,
	ShadowBox,
	ShadowCard,
	ShadowCardWrapper,
	ShadowName,
	ShadowValue,
} from "./Shadows.styles";

export function Shadows() {
	// Use the Shadow namespace which contains only shadow tokens
	const shadows = Object.entries(Shadow).map(([name, value]) => ({
		name,
		value: value as string,
	}));

	return (
		<PageContainer>
			<PageTitle>Shadows</PageTitle>
			<PageDescription>
				Elevation system for depth and hierarchy ({shadows.length} shadows)
			</PageDescription>

			<Grid>
				{shadows.map((shadow) => (
					<ShadowCardWrapper key={shadow.name}>
						<ShadowCard $shadowValue={shadow.value}>
							<ShadowBox $shadowValue={shadow.value} />
							<ShadowName>{shadow.name}</ShadowName>
							<ShadowValue>{shadow.value}</ShadowValue>
						</ShadowCard>
					</ShadowCardWrapper>
				))}
			</Grid>
		</PageContainer>
	);
}
