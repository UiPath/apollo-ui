import { useLocation } from 'react-router-dom';
import { Nav, NavContainer, NavLink, NavLinks, NavTitle } from './Navigation.styles';

export function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/css-variables', label: 'CSS Variables' },
    { path: '/colors', label: 'Colors' },
    { path: '/fonts', label: 'Typography' },
    { path: '/spacing', label: 'Spacing & Padding' },
    { path: '/shadows', label: 'Shadows' },
    { path: '/borders', label: 'Borders & Strokes' },
    { path: '/icons', label: 'Icons' },
    { path: '/screens', label: 'Breakpoints' },
  ];

  return (
    <Nav>
      <NavContainer>
        <NavTitle>Apollo Design System</NavTitle>
        <NavLinks>
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} $isActive={location.pathname === item.path}>
              {item.label}
            </NavLink>
          ))}
        </NavLinks>
      </NavContainer>
    </Nav>
  );
}
