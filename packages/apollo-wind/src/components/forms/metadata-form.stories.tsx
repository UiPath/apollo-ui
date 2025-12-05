import type { Meta, StoryObj } from "@storybook/react";
import { MetadataForm } from "./metadata-form";
import { FormStateViewer } from "./form-state-viewer";
import type { FormSchema } from "./form-schema";
import { z } from "zod";
import { useForm, FormProvider, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RuleBuilder } from "./rules-engine";
import { autoSavePlugin, analyticsPlugin } from "./form-plugins";
import { setupDemoMocks } from "./demo-mocks";
import {
  cascadingDropdownsSchema,
  computedFieldsSchema,
  conditionalSectionsSchema,
  conditionalQuestionsSchema,
  automationJobSchema,
  multiStepSchema,
  fileUploadSchema,
  FileUploadExample,
} from "./form-examples";
import { SchemaViewer } from "./schema-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormContext, Controller } from "react-hook-form";
import { Toaster } from "@/components/ui/sonner";

// Setup mocks for cascading dropdown examples
setupDemoMocks();

const meta: Meta<typeof MetadataForm> = {
  title: "Forms/Examples",
  component: MetadataForm,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
A powerful metadata-driven form system built on React Hook Form and Zod.

**Features:**
- JSON schema-driven form generation
- Conditional logic (show/hide fields and sections)
- Cascading dropdowns with remote data fetching
- Multi-step wizard support
- File upload with progress tracking
- Plugin system for extensibility
- Collapsible sections
- Full TypeScript support

**Schema Patterns:**
- **Basic Forms** - Simple contact forms, surveys
- **Conditional Logic** - Show/hide fields based on user input
- **Cascading Data** - Dependent dropdowns with remote fetching
- **Multi-Step** - Wizard-style forms with step navigation
- **File Upload** - File handling with validation
        `,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const schema = context.args.schema as FormSchema | undefined;
      return (
        <>
          {schema && (
            <div className="flex justify-end mb-4">
              <SchemaViewer schema={schema} />
            </div>
          )}
          <Story />
          <Toaster />
        </>
      );
    },
  ],
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MetadataForm>;

// ============================================================================
// BASIC FORMS
// ============================================================================

const contactFormSchema: FormSchema = {
  id: "contact-form",
  title: "Contact Us",
  description: "Get in touch with our team",
  layout: {
    columns: 2,
    gap: 6,
  },
  sections: [
    {
      id: "contact-info",
      fields: [
        {
          name: "name",
          type: "text",
          label: "Full Name",
          placeholder: "John Doe",
          validation: {
            required: true,
            minLength: 2,
            messages: { minLength: "Name must be at least 2 characters" },
          },
          grid: { span: 2 },
        },
        {
          name: "email",
          type: "email",
          label: "Email Address",
          placeholder: "john@example.com",
          validation: {
            required: true,
            email: true,
            messages: { email: "Please enter a valid email" },
          },
        },
        {
          name: "phone",
          type: "text",
          label: "Phone Number",
          placeholder: "+1 (555) 123-4567",
        },
        {
          name: "subject",
          type: "select",
          label: "Subject",
          options: [
            { label: "General Inquiry", value: "general" },
            { label: "Technical Support", value: "support" },
            { label: "Sales", value: "sales" },
          ],
        },
        {
          name: "urgent",
          type: "switch",
          label: "Urgent Request",
          description: "Check if this requires immediate attention",
          defaultValue: false,
        },
        {
          name: "message",
          type: "textarea",
          label: "Message",
          placeholder: "How can we help you?",
          validation: {
            required: true,
            minLength: 10,
            messages: { minLength: "Please provide more details" },
          },
          grid: { span: 2 },
        },
      ],
    },
  ],
};

/**
 * Basic Contact Form
 *
 * A simple contact form demonstrating:
 * - Grid layout with column spans
 * - Various field types (text, email, select, switch, textarea)
 * - Zod validation
 * - Static data source for select options
 */
export const BasicContactForm: Story = {
  args: {
    schema: contactFormSchema,
    onSubmit: async (data) => {
      console.log("Form submitted:", data);
      alert("Form submitted! Check console for data.");
    },
  },
};

const compactFormSchema: FormSchema = {
  id: "compact-form",
  title: "Quick Survey",
  description: "This won't take long",
  layout: {
    columns: 1,
    gap: 4,
    variant: "compact",
  },
  sections: [
    {
      id: "s1",
      fields: [
        {
          name: "rating",
          type: "slider",
          label: "How satisfied are you?",
          min: 1,
          max: 5,
          step: 1,
          defaultValue: 3,
        },
        {
          name: "recommend",
          type: "radio",
          label: "Would you recommend us?",
          options: [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ],
        },
        {
          name: "feedback",
          type: "textarea",
          label: "Additional Feedback",
          placeholder: "Optional...",
        },
      ],
    },
  ],
};

/**
 * Compact Layout
 *
 * A minimal survey form with compact spacing.
 */
export const CompactLayout: Story = {
  args: {
    schema: compactFormSchema,
    onSubmit: async (data) => {
      console.log("Survey submitted:", data);
      alert("Thanks for your feedback!");
    },
  },
};

// ============================================================================
// FIELD TYPES SHOWCASE
// ============================================================================

const allFieldTypesSchema: FormSchema = {
  id: "field-showcase",
  title: "Field Types Showcase",
  description: "All available field types in one form",
  layout: {
    columns: 2,
    gap: 6,
  },
  sections: [
    {
      id: "text-fields",
      title: "Text Inputs",
      fields: [
        {
          name: "textField",
          type: "text",
          label: "Text Field",
          placeholder: "Enter text...",
        },
        {
          name: "emailField",
          type: "email",
          label: "Email Field",
          placeholder: "email@example.com",
        },
        {
          name: "numberField",
          type: "number",
          label: "Number Field",
          min: 0,
          max: 100,
        },
        {
          name: "textareaField",
          type: "textarea",
          label: "Textarea Field",
          placeholder: "Enter multiple lines...",
          grid: { span: 2 },
        },
      ],
    },
    {
      id: "selection-fields",
      title: "Selection Controls",
      fields: [
        {
          name: "selectField",
          type: "select",
          label: "Select Field",
          options: [
            { label: "Option 1", value: "1" },
            { label: "Option 2", value: "2" },
            { label: "Option 3", value: "3" },
          ],
        },
        {
          name: "multiselectField",
          type: "multiselect",
          label: "Multi-Select Field",
          options: [
            { label: "Red", value: "red" },
            { label: "Green", value: "green" },
            { label: "Blue", value: "blue" },
          ],
        },
        {
          name: "radioField",
          type: "radio",
          label: "Radio Group",
          options: [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
            { label: "Maybe", value: "maybe" },
          ],
        },
        {
          name: "checkboxField",
          type: "checkbox",
          label: "Checkbox",
          description: "I agree to the terms and conditions",
        },
      ],
    },
    {
      id: "special-fields",
      title: "Special Controls",
      fields: [
        {
          name: "switchField",
          type: "switch",
          label: "Switch Toggle",
          description: "Enable this feature",
          defaultValue: false,
        },
        {
          name: "sliderField",
          type: "slider",
          label: "Slider",
          min: 0,
          max: 100,
          step: 10,
          defaultValue: 50,
        },
        {
          name: "dateField",
          type: "date",
          label: "Date Picker",
        },
        {
          name: "fileField",
          type: "file",
          label: "File Upload",
          accept: ".pdf,.doc",
        },
      ],
    },
  ],
};

/**
 * All Field Types Showcase
 *
 * Demonstrates every available field type:
 * - Text, email, number, textarea
 * - Select, multiselect, radio, checkbox
 * - Switch, slider, date picker, file upload
 */
export const AllFieldTypesShowcase: Story = {
  args: {
    schema: allFieldTypesSchema,
    onSubmit: async (data) => {
      console.log("Showcase form submitted:", data);
      alert("Form submitted! Check console for all field values.");
    },
  },
};

// ============================================================================
// LAYOUT - COLLAPSIBLE SECTIONS
// ============================================================================

const collapsibleFormSchema: FormSchema = {
  id: "settings-form",
  title: "Application Settings",
  description: "Configure your application preferences",
  sections: [
    {
      id: "general",
      title: "General Settings",
      collapsible: true,
      defaultExpanded: true,
      fields: [
        {
          name: "appName",
          type: "text",
          label: "Application Name",
        },
        {
          name: "language",
          type: "select",
          label: "Language",
          options: [
            { label: "English", value: "en" },
            { label: "Spanish", value: "es" },
            { label: "French", value: "fr" },
          ],
        },
      ],
    },
    {
      id: "notifications",
      title: "Notification Settings",
      collapsible: true,
      defaultExpanded: false,
      fields: [
        {
          name: "emailNotif",
          type: "switch",
          label: "Email Notifications",
          defaultValue: true,
        },
        {
          name: "push",
          type: "switch",
          label: "Push Notifications",
          defaultValue: false,
        },
        {
          name: "sms",
          type: "switch",
          label: "SMS Notifications",
          defaultValue: false,
        },
      ],
    },
    {
      id: "advanced",
      title: "Advanced Settings",
      description: "For power users",
      collapsible: true,
      defaultExpanded: false,
      fields: [
        {
          name: "debugMode",
          type: "switch",
          label: "Debug Mode",
          description: "Enable verbose logging",
          defaultValue: false,
        },
        {
          name: "apiTimeout",
          type: "number",
          label: "API Timeout (ms)",
          min: 1000,
          max: 60000,
          defaultValue: 5000,
        },
      ],
    },
  ],
};

/**
 * Collapsible Sections
 *
 * Settings form with collapsible sections:
 * - Sections can be expanded/collapsed
 * - Default expanded state is configurable
 * - Great for organizing complex forms
 */
export const CollapsibleSections: Story = {
  args: {
    schema: collapsibleFormSchema,
    onSubmit: async (data) => {
      console.log("Settings saved:", data);
      alert("Settings saved!");
    },
  },
};

// ============================================================================
// CONDITIONAL LOGIC
// ============================================================================

const conditionalFormSchema: FormSchema = {
  id: "application-form",
  title: "Job Application",
  description: "Apply for a position at our company",
  sections: [
    {
      id: "basic",
      title: "Basic Information",
      fields: [
        {
          name: "position",
          type: "select",
          label: "Position Applying For",
          options: [
            { label: "Software Engineer", value: "engineer" },
            { label: "Product Manager", value: "pm" },
            { label: "Designer", value: "designer" },
          ],
        },
        {
          name: "yearsExperience",
          type: "slider",
          label: "Years of Experience",
          min: 0,
          max: 30,
          step: 1,
          defaultValue: 0,
        },
        {
          name: "hasManagementExp",
          type: "checkbox",
          label: "I have management experience",
        },
        {
          name: "managementYears",
          type: "number",
          label: "Years in Management",
          min: 0,
          rules: [
            new RuleBuilder("show-management-years")
              .when("hasManagementExp")
              .is(true)
              .show()
              .require()
              .build(),
          ],
        },
        {
          name: "salary",
          type: "number",
          label: "Expected Salary",
          placeholder: "60000",
        },
      ],
    },
    {
      id: "details",
      title: "Additional Details",
      fields: [
        {
          name: "availability",
          type: "radio",
          label: "Availability",
          options: [
            { label: "Immediate", value: "immediate" },
            { label: "2 weeks notice", value: "2weeks" },
            { label: "1 month notice", value: "1month" },
          ],
        },
        {
          name: "resume",
          type: "file",
          label: "Upload Resume",
          accept: ".pdf,.doc,.docx",
        },
        {
          name: "coverLetter",
          type: "textarea",
          label: "Cover Letter",
          placeholder: "Tell us why you're a great fit...",
        },
      ],
    },
  ],
};

/**
 * Conditional Fields
 *
 * Job application with field-level conditional logic:
 * - "Years in Management" only shows when checkbox is checked
 * - Uses RuleBuilder for declarative rules
 */
export const ConditionalFields: Story = {
  args: {
    schema: conditionalFormSchema,
    onSubmit: async (data) => {
      console.log("Application submitted:", data);
      alert("Application submitted! Check console for data.");
    },
  },
};

/**
 * Conditional Sections
 *
 * Job application with section-level conditional logic:
 * - "Work Experience" section only shows for mid/senior levels
 * - Professional references required for senior level
 * - Demonstrates section conditions and multi-select fields
 */
export const ConditionalSections: Story = {
  args: {
    schema: conditionalSectionsSchema,
    onSubmit: async (data) => {
      console.log("Application submitted:", data);
      alert("Application submitted successfully!");
    },
  },
};

/**
 * Conditional Questions
 *
 * Survey with conditional follow-up questions:
 * - Low satisfaction (1-6) shows "reason for rating" field
 * - Negative recommendation shows "improvement suggestions"
 * - Uses custom expression conditions
 */
export const ConditionalQuestions: Story = {
  args: {
    schema: conditionalQuestionsSchema,
    onSubmit: async (data) => {
      console.log("Survey responses:", data);
      alert("Thank you for your feedback!");
    },
  },
};

// ============================================================================
// CASCADING DATA
// ============================================================================

/**
 * Cascading Dropdowns - Location Selection
 *
 * Demonstrates dependent dropdown selections:
 * - Select a country to load states
 * - Select a state to load cities
 * - Uses `dataSource.params` with `$fieldName` syntax
 */
export const CascadingDropdowns: Story = {
  args: {
    schema: cascadingDropdownsSchema,
    onSubmit: async (data) => {
      console.log("Registration data:", data);
      alert("Registration submitted! Check console for data.");
    },
  },
};

/**
 * Product Configurator
 *
 * Three-level cascading selection:
 * - Category → Product → Variant
 * - Variant labels include pricing information
 */
export const ProductConfigurator: Story = {
  args: {
    schema: computedFieldsSchema,
    onSubmit: async (data) => {
      console.log("Product configuration:", data);
      alert("Order submitted! Check console for details.");
    },
  },
};

/**
 * Automation Job Config
 *
 * UiPath Orchestrator-style cascading:
 * - Folder → Process → Version → Robot
 * - JSON input validation for arguments
 * - Domain-specific workflow pattern
 */
export const AutomationJobConfig: Story = {
  args: {
    schema: automationJobSchema,
    onSubmit: async (data) => {
      console.log("Automation job config:", data);
      alert("Job scheduled! Check console for configuration.");
    },
  },
};

// ============================================================================
// MULTI-STEP
// ============================================================================

/**
 * Multi-Step Wizard
 *
 * Step-by-step user onboarding:
 * - Step indicator and navigation
 * - Previous/Next/Submit buttons
 * - Conditional fields within steps
 * - Initial data pre-loading
 */
export const MultiStepWizard: Story = {
  args: {
    schema: multiStepSchema,
    onSubmit: async (data) => {
      console.log("Onboarding complete:", data);
      alert("Welcome! Your account is set up.");
    },
  },
};

// ============================================================================
// FILE UPLOAD
// ============================================================================

/**
 * File Upload with Progress
 *
 * Demonstrates file handling:
 * - Multiple file selection
 * - File type and size validation
 * - Upload progress tracking
 * - Visual progress bars
 */
export const FileUpload: Story = {
  render: () => (
    <>
      <div className="flex justify-end mb-4">
        <SchemaViewer schema={fileUploadSchema} />
      </div>
      <FileUploadExample />
    </>
  ),
};

// ============================================================================
// PLUGINS
// ============================================================================

/**
 * With Plugins
 *
 * Demonstrates the plugin system:
 * - Auto-save plugin persists form data
 * - Analytics plugin logs field changes
 * - Try filling the form and refreshing
 */
export const WithPlugins: Story = {
  args: {
    schema: contactFormSchema,
    plugins: [autoSavePlugin, analyticsPlugin],
    onSubmit: async (data) => {
      console.log("Form with plugins submitted:", data);
      alert("Form submitted with auto-save and analytics!");
    },
  },
};

// ============================================================================
// DEVELOPMENT TOOLS
// ============================================================================

// Manual form component for state viewer demo
const ManualFormFields = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-6 p-6 border rounded-lg">
      <div>
        <h2 className="text-2xl font-bold">User Profile</h2>
        <p className="text-muted-foreground">Watch the state viewer update in real-time</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" placeholder="John Doe" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" placeholder="john@example.com" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input id="age" type="number" {...register("age", { valueAsNumber: true })} />
          {errors.age && <p className="text-sm text-destructive">{errors.age.message as string}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dev">Developer</SelectItem>
                  <SelectItem value="design">Designer</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Controller
            name="subscribe"
            control={control}
            render={({ field }) => (
              <Switch id="subscribe" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <Label htmlFor="subscribe">Subscribe to newsletter</Label>
        </div>
      </div>

      <Button type="submit" className="w-full">
        Submit
      </Button>
    </div>
  );
};

const StateViewerExample = () => {
  const zodSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    age: z.number().min(18, "Must be 18 or older").max(120),
    subscribe: z.boolean(),
    role: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(zodSchema),
    mode: "onChange",
    defaultValues: {
      subscribe: false,
      age: 25,
    },
  });

  const onSubmit = (data: FieldValues) => {
    console.log("Submitted:", data);
    alert("Check the state viewer and console to see the final values!");
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-6">
          <ManualFormFields />
          <FormStateViewer form={form} title="Live Form State" />
        </div>
      </form>
    </FormProvider>
  );
};

/**
 * With State Viewer
 *
 * Side-by-side form and state viewer:
 * - Watch state update in real-time
 * - See validation errors as you type
 * - Track dirty and touched fields
 */
export const WithStateViewer: Story = {
  render: () => <StateViewerExample />,
};

const CompactStateExample = () => {
  const zodSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    country: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(zodSchema),
    mode: "onChange",
  });

  const {
    register,
    control,
    formState: { errors },
  } = form;

  const onSubmit = (data: FieldValues) => {
    console.log("Submitted:", data);
    alert("Form submitted!");
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4 p-6 border rounded-lg">
          <h2 className="text-xl font-bold">Quick Form Example</h2>

          <div className="space-y-2">
            <Label htmlFor="name2">Name</Label>
            <Input id="name2" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email2">Email</Label>
            <Input id="email2" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <Button type="submit">Submit</Button>
        </div>

        <FormStateViewer form={form} compact />
      </form>
    </FormProvider>
  );
};

/**
 * With Compact State Viewer
 *
 * Inline compact state viewer below the form:
 * - Condensed view of form state
 * - Perfect for monitoring without taking space
 */
export const WithCompactStateViewer: Story = {
  render: () => <CompactStateExample />,
};

/**
 * With DevTools
 *
 * React Hook Form DevTools integration:
 * - Detailed state inspection panel
 * - Best for development debugging
 */
export const WithDevTools: Story = {
  args: {
    schema: contactFormSchema,
    showDevTools: true,
    onSubmit: async (data) => {
      console.log("Form submitted:", data);
      alert("Form submitted! Check DevTools panel for detailed state.");
    },
  },
};
