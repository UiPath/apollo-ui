import * as ApolloCore from '@uipath/apollo-react/core';
import { PageContainer } from '../components/SharedStyles';
import {
  CategoryBadge,
  CategoryCard,
  CategoryDescription,
  CategoryGrid,
  CategoryIcon,
  CategoryTitle,
  CenterContainer,
  GradientTitle,
  InfoBox,
  InfoItem,
  InlineCode,
  Subtitle,
} from './CoreHome.styles';

export function CoreHome() {
  const tokenCategories = [
    {
      title: 'CSS Variables',
      description: 'Browse all CSS custom properties available in the design system',
      path: '/core/css-variables',
      icon: '🎨',
      count: 'View All',
    },
    {
      title: 'Colors',
      description: 'Complete color palette with semantic naming',
      path: '/core/colors',
      icon: '🌈',
      count: `${Object.keys(ApolloCore).filter((k) => k.startsWith('Color')).length} colors`,
    },
    {
      title: 'Typography',
      description: 'Font families, sizes, weights, and line heights',
      path: '/core/fonts',
      icon: '✍️',
      count: `${Object.keys(ApolloCore).filter((k) => k.startsWith('Font')).length} tokens`,
    },
    {
      title: 'Spacing & Padding',
      description: 'Consistent spacing scale for layouts',
      path: '/core/spacing',
      icon: '📏',
      count: `${Object.keys(ApolloCore).filter((k) => k.startsWith('Spacing') || k.startsWith('Pad')).length} tokens`,
    },
    {
      title: 'Shadows',
      description: 'Elevation system for depth and hierarchy',
      path: '/core/shadows',
      icon: '🔲',
      count: `${Object.keys(ApolloCore).filter((k) => k.startsWith('Shadow')).length} shadows`,
    },
    {
      title: 'Borders & Strokes',
      description: 'Border radii, widths, and stroke styles',
      path: '/core/borders',
      icon: '⬜',
      count: `${Object.keys(ApolloCore).filter((k) => k.startsWith('Border') || k.startsWith('Stroke')).length} tokens`,
    },
    {
      title: 'Icons',
      description: 'Icon sizing and spacing standards',
      path: '/core/icons',
      icon: '⭐',
      count: `${Object.keys(ApolloCore).filter((k) => k.startsWith('Icon')).length} tokens`,
    },
    {
      title: 'Breakpoints',
      description: 'Responsive screen size breakpoints',
      path: '/core/screens',
      icon: '📱',
      count: `${Object.keys(ApolloCore).filter((k) => k.startsWith('Screen')).length} sizes`,
    },
  ];

  return (
    <PageContainer>
      <CenterContainer>
        <GradientTitle>Apollo Design Tokens</GradientTitle>
        <Subtitle>
          Explore the complete design token library from @uipath/apollo-react/core
        </Subtitle>
        <InfoBox>
          <InfoItem>
            <strong>CSS Import:</strong>{' '}
            <InlineCode>@uipath/apollo-react/core/tokens/css/variables.css</InlineCode>
          </InfoItem>
          <InfoItem>
            <strong>JS Import:</strong> <InlineCode>@uipath/apollo-react/core</InlineCode>
          </InfoItem>
        </InfoBox>
      </CenterContainer>

      <CategoryGrid>
        {tokenCategories.map((category) => (
          <CategoryCard key={category.path} to={category.path}>
            <CategoryIcon>{category.icon}</CategoryIcon>
            <CategoryTitle>{category.title}</CategoryTitle>
            <CategoryDescription>{category.description}</CategoryDescription>
            <CategoryBadge>{category.count}</CategoryBadge>
          </CategoryCard>
        ))}
      </CategoryGrid>
    </PageContainer>
  );
}
