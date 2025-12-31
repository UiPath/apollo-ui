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
