import { useLocation } from 'react-router-dom';
import {
  BreadcrumbContainer,
  BreadcrumbInner,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbNav,
  BreadcrumbSeparator,
  BreadcrumbText,
  HamburgerButton,
  HamburgerLine,
} from './Breadcrumb.styles';
import { ThemeToggle } from './ThemeToggle';

interface BreadcrumbProps {
  onMenuClick: () => void;
}

export function Breadcrumb({ onMenuClick }: BreadcrumbProps) {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Define human-readable labels for routes
  const routeLabels: Record<string, string> = {
    core: 'Core',
    components: 'Components',
    'css-variables': 'CSS Variables',
    colors: 'Colors',
    fonts: 'Typography',
    spacing: 'Spacing & Padding',
    shadows: 'Shadows',
    borders: 'Borders & Strokes',
    icons: 'Icons',
    screens: 'Breakpoints',
  };

  return (
    <BreadcrumbContainer>
      <BreadcrumbInner>
        <HamburgerButton onClick={onMenuClick}>
          <HamburgerLine />
          <HamburgerLine />
          <HamburgerLine />
        </HamburgerButton>

        <BreadcrumbNav>
          <BreadcrumbLink to="/" $isActive={pathnames.length === 0}>
            Home
          </BreadcrumbLink>

          {pathnames.map((segment, index) => {
            const path = `/${pathnames.slice(0, index + 1).join('/')}`;
            const isLast = index === pathnames.length - 1;
            const label = routeLabels[segment] || segment;

            return (
              <BreadcrumbItem key={path}>
                <BreadcrumbSeparator>→</BreadcrumbSeparator>
                {isLast ? (
                  <BreadcrumbText>{label}</BreadcrumbText>
                ) : (
                  <BreadcrumbLink to={path}>{label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbNav>
      </BreadcrumbInner>

      <ThemeToggle />
    </BreadcrumbContainer>
  );
}
