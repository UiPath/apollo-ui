import { Link } from "@mui/material";
import {
	PageContainer,
	PageDescription,
	PageTitle,
	SectionDescription,
	SectionHeader,
} from "../../components/SharedStyles";
import { LinkStack, VariantSection } from "./MaterialLink.styles";

export function MaterialLink() {
	return (
		<PageContainer>
			<PageTitle>Link</PageTitle>
			<PageDescription>
				Material UI Link component with Apollo theme overrides. Features custom
				colors, underline behaviors, and hover states.
			</PageDescription>

			<VariantSection>
				<SectionHeader>Basic Links</SectionHeader>
				<SectionDescription>
					Standard links with Apollo theme styling.
				</SectionDescription>
				<LinkStack>
					<Link href="#">Default link</Link>
					<Link href="#">Another link</Link>
					<Link href="#">Third link</Link>
				</LinkStack>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Underline Options</SectionHeader>
				<SectionDescription>
					Links with different underline behaviors.
				</SectionDescription>
				<LinkStack>
					<Link href="#" underline="none">
						No underline
					</Link>
					<Link href="#" underline="hover">
						Underline on hover
					</Link>
					<Link href="#" underline="always">
						Always underlined
					</Link>
				</LinkStack>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Typography Variants</SectionHeader>
				<SectionDescription>
					Links with different typography sizes.
				</SectionDescription>
				<LinkStack>
					<Link href="#" variant="h6">
						Heading 6 link
					</Link>
					<Link href="#" variant="body1">
						Body 1 link (default)
					</Link>
					<Link href="#" variant="body2">
						Body 2 link
					</Link>
					<Link href="#" variant="caption">
						Caption link
					</Link>
				</LinkStack>
			</VariantSection>

			<VariantSection>
				<SectionHeader>Button Link</SectionHeader>
				<SectionDescription>
					Links styled as buttons using the component prop.
				</SectionDescription>
				<LinkStack>
					<Link
						component="button"
						variant="body2"
						onClick={() => alert("Button link clicked!")}
					>
						Clickable button link
					</Link>
				</LinkStack>
			</VariantSection>
		</PageContainer>
	);
}
