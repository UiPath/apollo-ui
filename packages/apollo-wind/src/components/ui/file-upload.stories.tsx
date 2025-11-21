import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { FileUpload } from "./file-upload";
import { Label } from "./label";

const meta = {
  title: "Design System/Forms/File Upload",
  component: FileUpload,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <div className="w-[400px]">
        <FileUpload onFilesChange={setFiles} />
      </div>
    );
  },
};

export const WithLabel: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <div className="w-[400px] space-y-2">
        <Label>Upload Documents</Label>
        <FileUpload onFilesChange={setFiles} />
      </div>
    );
  },
};

export const Multiple: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <div className="w-[400px]">
        <FileUpload onFilesChange={setFiles} multiple />
      </div>
    );
  },
};

export const ImageOnly: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <div className="w-[400px]">
        <FileUpload onFilesChange={setFiles} accept="image/png,image/jpeg,image/jpg,image/gif" />
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <div className="w-[400px]">
        <FileUpload onFilesChange={setFiles} disabled />
      </div>
    );
  },
};

export const WithPreview: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);

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

export const WithMaxSize: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);

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
