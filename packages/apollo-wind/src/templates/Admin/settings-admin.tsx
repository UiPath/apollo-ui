import { Bell, CreditCard, Key, Palette, Shield, User } from 'lucide-react';
import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Column, Grid, Row } from '@/components/ui/layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  AdminSidebar,
  AdminSidebarHeader,
  AdminSidebarNav,
  AdminTemplate,
  FutureTheme,
} from './template-admin';

const navItems = [
  { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
  { id: 'account', label: 'Account', icon: <Key className="h-4 w-4" /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette className="h-4 w-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
  { id: 'security', label: 'Security', icon: <Shield className="h-4 w-4" /> },
  { id: 'billing', label: 'Billing', icon: <CreditCard className="h-4 w-4" /> },
];

export function SettingsAdmin({
  theme,
  menuContent,
}: {
  theme: string;
  menuContent?: React.ReactNode;
}) {
  const [activeSection, setActiveSection] = React.useState('profile');
  const [formData, setFormData] = React.useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    username: 'johndoe',
    bio: 'Software developer passionate about building great products.',
    theme: 'system',
    language: 'en',
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    twoFactor: false,
  });

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AdminTemplate
      theme={theme as FutureTheme}
      title="Settings"
      menuContent={menuContent}
      sidebar={
        <AdminSidebar width={240}>
          <AdminSidebarHeader title="Settings" icon={<User className="h-4 w-4" />} />
          <AdminSidebarNav
            items={navItems}
            selectedId={activeSection}
            onSelect={setActiveSection}
          />
        </AdminSidebar>
      }
    >
      <ScrollArea className="flex-1">
        <div className="space-y-6 p-6">
          {activeSection === 'profile' && (
            <>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Profile</h2>
                <p className="text-foreground-muted">
                  Manage your public profile information.
                </p>
              </div>

              <Card className="border-border-subtle bg-surface-raised">
                <CardHeader>
                  <CardTitle className="text-foreground">Avatar</CardTitle>
                  <CardDescription className="text-foreground-muted">
                    Click on the avatar to upload a custom one from your files.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Row gap={4} align="center">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-lg">JD</AvatarFallback>
                    </Avatar>
                    <Row gap={2}>
                      <Button variant="outline" size="sm">
                        Upload
                      </Button>
                      <Button variant="ghost" size="sm">
                        Remove
                      </Button>
                    </Row>
                  </Row>
                </CardContent>
              </Card>

              <Card className="border-border-subtle bg-surface-raised">
                <CardHeader>
                  <CardTitle className="text-foreground">Personal Information</CardTitle>
                  <CardDescription className="text-foreground-muted">
                    Update your personal details here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Grid gap={4} cols={2}>
                    <Column gap={2}>
                      <Label htmlFor="firstName" className="text-foreground">
                        First name
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => updateField('firstName', e.target.value)}
                        className="border-border bg-surface-overlay text-foreground"
                      />
                    </Column>
                    <Column gap={2}>
                      <Label htmlFor="lastName" className="text-foreground">
                        Last name
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => updateField('lastName', e.target.value)}
                        className="border-border bg-surface-overlay text-foreground"
                      />
                    </Column>
                  </Grid>
                  <Column gap={2}>
                    <Label htmlFor="username" className="text-foreground">
                      Username
                    </Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => updateField('username', e.target.value)}
                      className="border-border bg-surface-overlay text-foreground"
                    />
                  </Column>
                  <Column gap={2}>
                    <Label htmlFor="bio" className="text-foreground">
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => updateField('bio', e.target.value)}
                      rows={3}
                      className="border-border bg-surface-overlay text-foreground"
                    />
                    <p className="text-xs text-foreground-subtle">
                      Brief description for your profile. URLs are hyperlinked.
                    </p>
                  </Column>
                </CardContent>
                <CardFooter className="border-t border-border-subtle px-6 py-4">
                  <Button>Save changes</Button>
                </CardFooter>
              </Card>
            </>
          )}

          {activeSection === 'account' && (
            <>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Account</h2>
                <p className="text-foreground-muted">
                  Manage your account settings and email preferences.
                </p>
              </div>

              <Card className="border-border-subtle bg-surface-raised">
                <CardHeader>
                  <CardTitle className="text-foreground">Email</CardTitle>
                  <CardDescription className="text-foreground-muted">
                    Your email address is used for login and notifications.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Column gap={2}>
                    <Label htmlFor="email" className="text-foreground">
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="border-border bg-surface-overlay text-foreground"
                    />
                  </Column>
                </CardContent>
                <CardFooter className="border-t border-border-subtle px-6 py-4">
                  <Button>Update email</Button>
                </CardFooter>
              </Card>

              <Card className="border-red-500/30 bg-surface-raised">
                <CardHeader>
                  <CardTitle className="text-red-400">Danger Zone</CardTitle>
                  <CardDescription className="text-foreground-muted">
                    Irreversible and destructive actions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Row justify="between" align="center">
                    <Column gap={0}>
                      <p className="font-medium text-foreground">Delete account</p>
                      <p className="text-sm text-foreground-muted">
                        Permanently delete your account and all associated data.
                      </p>
                    </Column>
                    <Button variant="destructive">Delete account</Button>
                  </Row>
                </CardContent>
              </Card>
            </>
          )}

          {activeSection === 'appearance' && (
            <>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Appearance</h2>
                <p className="text-foreground-muted">
                  Customize the appearance of the application.
                </p>
              </div>

              <Card className="border-border-subtle bg-surface-raised">
                <CardHeader>
                  <CardTitle className="text-foreground">Theme</CardTitle>
                  <CardDescription className="text-foreground-muted">
                    Select your preferred theme for the dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Column gap={2}>
                    <Label htmlFor="theme" className="text-foreground">
                      Theme
                    </Label>
                    <Select
                      value={formData.theme}
                      onValueChange={(value) => updateField('theme', value)}
                    >
                      <SelectTrigger
                        id="theme"
                        className="w-[200px] border-border bg-surface-overlay text-foreground"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </Column>
                  <Column gap={2}>
                    <Label htmlFor="language" className="text-foreground">
                      Language
                    </Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => updateField('language', value)}
                    >
                      <SelectTrigger
                        id="language"
                        className="w-[200px] border-border bg-surface-overlay text-foreground"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </Column>
                </CardContent>
              </Card>
            </>
          )}

          {activeSection === 'notifications' && (
            <>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
                <p className="text-foreground-muted">
                  Configure how you receive notifications.
                </p>
              </div>

              <Card className="border-border-subtle bg-surface-raised">
                <CardHeader>
                  <CardTitle className="text-foreground">Notification Preferences</CardTitle>
                  <CardDescription className="text-foreground-muted">
                    Choose what notifications you want to receive.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Row justify="between" align="center">
                    <Column gap={0.5}>
                      <Label className="text-foreground">Email notifications</Label>
                      <p className="text-sm text-foreground-muted">
                        Receive notifications via email.
                      </p>
                    </Column>
                    <Switch
                      checked={formData.emailNotifications}
                      onCheckedChange={(checked) => updateField('emailNotifications', checked)}
                    />
                  </Row>
                  <Separator className="bg-border-subtle" />
                  <Row justify="between" align="center">
                    <Column gap={0.5}>
                      <Label className="text-foreground">Push notifications</Label>
                      <p className="text-sm text-foreground-muted">
                        Receive push notifications on your device.
                      </p>
                    </Column>
                    <Switch
                      checked={formData.pushNotifications}
                      onCheckedChange={(checked) => updateField('pushNotifications', checked)}
                    />
                  </Row>
                  <Separator className="bg-border-subtle" />
                  <Row justify="between" align="center">
                    <Column gap={0.5}>
                      <Label className="text-foreground">Marketing emails</Label>
                      <p className="text-sm text-foreground-muted">
                        Receive emails about new features and updates.
                      </p>
                    </Column>
                    <Switch
                      checked={formData.marketingEmails}
                      onCheckedChange={(checked) => updateField('marketingEmails', checked)}
                    />
                  </Row>
                </CardContent>
              </Card>
            </>
          )}

          {activeSection === 'security' && (
            <>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Security</h2>
                <p className="text-foreground-muted">Manage your security preferences.</p>
              </div>

              <Card className="border-border-subtle bg-surface-raised">
                <CardHeader>
                  <CardTitle className="text-foreground">Password</CardTitle>
                  <CardDescription className="text-foreground-muted">
                    Change your password here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Column gap={2}>
                    <Label htmlFor="currentPassword" className="text-foreground">
                      Current password
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      className="border-border bg-surface-overlay text-foreground"
                    />
                  </Column>
                  <Column gap={2}>
                    <Label htmlFor="newPassword" className="text-foreground">
                      New password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      className="border-border bg-surface-overlay text-foreground"
                    />
                  </Column>
                  <Column gap={2}>
                    <Label htmlFor="confirmPassword" className="text-foreground">
                      Confirm password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      className="border-border bg-surface-overlay text-foreground"
                    />
                  </Column>
                </CardContent>
                <CardFooter className="border-t border-border-subtle px-6 py-4">
                  <Button>Update password</Button>
                </CardFooter>
              </Card>

              <Card className="border-border-subtle bg-surface-raised">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Two-Factor Authentication
                  </CardTitle>
                  <CardDescription className="text-foreground-muted">
                    Add an extra layer of security to your account.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Row justify="between" align="center">
                    <Column gap={0.5}>
                      <p className="font-medium text-foreground">Enable 2FA</p>
                      <p className="text-sm text-foreground-muted">
                        Secure your account with two-factor authentication.
                      </p>
                    </Column>
                    <Switch
                      checked={formData.twoFactor}
                      onCheckedChange={(checked) => updateField('twoFactor', checked)}
                    />
                  </Row>
                </CardContent>
              </Card>
            </>
          )}

          {activeSection === 'billing' && (
            <>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Billing</h2>
                <p className="text-foreground-muted">
                  Manage your billing information and subscription.
                </p>
              </div>

              <Card className="border-border-subtle bg-surface-raised">
                <CardHeader>
                  <CardTitle className="text-foreground">Current Plan</CardTitle>
                  <CardDescription className="text-foreground-muted">
                    You are currently on the Pro plan.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Row
                    justify="between"
                    align="center"
                    className="rounded-lg border border-border-subtle p-4"
                  >
                    <Column gap={0}>
                      <p className="font-semibold text-foreground">Pro Plan</p>
                      <p className="text-sm text-foreground-muted">
                        $29/month — Renews on Jan 1, 2025
                      </p>
                    </Column>
                    <Button variant="outline">Manage subscription</Button>
                  </Row>
                </CardContent>
              </Card>

              <Card className="border-border-subtle bg-surface-raised">
                <CardHeader>
                  <CardTitle className="text-foreground">Payment Method</CardTitle>
                  <CardDescription className="text-foreground-muted">
                    Update your payment information.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Row
                    justify="between"
                    align="center"
                    className="rounded-lg border border-border-subtle p-4"
                  >
                    <Row gap={3} align="center">
                      <Row
                        justify="center"
                        align="center"
                        className="h-10 w-14 rounded bg-surface-overlay"
                      >
                        <CreditCard className="h-5 w-5 text-foreground-muted" />
                      </Row>
                      <Column gap={0}>
                        <p className="font-medium text-foreground">•••• •••• •••• 4242</p>
                        <p className="text-sm text-foreground-muted">Expires 12/25</p>
                      </Column>
                    </Row>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </Row>
                </CardContent>
                <CardFooter className="border-t border-border-subtle px-6 py-4">
                  <Button variant="outline">Add payment method</Button>
                </CardFooter>
              </Card>
            </>
          )}
        </div>
      </ScrollArea>
    </AdminTemplate>
  );
}
