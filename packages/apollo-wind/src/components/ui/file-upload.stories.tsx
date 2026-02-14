import { useState } from 'react';

import type { Meta } from '@storybook/react-vite';

import { FileUpload } from './file-upload';
import { Label } from './label';

const meta = {
  title: 'Design System/Core/File Upload',
  component: FileUpload,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FileUpload>;

export default meta;

export const Default = {
  args: {},
  render: () => {
    const [, setFiles] = useState<File[]>([]);

    return (
      <div className="w-[400px]">
        <FileUpload onFilesChange={setFiles} />
      </div>
    );
  },
};

export const WithLabel = {
  args: {},
  render: () => {
    const [, setFiles] = useState<File[]>([]);

    return (
      <div className="w-[400px] space-y-2">
        <Label>Upload Documents</Label>
        <FileUpload onFilesChange={setFiles} />
      </div>
    );
  },
};

export const Multiple = {
  args: {},
  render: () => {
    const [, setFiles] = useState<File[]>([]);

    return (
      <div className="w-[400px]">
        <FileUpload onFilesChange={setFiles} multiple />
      </div>
    );
  },
};

export const ImageOnly = {
  args: {},
  render: () => {
    const [, setFiles] = useState<File[]>([]);

    return (
      <div className="w-[400px]">
        <FileUpload onFilesChange={setFiles} accept="image/png,image/jpeg,image/jpg,image/gif" />
      </div>
    );
  },
};

export const Disabled = {
  args: {},
  render: () => {
    const [, setFiles] = useState<File[]>([]);

    return (
      <div className="w-[400px]">
        <FileUpload onFilesChange={setFiles} disabled />
      </div>
    );
  },
};

export const WithPreview = {
  args: {},
  render: () => {
    const [, setFiles] = useState<File[]>([]);

    return (
      <div className="w-[400px]">
        <FileUpload
          onFilesChange={setFiles}
          accept="image/png,image/jpeg,image/jpg,image/gif"
          multiple
          showPreview
        />
      </div>
    );
  },
};

export const WithMaxSize = {
  args: {},
  render: () => {
    const [, setFiles] = useState<File[]>([]);

    return (
      <div className="w-[400px]">
        <FileUpload
          onFilesChange={setFiles}
          maxSize={1024 * 1024} // 1MB
          multiple
        />
      </div>
    );
  },
};

export const WithExternalErrors = {
  args: {},
  render: () => {
    const [files, setFiles] = useState<File[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isUploading, setIsUploading] = useState(false);

    const simulateUpload = async () => {
      if (files.length === 0) return;

      setIsUploading(true);
      setErrors({});

      // Simulate upload with random failures
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newErrors: Record<string, string> = {};
      files.forEach((file) => {
        // Randomly fail some uploads for demo
        if (Math.random() > 0.5) {
          newErrors[file.name] = 'Upload failed: Server error';
        }
      });

      setErrors(newErrors);
      setIsUploading(false);
    };

    return (
      <div className="w-[400px] space-y-4">
        <FileUpload onFilesChange={setFiles} multiple errors={errors} />
        <button
          onClick={simulateUpload}
          disabled={files.length === 0 || isUploading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
        >
          {isUploading ? 'Uploading...' : 'Simulate Upload'}
        </button>
        <p className="text-xs text-muted-foreground">
          Click &quot;Simulate Upload&quot; to see random upload failures displayed per file.
        </p>
      </div>
    );
  },
};
