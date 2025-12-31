import { Badge, Box, Tab, Tabs } from '@mui/material';
import { useState } from 'react';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
} from '../../components/SharedStyles';

export function MaterialTabs() {
  const [basicTabValue, setBasicTabValue] = useState(0);
  const [iconTabValue, setIconTabValue] = useState(0);
  const [iconOnlyTabValue, setIconOnlyTabValue] = useState(0);
  const [badgeTabValue, setBadgeTabValue] = useState(0);
  const [disabledTabValue, setDisabledTabValue] = useState(0);
  const [centeredTabValue, setCenteredTabValue] = useState(0);
  const [fullWidthTabValue, setFullWidthTabValue] = useState(0);
  const [scrollableTabValue, setScrollableTabValue] = useState(0);

  return (
    <PageContainer>
      <PageTitle>Tabs</PageTitle>
      <PageDescription>
        Material UI Tabs and Tab components with Apollo theme overrides. Features custom tab
        styling, indicators, and navigation patterns.
      </PageDescription>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Basic Tabs</SectionHeader>
        <SectionDescription>Simple tabs with text labels and content switching.</SectionDescription>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={basicTabValue} onChange={(_, newValue) => setBasicTabValue(newValue)}>
            <Tab label="Tab One" />
            <Tab label="Tab Two" />
            <Tab label="Tab Three" />
          </Tabs>
        </Box>
        <Box sx={{ p: 3 }}>
          {basicTabValue === 0 && <div>Content for Tab One</div>}
          {basicTabValue === 1 && <div>Content for Tab Two</div>}
          {basicTabValue === 2 && <div>Content for Tab Three</div>}
        </Box>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Tabs with Icons</SectionHeader>
        <SectionDescription>Tabs displaying both icons and text labels.</SectionDescription>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={iconTabValue} onChange={(_, newValue) => setIconTabValue(newValue)}>
            <Tab icon={<span>🏠</span>} label="Home" />
            <Tab icon={<span>👤</span>} label="Profile" />
            <Tab icon={<span>⚙️</span>} label="Settings" />
          </Tabs>
        </Box>
        <Box sx={{ p: 3 }}>
          {iconTabValue === 0 && <div>Home content with dashboard</div>}
          {iconTabValue === 1 && <div>Profile settings and information</div>}
          {iconTabValue === 2 && <div>Application settings and preferences</div>}
        </Box>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Icon-Only Tabs</SectionHeader>
        <SectionDescription>Tabs with only icon elements (no text labels).</SectionDescription>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={iconOnlyTabValue} onChange={(_, newValue) => setIconOnlyTabValue(newValue)}>
            <Tab icon={<span>📧</span>} aria-label="messages" />
            <Tab icon={<span>📞</span>} aria-label="calls" />
            <Tab icon={<span>📅</span>} aria-label="calendar" />
            <Tab icon={<span>❓</span>} aria-label="help" />
          </Tabs>
        </Box>
        <Box sx={{ p: 3 }}>
          {iconOnlyTabValue === 0 && <div>Messages inbox</div>}
          {iconOnlyTabValue === 1 && <div>Call history</div>}
          {iconOnlyTabValue === 2 && <div>Calendar events</div>}
          {iconOnlyTabValue === 3 && <div>Help center</div>}
        </Box>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Tabs with Badges</SectionHeader>
        <SectionDescription>
          Tabs displaying notification badges for unread items.
        </SectionDescription>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={badgeTabValue} onChange={(_, newValue) => setBadgeTabValue(newValue)}>
            <Tab
              label={
                <Badge badgeContent={4} color="error">
                  Messages
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={2} color="warning">
                  Notifications
                </Badge>
              }
            />
            <Tab label="Archive" />
          </Tabs>
        </Box>
        <Box sx={{ p: 3 }}>
          {badgeTabValue === 0 && <div>4 unread messages</div>}
          {badgeTabValue === 1 && <div>2 new notifications</div>}
          {badgeTabValue === 2 && <div>Archived items</div>}
        </Box>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Disabled Tabs</SectionHeader>
        <SectionDescription>Tabs with some items in disabled state.</SectionDescription>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={disabledTabValue} onChange={(_, newValue) => setDisabledTabValue(newValue)}>
            <Tab label="Active" />
            <Tab label="Disabled" disabled />
            <Tab label="Also Disabled" disabled />
          </Tabs>
        </Box>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Centered Tabs</SectionHeader>
        <SectionDescription>Tabs centered in their container.</SectionDescription>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={centeredTabValue}
            onChange={(_, newValue) => setCenteredTabValue(newValue)}
            centered
          >
            <Tab label="Item One" />
            <Tab label="Item Two" />
            <Tab label="Item Three" />
          </Tabs>
        </Box>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Full Width Tabs</SectionHeader>
        <SectionDescription>
          Tabs that stretch to fill the container width equally.
        </SectionDescription>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={fullWidthTabValue}
            onChange={(_, newValue) => setFullWidthTabValue(newValue)}
            variant="fullWidth"
          >
            <Tab label="First" />
            <Tab label="Second" />
            <Tab label="Third" />
          </Tabs>
        </Box>
      </section>

      <section>
        <SectionHeader>Scrollable Tabs</SectionHeader>
        <SectionDescription>
          Tabs with horizontal scrolling for overflow content.
        </SectionDescription>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', maxWidth: 500 }}>
          <Tabs
            value={scrollableTabValue}
            onChange={(_, newValue) => setScrollableTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Tab 1" />
            <Tab label="Tab 2" />
            <Tab label="Tab 3" />
            <Tab label="Tab 4" />
            <Tab label="Tab 5" />
            <Tab label="Tab 6" />
            <Tab label="Tab 7" />
            <Tab label="Tab 8" />
          </Tabs>
        </Box>
      </section>
    </PageContainer>
  );
}
