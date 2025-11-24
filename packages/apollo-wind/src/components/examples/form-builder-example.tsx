import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Row, Column, Grid } from "@/components/ui/layout";

interface FormData {
  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;

  // Preferences
  theme: string;
  language: string;
  notifications: boolean;
  newsletter: boolean;

  // Settings
  visibility: string;
  experience: number;
  interests: string[];

  // Advanced
  customJson: string;
}

export function FormBuilderExample() {
  const [formData, setFormData] = React.useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    theme: "system",
    language: "en",
    notifications: true,
    newsletter: false,
    visibility: "public",
    experience: 5,
    interests: [],
    customJson: "{}",
  });

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      bio: "",
      theme: "system",
      language: "en",
      notifications: true,
      newsletter: false,
      visibility: "public",
      experience: 5,
      interests: [],
      customJson: "{}",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Form submitted! Check the JSON preview.");
  };

  return (
    <Column h="screen" w="full" className="bg-background">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50} minSize={30}>
          <ScrollArea className="h-screen">
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Form Builder</h1>
                <p className="text-muted-foreground">
                  A powerful example showcasing forms, tabs, and live JSON preview
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="preferences">Preferences</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Enter your personal details below</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Grid gap={4} cols={2} className="md:grid-cols-2">
                          <Column gap={2}>
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              placeholder="John"
                              value={formData.firstName}
                              onChange={(e) => updateField("firstName", e.target.value)}
                            />
                          </Column>
                          <Column gap={2}>
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              placeholder="Doe"
                              value={formData.lastName}
                              onChange={(e) => updateField("lastName", e.target.value)}
                            />
                          </Column>
                        </Grid>
                        <Column gap={2}>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john.doe@example.com"
                            value={formData.email}
                            onChange={(e) => updateField("email", e.target.value)}
                          />
                        </Column>
                        <Column gap={2}>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={formData.phone}
                            onChange={(e) => updateField("phone", e.target.value)}
                          />
                        </Column>
                        <Column gap={2}>
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            placeholder="Tell us about yourself..."
                            rows={4}
                            value={formData.bio}
                            onChange={(e) => updateField("bio", e.target.value)}
                          />
                        </Column>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="preferences" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Preferences</CardTitle>
                        <CardDescription>Customize your experience</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <Column gap={2}>
                          <Label htmlFor="theme">Theme</Label>
                          <Select
                            value={formData.theme}
                            onValueChange={(value) => updateField("theme", value)}
                          >
                            <SelectTrigger id="theme">
                              <SelectValue placeholder="Select a theme" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">Light</SelectItem>
                              <SelectItem value="dark">Dark</SelectItem>
                              <SelectItem value="system">System</SelectItem>
                            </SelectContent>
                          </Select>
                        </Column>

                        <Column gap={2}>
                          <Label htmlFor="language">Language</Label>
                          <Select
                            value={formData.language}
                            onValueChange={(value) => updateField("language", value)}
                          >
                            <SelectTrigger id="language">
                              <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Spanish</SelectItem>
                              <SelectItem value="fr">French</SelectItem>
                              <SelectItem value="de">German</SelectItem>
                              <SelectItem value="ja">Japanese</SelectItem>
                            </SelectContent>
                          </Select>
                        </Column>

                        <Row justify="between" align="center">
                          <Column gap={0.5}>
                            <Label htmlFor="notifications">Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive notifications about your account
                            </p>
                          </Column>
                          <Switch
                            id="notifications"
                            checked={formData.notifications}
                            onCheckedChange={(checked) => updateField("notifications", checked)}
                          />
                        </Row>

                        <Row gap={2} align="center">
                          <Checkbox
                            id="newsletter"
                            checked={formData.newsletter}
                            onCheckedChange={(checked) => updateField("newsletter", !!checked)}
                          />
                          <Label
                            htmlFor="newsletter"
                            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Subscribe to newsletter
                          </Label>
                        </Row>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Settings</CardTitle>
                        <CardDescription>Configure your account settings</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <Column gap={3}>
                          <Label>Profile Visibility</Label>
                          <RadioGroup
                            value={formData.visibility}
                            onValueChange={(value) => updateField("visibility", value)}
                          >
                            <Row gap={2} align="center">
                              <RadioGroupItem value="public" id="public" />
                              <Label htmlFor="public" className="font-normal">
                                Public - Anyone can see your profile
                              </Label>
                            </Row>
                            <Row gap={2} align="center">
                              <RadioGroupItem value="private" id="private" />
                              <Label htmlFor="private" className="font-normal">
                                Private - Only you can see your profile
                              </Label>
                            </Row>
                            <Row gap={2} align="center">
                              <RadioGroupItem value="friends" id="friends" />
                              <Label htmlFor="friends" className="font-normal">
                                Friends - Only friends can see your profile
                              </Label>
                            </Row>
                          </RadioGroup>
                        </Column>

                        <Column gap={3}>
                          <Row justify="between" align="center">
                            <Label htmlFor="experience">
                              Experience Level: {formData.experience}
                            </Label>
                          </Row>
                          <Slider
                            id="experience"
                            min={0}
                            max={10}
                            step={1}
                            value={[formData.experience]}
                            onValueChange={(value) => updateField("experience", value[0])}
                          />
                          <Row justify="between" className="text-xs text-muted-foreground">
                            <span>Beginner</span>
                            <span>Expert</span>
                          </Row>
                        </Column>

                        <Column gap={3}>
                          <Label>Interests</Label>
                          <Column gap={2}>
                            {["Technology", "Design", "Business", "Science", "Arts"].map(
                              (interest) => (
                                <Row key={interest} gap={2} align="center">
                                  <Checkbox
                                    id={interest}
                                    checked={formData.interests.includes(interest)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        updateField("interests", [...formData.interests, interest]);
                                      } else {
                                        updateField(
                                          "interests",
                                          formData.interests.filter((i) => i !== interest),
                                        );
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor={interest}
                                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {interest}
                                  </Label>
                                </Row>
                              ),
                            )}
                          </Column>
                        </Column>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Advanced Settings</CardTitle>
                        <CardDescription>
                          Configure advanced options with custom JSON
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Column gap={2}>
                          <Label htmlFor="customJson">Custom Configuration (JSON)</Label>
                          <Textarea
                            id="customJson"
                            placeholder='{"key": "value"}'
                            rows={10}
                            className="font-mono text-sm"
                            value={formData.customJson}
                            onChange={(e) => updateField("customJson", e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Enter valid JSON for custom configuration
                          </p>
                        </Column>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <Row gap={4}>
                  <Button type="submit">Submit</Button>
                  <Button type="button" variant="outline" onClick={handleReset}>
                    Reset
                  </Button>
                </Row>
              </form>
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={50} minSize={30}>
          <Column h="screen" className="border-l">
            <ScrollArea className="h-full">
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold tracking-tight">JSON Preview</h2>
                  <p className="text-muted-foreground">Live preview of your form data</p>
                </div>
                <Card>
                  <CardContent className="p-4">
                    <pre className="overflow-x-auto text-sm">
                      <code>{JSON.stringify(formData, null, 2)}</code>
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </Column>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Column>
  );
}
