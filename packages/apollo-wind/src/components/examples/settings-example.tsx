import * as React from "react";
import { Bell, Key, Palette, Shield, User, CreditCard } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  { id: "account", label: "Account", icon: <Key className="h-4 w-4" /> },
  { id: "appearance", label: "Appearance", icon: <Palette className="h-4 w-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { id: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
  { id: "billing", label: "Billing", icon: <CreditCard className="h-4 w-4" /> },
];

export function SettingsExample() {
  const [activeSection, setActiveSection] = React.useState("profile");
  const [formData, setFormData] = React.useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    username: "johndoe",
    bio: "Software developer passionate about building great products.",
    theme: "system",
    language: "en",
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    twoFactor: false,
  });

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center px-4">
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <div className="container mx-auto flex gap-8 p-6">
        {/* Sidebar Navigation */}
        <aside className="w-56 shrink-0">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  activeSection === item.id
                    ? "bg-muted font-medium"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-6">
          {activeSection === "profile" && (
            <>
              <div>
                <h2 className="text-2xl font-bold">Profile</h2>
                <p className="text-muted-foreground">Manage your public profile information.</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Avatar</CardTitle>
                  <CardDescription>
                    Click on the avatar to upload a custom one from your files.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-lg">JD</AvatarFallback>
                  </Avatar>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm">
                      Upload
                    </Button>
                    <Button variant="ghost" size="sm">
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => updateField("firstName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => updateField("lastName", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => updateField("username", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => updateField("bio", e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Brief description for your profile. URLs are hyperlinked.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button>Save changes</Button>
                </CardFooter>
              </Card>
            </>
          )}

          {activeSection === "account" && (
            <>
              <div>
                <h2 className="text-2xl font-bold">Account</h2>
                <p className="text-muted-foreground">
                  Manage your account settings and email preferences.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Email</CardTitle>
                  <CardDescription>
                    Your email address is used for login and notifications.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button>Update email</Button>
                </CardFooter>
              </Card>

              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Irreversible and destructive actions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Delete account</p>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data.
                      </p>
                    </div>
                    <Button variant="destructive">Delete account</Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeSection === "appearance" && (
            <>
              <div>
                <h2 className="text-2xl font-bold">Appearance</h2>
                <p className="text-muted-foreground">
                  Customize the appearance of the application.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Theme</CardTitle>
                  <CardDescription>Select your preferred theme for the dashboard.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={formData.theme}
                      onValueChange={(value) => updateField("theme", value)}
                    >
                      <SelectTrigger id="theme" className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => updateField("language", value)}
                    >
                      <SelectTrigger id="language" className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeSection === "notifications" && (
            <>
              <div>
                <h2 className="text-2xl font-bold">Notifications</h2>
                <p className="text-muted-foreground">Configure how you receive notifications.</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose what notifications you want to receive.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email.
                      </p>
                    </div>
                    <Switch
                      checked={formData.emailNotifications}
                      onCheckedChange={(checked) => updateField("emailNotifications", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications on your device.
                      </p>
                    </div>
                    <Switch
                      checked={formData.pushNotifications}
                      onCheckedChange={(checked) => updateField("pushNotifications", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive emails about new features and updates.
                      </p>
                    </div>
                    <Switch
                      checked={formData.marketingEmails}
                      onCheckedChange={(checked) => updateField("marketingEmails", checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeSection === "security" && (
            <>
              <div>
                <h2 className="text-2xl font-bold">Security</h2>
                <p className="text-muted-foreground">Manage your security preferences.</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>Change your password here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button>Update password</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Add an extra layer of security to your account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-medium">Enable 2FA</p>
                      <p className="text-sm text-muted-foreground">
                        Secure your account with two-factor authentication.
                      </p>
                    </div>
                    <Switch
                      checked={formData.twoFactor}
                      onCheckedChange={(checked) => updateField("twoFactor", checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeSection === "billing" && (
            <>
              <div>
                <h2 className="text-2xl font-bold">Billing</h2>
                <p className="text-muted-foreground">
                  Manage your billing information and subscription.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>You are currently on the Pro plan.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-semibold">Pro Plan</p>
                      <p className="text-sm text-muted-foreground">
                        $29/month • Renews on Jan 1, 2025
                      </p>
                    </div>
                    <Button variant="outline">Manage subscription</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>Update your payment information.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-14 items-center justify-center rounded bg-muted">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">•••• •••• •••• 4242</p>
                        <p className="text-sm text-muted-foreground">Expires 12/25</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button variant="outline">Add payment method</Button>
                </CardFooter>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
