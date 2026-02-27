import type { Meta } from '@storybook/react-vite';
import { Bell, Shield, User } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Label } from './label';
import { Switch } from './switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Navigation/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};

export default meta;

// ============================================================================
// Basic
// ============================================================================

export const Basic = {
  name: 'Basic',
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <div className="rounded-lg border p-4">
          <p className="text-sm">Manage your account settings and preferences.</p>
        </div>
      </TabsContent>
      <TabsContent value="password">
        <div className="rounded-lg border p-4">
          <p className="text-sm">Change your password and security settings.</p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

// ============================================================================
// Line
// ============================================================================

export const Line = {
  name: 'Line',
  render: () => (
    <Tabs defaultValue="overview" className="w-[500px]">
      <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
        <TabsTrigger
          value="overview"
          className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
        >
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="analytics"
          className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
        >
          Analytics
        </TabsTrigger>
        <TabsTrigger
          value="reports"
          className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
        >
          Reports
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <div className="pt-4">
          <p className="text-sm">Overview of your project performance and metrics.</p>
        </div>
      </TabsContent>
      <TabsContent value="analytics">
        <div className="pt-4">
          <p className="text-sm">Detailed analytics and usage data.</p>
        </div>
      </TabsContent>
      <TabsContent value="reports">
        <div className="pt-4">
          <p className="text-sm">Generated reports and exports.</p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

// ============================================================================
// Disabled
// ============================================================================

export const Disabled = {
  name: 'Disabled',
  render: () => (
    <Tabs defaultValue="general" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="billing" disabled>
          Billing
        </TabsTrigger>
        <TabsTrigger value="advanced" disabled>
          Advanced
        </TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        <div className="rounded-lg border p-4">
          <p className="text-sm">General settings for your workspace.</p>
        </div>
      </TabsContent>
      <TabsContent value="security">
        <div className="rounded-lg border p-4">
          <p className="text-sm">Security and access control settings.</p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

// ============================================================================
// Examples
// ============================================================================

export const Examples = {
  name: 'Examples',
  render: () => (
    <div className="flex flex-col gap-10">
      {/* Settings page */}
      <div>
        <p className="text-sm font-medium mb-3">Settings Page</p>
        <Tabs defaultValue="profile" className="w-[500px]">
          <TabsList>
            <TabsTrigger value="profile" className="gap-1.5">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Update your personal information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="display-name">Display name</Label>
                  <Input id="display-name" defaultValue="John Doe" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue="john@example.com" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Configure how you receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Email notifications</p>
                    <p className="text-xs text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Push notifications</p>
                    <p className="text-xs text-muted-foreground">Receive push alerts</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Weekly digest</p>
                    <p className="text-xs text-muted-foreground">Get a summary every week</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Manage your password and two-factor authentication.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="current-pw">Current password</Label>
                  <Input id="current-pw" type="password" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-pw">New password</Label>
                  <Input id="new-pw" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Update password</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Pricing tabs */}
      <div>
        <p className="text-sm font-medium mb-3">Pricing Plans</p>
        <Tabs defaultValue="monthly" className="w-[500px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="annual">Annual</TabsTrigger>
          </TabsList>
          <TabsContent value="monthly">
            <div className="grid gap-4 pt-2">
              {[
                { name: 'Starter', price: '$9', desc: 'For individuals' },
                { name: 'Pro', price: '$29', desc: 'For small teams' },
                { name: 'Enterprise', price: '$99', desc: 'For organizations' },
              ].map((plan) => (
                <div key={plan.name} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">{plan.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{plan.price}</p>
                    <p className="text-xs text-muted-foreground">/month</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="annual">
            <div className="grid gap-4 pt-2">
              {[
                { name: 'Starter', price: '$7', desc: 'For individuals' },
                { name: 'Pro', price: '$23', desc: 'For small teams' },
                { name: 'Enterprise', price: '$79', desc: 'For organizations' },
              ].map((plan) => (
                <div key={plan.name} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">{plan.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{plan.price}</p>
                    <p className="text-xs text-muted-foreground">/month (billed annually)</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dashboard tabs (line style) */}
      <div>
        <p className="text-sm font-medium mb-3">Dashboard</p>
        <Tabs defaultValue="overview" className="w-[500px]">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            {['Overview', 'Automations', 'Logs', 'Settings'].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab.toLowerCase()}
                className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="overview">
            <div className="grid grid-cols-3 gap-4 pt-4">
              {[
                { label: 'Total Runs', value: '2,450' },
                { label: 'Success Rate', value: '98.2%' },
                { label: 'Avg Duration', value: '1.3s' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="automations">
            <div className="pt-4">
              <p className="text-sm text-muted-foreground">Your active automations and workflows.</p>
            </div>
          </TabsContent>
          <TabsContent value="logs">
            <div className="pt-4">
              <p className="text-sm text-muted-foreground">Recent execution logs and audit trail.</p>
            </div>
          </TabsContent>
          <TabsContent value="settings">
            <div className="pt-4">
              <p className="text-sm text-muted-foreground">Workspace configuration and preferences.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  ),
};
