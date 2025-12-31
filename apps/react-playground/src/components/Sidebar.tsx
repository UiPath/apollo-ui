import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ChevronIcon,
  NavIcon,
  NavLabel,
  NavLink,
  NavSection,
  ParentNavButton,
  SidebarContainer,
  SidebarNav,
  SubNav,
  SubNavLink,
} from './Sidebar.styles';

export function Sidebar() {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([
    '/core',
    '/material',
    '/components',
  ]);

  const navigation = [
    {
      label: 'Home',
      path: '/',
      icon: '🏠',
    },
    {
      label: 'Core',
      path: '/core',
      icon: '🎨',
      children: [
        { label: 'Borders & Strokes', path: '/core/borders' },
        { label: 'Breakpoints', path: '/core/screens' },
        { label: 'Colors', path: '/core/colors' },
        { label: 'CSS Variables', path: '/core/css-variables' },
        { label: 'Icons', path: '/core/icons' },
        { label: 'Shadows', path: '/core/shadows' },
        { label: 'Spacing & Padding', path: '/core/spacing' },
        { label: 'Typography', path: '/core/fonts' },
      ],
    },
    {
      label: 'Components',
      path: '/components',
      icon: '🧩',
      children: [
        { label: 'Alert Bar', path: '/components/alert-bar' },
        { label: 'Badge', path: '/components/badge' },
        { label: 'Button', path: '/components/button' },
        { label: 'Chat', path: '/components/chat' },
        { label: 'Chip', path: '/components/chip' },
        { label: 'Link', path: '/components/link' },
        { label: 'Skeleton', path: '/components/skeleton' },
        { label: 'Text Area', path: '/components/text-area' },
        { label: 'Text Field', path: '/components/text-field' },
        { label: 'Tool Call', path: '/components/tool-call' },
        { label: 'Tree View', path: '/components/tree-view' },
        { label: 'Typography', path: '/components/typography' },
      ],
    },
    {
      label: 'Material Overrides',
      path: '/material',
      icon: '🎭',
      children: [
        { label: 'Alert', path: '/material/alert' },
        { label: 'Autocomplete', path: '/material/autocomplete' },
        { label: 'Button Base', path: '/material/button-base' },
        { label: 'Buttons', path: '/material/buttons' },
        { label: 'Checkbox', path: '/material/checkbox' },
        { label: 'Chip', path: '/material/chip' },
        { label: 'Circular Progress', path: '/material/circular-progress' },
        { label: 'Datepicker', path: '/material/datepicker' },
        { label: 'Dialog', path: '/material/dialog' },
        { label: 'Divider', path: '/material/divider' },
        { label: 'Form Controls', path: '/material/form-controls' },
        { label: 'Input Base', path: '/material/input-base' },
        { label: 'Inputs', path: '/material/inputs' },
        { label: 'Linear Progress', path: '/material/linear-progress' },
        { label: 'Link', path: '/material/link' },
        { label: 'List', path: '/material/list' },
        { label: 'Menu Item', path: '/material/menu-item' },
        { label: 'Radio', path: '/material/radio' },
        { label: 'Select', path: '/material/select' },
        { label: 'Slider', path: '/material/slider' },
        { label: 'Snackbar', path: '/material/snackbar' },
        { label: 'Stepper', path: '/material/stepper' },
        { label: 'Switch', path: '/material/switch' },
        { label: 'Tabs', path: '/material/tabs' },
        { label: 'Text Field', path: '/material/text-field' },
        { label: 'Tooltip', path: '/material/tooltip' },
        { label: 'Typography', path: '/material/typography' },
      ],
    },
  ];

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const toggleMenu = (path: string) => {
    setExpandedMenus((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isExpanded = (path: string) => expandedMenus.includes(path);

  return (
    <SidebarContainer>
      <SidebarNav>
        {navigation.map((item) => (
          <NavSection key={item.path}>
            {item.children ? (
              <ParentNavButton
                onClick={() => toggleMenu(item.path)}
                $isActive={isActivePath(item.path)}
              >
                <NavIcon>{item.icon}</NavIcon>
                <NavLabel>{item.label}</NavLabel>
                <ChevronIcon $isExpanded={isExpanded(item.path)}>▼</ChevronIcon>
              </ParentNavButton>
            ) : (
              <NavLink to={item.path} $isActive={isActivePath(item.path)}>
                <NavIcon>{item.icon}</NavIcon>
                <NavLabel>{item.label}</NavLabel>
              </NavLink>
            )}

            {item.children && (
              <SubNav $isExpanded={isExpanded(item.path)}>
                {item.children.map((child) => (
                  <SubNavLink
                    key={child.path}
                    to={child.path}
                    $isActive={location.pathname === child.path}
                  >
                    {child.label}
                  </SubNavLink>
                ))}
              </SubNav>
            )}
          </NavSection>
        ))}
      </SidebarNav>
    </SidebarContainer>
  );
}
