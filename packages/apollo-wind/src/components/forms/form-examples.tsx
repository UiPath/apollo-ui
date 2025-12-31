/**
 * Form Examples
 *
 * Consolidated examples demonstrating MetadataForm capabilities:
 * - Schema definitions for dynamic form features
 * - React components for real-world integration patterns
 *
 * All validation uses ValidationConfig (JSON-serializable) instead of Zod schemas.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { MetadataForm } from './metadata-form';
import type { FormSchema } from './form-schema';
import { RuleBuilder } from './rules-engine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// Example 1: User Registration - Cascading Dropdowns
// ============================================================================

/**
 * Demonstrates cascading dropdowns pattern.
 * Country -> State -> City selection with remote data fetching.
 */
export const cascadingDropdownsSchema: FormSchema = {
  id: 'user-registration',
  title: 'User Registration',
  description: 'Create your account with location details',
  sections: [
    {
      id: 'personal',
      title: 'Personal Information',
      fields: [
        {
          name: 'fullName',
          type: 'text',
          label: 'Full Name',
          placeholder: 'John Doe',
          validation: {
            required: true,
            minLength: 2,
            messages: { minLength: 'Name must be at least 2 characters' },
          },
        },
        {
          name: 'email',
          type: 'email',
          label: 'Email Address',
          placeholder: 'john@example.com',
          validation: {
            required: true,
            email: true,
            messages: { email: 'Invalid email address' },
          },
        },
      ],
    },
    {
      id: 'location',
      title: 'Location Details',
      description: 'Select your country, state, and city',
      fields: [
        {
          name: 'country',
          type: 'select',
          label: 'Country',
          placeholder: 'Select your country',
          dataSource: {
            type: 'fetch',
            url: '/api/countries',
            method: 'GET',
            transform: 'data.map(c => ({ label: c.name, value: c.code }))',
          },
          validation: {
            required: true,
            messages: { required: 'Country is required' },
          },
        },
        {
          name: 'state',
          type: 'select',
          label: 'State/Province',
          placeholder: 'Select your state',
          dataSource: {
            type: 'remote',
            endpoint: '/api/states',
            params: { countryCode: '$country' },
          },
          rules: [
            new RuleBuilder('show-state-when-country-selected')
              .when('country')
              .isNot('')
              .show()
              .require()
              .build(),
          ],
        },
        {
          name: 'city',
          type: 'select',
          label: 'City',
          placeholder: 'Select your city',
          dataSource: {
            type: 'remote',
            endpoint: '/api/cities',
            params: { countryCode: '$country', stateCode: '$state' },
          },
          rules: [
            new RuleBuilder('show-city-when-state-selected')
              .when('state')
              .isNot('')
              .show()
              .require()
              .build(),
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// Example 2: Product Configurator - Cascading Selections
// ============================================================================

/**
 * Demonstrates cascading product selection.
 * Category -> Product -> Variant with pricing shown in variant label.
 */
export const computedFieldsSchema: FormSchema = {
  id: 'product-configurator',
  title: 'Product Configuration',
  description: 'Customize your product',
  sections: [
    {
      id: 'product-selection',
      title: 'Select Your Product',
      fields: [
        {
          name: 'category',
          type: 'select',
          label: 'Product Category',
          dataSource: {
            type: 'fetch',
            url: '/api/product-categories',
            method: 'GET',
            transform: 'data.categories.map(c => ({ label: c.name, value: c.id }))',
          },
        },
        {
          name: 'product',
          type: 'select',
          label: 'Select Product',
          dataSource: {
            type: 'remote',
            endpoint: '/api/products',
            params: { categoryId: '$category' },
          },
          rules: [
            new RuleBuilder('show-product-when-category-selected')
              .when('category')
              .isNot('')
              .show()
              .require()
              .build(),
          ],
        },
        {
          name: 'variant',
          type: 'select',
          label: 'Product Variant (includes price)',
          dataSource: {
            type: 'remote',
            endpoint: '/api/product-variants',
            params: { productId: '$product' },
          },
          rules: [
            new RuleBuilder('show-variant-when-product-selected')
              .when('product')
              .isNot('')
              .show()
              .require()
              .build(),
          ],
        },
      ],
    },
    {
      id: 'order',
      title: 'Order Details',
      fields: [
        {
          name: 'quantity',
          type: 'number',
          label: 'Quantity',
          placeholder: '1',
          min: 1,
          max: 100,
          defaultValue: 1,
          validation: {
            required: true,
            min: 1,
            max: 100,
          },
        },
        {
          name: 'notes',
          type: 'textarea',
          label: 'Order Notes',
          placeholder: 'Any special instructions...',
        },
      ],
    },
  ],
};

// ============================================================================
// Example 3: Job Application - Conditional Sections + Multi-Select
// ============================================================================

/**
 * Demonstrates conditional sections and multi-select fields.
 * Shows different fields based on experience level.
 */
export const conditionalSectionsSchema: FormSchema = {
  id: 'job-application',
  title: 'Job Application',
  description: 'Apply for a position at our company',
  sections: [
    {
      id: 'basic-info',
      title: 'Basic Information',
      fields: [
        {
          name: 'firstName',
          type: 'text',
          label: 'First Name',
          validation: { required: true },
        },
        {
          name: 'lastName',
          type: 'text',
          label: 'Last Name',
          validation: { required: true },
        },
        {
          name: 'email',
          type: 'email',
          label: 'Email',
          validation: { required: true, email: true },
        },
      ],
    },
    {
      id: 'position',
      title: 'Position Details',
      fields: [
        {
          name: 'department',
          type: 'select',
          label: 'Department',
          dataSource: {
            type: 'fetch',
            url: '/api/departments',
            method: 'GET',
            transform: 'data.map(d => ({ label: d.name, value: d.id }))',
          },
        },
        {
          name: 'position',
          type: 'select',
          label: 'Position',
          dataSource: {
            type: 'remote',
            endpoint: '/api/positions',
            params: { departmentId: '$department' },
          },
          rules: [
            new RuleBuilder('show-position').when('department').isNot('').show().require().build(),
          ],
        },
        {
          name: 'experienceLevel',
          type: 'select',
          label: 'Experience Level',
          options: [
            { label: 'Entry Level (0-2 years)', value: 'entry' },
            { label: 'Mid Level (3-5 years)', value: 'mid' },
            { label: 'Senior Level (6+ years)', value: 'senior' },
          ],
        },
      ],
    },
    {
      id: 'skills',
      title: 'Technical Skills',
      description: 'Select your relevant skills',
      fields: [
        {
          name: 'primarySkills',
          type: 'multiselect',
          label: 'Primary Skills',
          placeholder: 'Select your primary skills...',
          validation: {
            required: true,
            minItems: 1,
            messages: { minItems: 'Select at least one skill' },
          },
          options: [
            { label: 'JavaScript', value: 'javascript' },
            { label: 'TypeScript', value: 'typescript' },
            { label: 'Python', value: 'python' },
            { label: 'Java', value: 'java' },
            { label: 'C#', value: 'csharp' },
            { label: 'Go', value: 'go' },
            { label: 'React', value: 'react' },
            { label: 'Node.js', value: 'nodejs' },
          ],
        },
      ],
    },
    {
      id: 'experience',
      title: 'Work Experience',
      // Only show for mid/senior candidates
      conditions: [{ when: 'experienceLevel', in: ['mid', 'senior'] }],
      fields: [
        {
          name: 'currentCompany',
          type: 'text',
          label: 'Current Company',
        },
        {
          name: 'yearsExperience',
          type: 'number',
          label: 'Years of Experience',
          min: 0,
          max: 50,
        },
        {
          name: 'references',
          type: 'textarea',
          label: 'Professional References',
          placeholder: 'List 2-3 professional references',
          rules: [
            new RuleBuilder('require-references-senior')
              .when('experienceLevel')
              .is('senior')
              .require()
              .build(),
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// Example 4: Dynamic Survey - Conditional Questions
// ============================================================================

/**
 * Demonstrates conditional questions based on user responses.
 * Shows follow-up questions based on ratings.
 */
export const conditionalQuestionsSchema: FormSchema = {
  id: 'dynamic-survey',
  title: 'Customer Satisfaction Survey',
  description: 'Help us improve our service',
  sections: [
    {
      id: 'satisfaction',
      title: 'Overall Satisfaction',
      fields: [
        {
          name: 'overallRating',
          type: 'slider',
          label: 'How satisfied are you with our service?',
          min: 1,
          max: 10,
          step: 1,
          defaultValue: 5,
        },
        {
          name: 'feedbackReason',
          type: 'textarea',
          label: 'What is the main reason for your rating?',
          placeholder: 'Please tell us more...',
          // Only show if rating is low (1-6)
          rules: [
            new RuleBuilder('show-feedback-low')
              .withCustomExpression('overallRating <= 6')
              .show()
              .require()
              .build(),
          ],
        },
      ],
    },
    {
      id: 'recommendations',
      title: 'Recommendations',
      fields: [
        {
          name: 'wouldRecommend',
          type: 'radio',
          label: 'Would you recommend us to others?',
          options: [
            { label: 'Definitely Yes', value: 'yes' },
            { label: 'Probably Yes', value: 'maybe-yes' },
            { label: 'Not Sure', value: 'unsure' },
            { label: 'Probably Not', value: 'maybe-no' },
            { label: 'Definitely Not', value: 'no' },
          ],
        },
        {
          name: 'improvementSuggestions',
          type: 'textarea',
          label: 'How can we improve?',
          placeholder: 'Your suggestions are valuable to us...',
          rules: [
            new RuleBuilder('show-improvements')
              .when('wouldRecommend')
              .in(['unsure', 'maybe-no', 'no'])
              .show()
              .require()
              .build(),
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// Example 5: Automation Job Config - UiPath Pattern
// ============================================================================

/**
 * Demonstrates UiPath Orchestrator-style cascading selection.
 * Folder -> Process -> Version -> Robot selection.
 */
export const automationJobSchema: FormSchema = {
  id: 'automation-job-config',
  title: 'Configure Automation Job',
  description: 'Set up an automation process execution',
  sections: [
    {
      id: 'process',
      title: 'Process Selection',
      fields: [
        {
          name: 'folder',
          type: 'select',
          label: 'Orchestrator Folder',
          dataSource: {
            type: 'fetch',
            url: '/api/orchestrator/folders',
            method: 'GET',
            transform: 'data.value.map(f => ({ label: f.DisplayName, value: f.Id }))',
          },
        },
        {
          name: 'process',
          type: 'select',
          label: 'Process Package',
          dataSource: {
            type: 'remote',
            endpoint: '/api/orchestrator/processes',
            params: { folderId: '$folder' },
          },
          rules: [
            new RuleBuilder('show-process').when('folder').isNot('').show().require().build(),
          ],
        },
        {
          name: 'version',
          type: 'select',
          label: 'Package Version',
          dataSource: {
            type: 'remote',
            endpoint: '/api/orchestrator/package-versions',
            params: { processKey: '$process' },
          },
          rules: [
            new RuleBuilder('show-version').when('process').isNot('').show().require().build(),
          ],
        },
      ],
    },
    {
      id: 'execution',
      title: 'Execution Settings',
      fields: [
        {
          name: 'robot',
          type: 'select',
          label: 'Robot',
          dataSource: {
            type: 'remote',
            endpoint: '/api/orchestrator/robots',
            params: { folderId: '$folder' },
          },
          rules: [new RuleBuilder('show-robot').when('folder').isNot('').show().require().build()],
        },
        {
          name: 'priority',
          type: 'select',
          label: 'Priority',
          options: [
            { label: 'Low', value: 'Low' },
            { label: 'Normal', value: 'Normal' },
            { label: 'High', value: 'High' },
          ],
          defaultValue: 'Normal',
        },
        {
          name: 'inputArguments',
          type: 'textarea',
          label: 'Input Arguments (JSON)',
          placeholder: '{"argument1": "value1"}',
          // Note: JSON validation would need custom validation at runtime
          // For now, this is handled by the form submission handler
        },
      ],
    },
  ],
};

// ============================================================================
// Example 6: Multi-Step Onboarding
// ============================================================================

/**
 * Demonstrates multi-step form wizard pattern.
 * Step-by-step user onboarding with data pre-loading.
 */
export const multiStepSchema: FormSchema = {
  id: 'user-onboarding',
  title: "Welcome! Let's set up your account",
  description: 'Complete these steps to get started',
  initialData: {
    firstName: '',
    lastName: '',
    timezone: '',
    emailNotifications: true,
    notificationFrequency: 'daily',
    acceptTerms: false,
  },
  steps: [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Tell us about yourself',
      sections: [
        {
          id: 'basic',
          fields: [
            {
              name: 'firstName',
              type: 'text',
              label: 'First Name',
              validation: { required: true },
            },
            {
              name: 'lastName',
              type: 'text',
              label: 'Last Name',
              validation: { required: true },
            },
            {
              name: 'timezone',
              type: 'select',
              label: 'Timezone',
              dataSource: {
                type: 'fetch',
                url: '/api/timezones',
                method: 'GET',
                transform: 'data.map(tz => ({ label: tz.label, value: tz.value }))',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Customize your experience',
      sections: [
        {
          id: 'notifications',
          fields: [
            {
              name: 'emailNotifications',
              type: 'switch',
              label: 'Email Notifications',
              description: 'Receive updates via email',
              defaultValue: true,
            },
            {
              name: 'notificationFrequency',
              type: 'select',
              label: 'Notification Frequency',
              options: [
                { label: 'Real-time', value: 'realtime' },
                { label: 'Daily Digest', value: 'daily' },
                { label: 'Weekly Digest', value: 'weekly' },
              ],
              rules: [
                new RuleBuilder('show-frequency')
                  .when('emailNotifications')
                  .is(true)
                  .show()
                  .require()
                  .build(),
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'complete',
      title: 'All Set!',
      description: 'Review and confirm your settings',
      sections: [
        {
          id: 'summary',
          fields: [
            {
              name: 'acceptTerms',
              type: 'checkbox',
              label: 'I accept the Terms of Service and Privacy Policy',
              validation: {
                required: true,
                messages: { required: 'You must accept the terms' },
              },
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// Example 7: File Upload with Progress (React Component)
// ============================================================================

export const fileUploadSchema: FormSchema = {
  id: 'document-upload',
  title: 'Document Upload',
  description: 'Upload your documents for processing',
  sections: [
    {
      id: 'uploader-info',
      title: 'Your Information',
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Full Name',
          validation: {
            required: true,
            minLength: 2,
          },
        },
        {
          name: 'email',
          type: 'email',
          label: 'Email',
          validation: {
            required: true,
            email: true,
          },
        },
        {
          name: 'department',
          type: 'select',
          label: 'Department',
          options: [
            { label: 'Engineering', value: 'engineering' },
            { label: 'Design', value: 'design' },
            { label: 'Marketing', value: 'marketing' },
            { label: 'Sales', value: 'sales' },
            { label: 'HR', value: 'hr' },
          ],
          validation: { required: true },
        },
      ],
    },
    {
      id: 'documents',
      title: 'Documents',
      fields: [
        {
          name: 'documentType',
          type: 'select',
          label: 'Document Type',
          options: [
            { label: 'Invoice', value: 'invoice' },
            { label: 'Receipt', value: 'receipt' },
            { label: 'Contract', value: 'contract' },
            { label: 'Report', value: 'report' },
            { label: 'Other', value: 'other' },
          ],
          validation: {
            required: true,
            messages: { required: 'Please select a document type' },
          },
        },
        {
          name: 'files',
          type: 'file',
          label: 'Upload Files',
          accept: '.pdf,.doc,.docx,.xls,.xlsx',
          multiple: true,
          maxSize: 10 * 1024 * 1024, // 10MB
        },
        {
          name: 'notes',
          type: 'textarea',
          label: 'Additional Notes',
          placeholder: 'Any special instructions or comments...',
        },
      ],
    },
  ],
};

/**
 * File Upload Example Component
 * Demonstrates file upload with progress tracking.
 */
export function FileUploadExample() {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const simulateFileUpload = async (file: File): Promise<void> => {
    const fileName = file.name;
    const chunks = 20;

    for (let i = 0; i <= chunks; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setUploadProgress((prev) => ({ ...prev, [fileName]: (i / chunks) * 100 }));
    }

    setUploadedFiles((prev) => [...prev, fileName]);
    toast.success(`Uploaded ${fileName}`);
  };

  const handleSubmit = async (data: unknown) => {
    try {
      const formData = data as Record<string, unknown>;
      const files = formData.files;

      if (files) {
        const fileList: File[] = files instanceof FileList ? Array.from(files) : [files as File];

        // Validate file sizes
        const oversizedFiles = fileList.filter((f) => f.size > 10 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
          toast.error('Some files are too large', {
            description: `Maximum size is 10MB. Remove: ${oversizedFiles.map((f) => f.name).join(', ')}`,
          });
          return;
        }

        toast.info(`Uploading ${fileList.length} file(s)...`);

        for (const file of fileList) {
          await simulateFileUpload(file);
        }

        toast.success('All files uploaded successfully!', {
          description: `${fileList.length} document(s) processed`,
        });

        console.log('Upload complete:', {
          ...formData,
          fileNames: fileList.map((f) => f.name),
        });

        // Reset progress after delay
        setTimeout(() => {
          setUploadProgress({});
          setUploadedFiles([]);
        }, 3000);
      }
    } catch (error) {
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <MetadataForm schema={fileUploadSchema} onSubmit={handleSubmit} />

      {/* Upload Progress Display */}
      {Object.keys(uploadProgress).length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Upload Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="truncate flex-1">{fileName}</span>
                  <span className="ml-2 text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {uploadedFiles.map((fileName, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    ✓
                  </Badge>
                  <span>{fileName}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
