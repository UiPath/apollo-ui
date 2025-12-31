import {
  Border,
  Colors,
  FontFamily,
  Icon,
  Padding,
  ScreenSizes,
  Shadow,
  Spacing,
  Stroke,
  Typography,
} from '@uipath/apollo-react/core';
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
  // Use namespaces to count tokens
  const colorCount = Object.keys(Colors).length;
  const fontCount = Object.keys(FontFamily).length + Object.keys(Typography).length;
  const spacingCount = Object.keys(Spacing).length + Object.keys(Padding).length;
  const shadowCount = Object.keys(Shadow).length;
  const borderCount = Object.keys(Border).length + Object.keys(Stroke).length;
  const iconCount = Object.keys(Icon).length;
  const screenCount = Object.keys(ScreenSizes).length;

  const tokenCategories = [
    {
      title: 'Borders & Strokes',
      description: 'Border radii, widths, and stroke styles',
      path: '/core/borders',
      icon: '⬜',
      count: `${borderCount} tokens`,
    },
    {
      title: 'Breakpoints',
      description: 'Responsive screen size breakpoints',
      path: '/core/screens',
      icon: '📱',
      count: `${screenCount} sizes`,
    },
    {
      title: 'Colors',
      description: 'Complete color palette with semantic naming',
      path: '/core/colors',
      icon: '🌈',
      count: `${colorCount} colors`,
    },
    {
      title: 'CSS Variables',
      description: 'Browse all CSS custom properties available in the design system',
      path: '/core/css-variables',
      icon: '🎨',
      count: 'View All',
    },
    {
      title: 'Icons',
      description: 'Icon sizing and spacing standards',
      path: '/core/icons',
      icon: '⭐',
      count: `${iconCount} tokens`,
    },
    {
      title: 'Shadows',
      description: 'Elevation system for depth and hierarchy',
      path: '/core/shadows',
      icon: '🔲',
      count: `${shadowCount} shadows`,
    },
    {
      title: 'Spacing & Padding',
      description: 'Consistent spacing scale for layouts',
      path: '/core/spacing',
      icon: '📏',
      count: `${spacingCount} tokens`,
    },
    {
      title: 'Typography',
      description: 'Font families, sizes, weights, and line heights',
      path: '/core/fonts',
      icon: '✍️',
      count: `${fontCount} tokens`,
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
