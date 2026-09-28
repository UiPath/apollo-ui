import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import type { FormSchema } from './form-schema';
import { schemaToJson } from './schema-serializer';
import { FormWithSchemaViewer, SchemaViewer, withSchemaViewer } from './schema-viewer';

const sampleSchema: FormSchema = {
  id: 'sample-form',
  title: 'Sample Form',
  description: 'A form for schema viewer tests',
  sections: [
    {
      id: 'personal-info',
      title: 'Personal Info',
      fields: [
        { name: 'fullName', type: 'text', label: 'Full Name' },
        { name: 'email', type: 'email', label: 'Email Address' },
      ],
    },
    {
      id: 'preferences',
      title: 'Preferences',
      fields: [
        {
          name: 'role',
          type: 'select',
          label: 'Role',
          options: [
            { label: 'Developer', value: 'dev' },
            { label: 'Designer', value: 'design' },
          ],
        },
      ],
    },
  ],
};

function getRenderedJson(): string {
  const code = document.querySelector('pre code');
  if (!code) throw new Error('Schema JSON code block not found');
  return code.textContent ?? '';
}

describe('SchemaViewer', () => {
  describe('rendering', () => {
    it('renders the default trigger button', () => {
      render(<SchemaViewer schema={sampleSchema} />);

      expect(screen.getByRole('button', { name: /view schema/i })).toBeInTheDocument();
    });

    it('renders a custom trigger label', () => {
      render(<SchemaViewer schema={sampleSchema} triggerLabel="Show JSON" />);

      expect(screen.getByRole('button', { name: /show json/i })).toBeInTheDocument();
    });

    it('does not show the schema JSON until opened', () => {
      render(<SchemaViewer schema={sampleSchema} />);

      expect(screen.queryByText('Schema JSON')).not.toBeInTheDocument();
    });
  });

  describe('opening the sheet', () => {
    it('shows the schema JSON with sections and fields visible', async () => {
      const user = userEvent.setup();
      render(<SchemaViewer schema={sampleSchema} />);

      await user.click(screen.getByRole('button', { name: /view schema/i }));

      expect(await screen.findByText('Schema JSON')).toBeInTheDocument();
      expect(screen.getByText('JSON representation of the form schema.')).toBeInTheDocument();

      const json = getRenderedJson();
      // Sections
      expect(json).toContain('"personal-info"');
      expect(json).toContain('"preferences"');
      // Fields
      expect(json).toContain('"fullName"');
      expect(json).toContain('"email"');
      expect(json).toContain('"role"');
      // Options
      expect(json).toContain('"Developer"');
    });

    it('renders the exact serializer output', async () => {
      const user = userEvent.setup();
      render(<SchemaViewer schema={sampleSchema} />);

      await user.click(screen.getByRole('button', { name: /view schema/i }));
      await screen.findByText('Schema JSON');

      expect(getRenderedJson()).toBe(schemaToJson(sampleSchema));
    });
  });

  describe('copy to clipboard', () => {
    it('copies the schema JSON and shows copied feedback', async () => {
      const user = userEvent.setup();
      render(<SchemaViewer schema={sampleSchema} />);

      await user.click(screen.getByRole('button', { name: /view schema/i }));
      await screen.findByText('Schema JSON');

      const writeText = vi.spyOn(navigator.clipboard, 'writeText');
      await user.click(screen.getByRole('button', { name: /copy/i }));

      expect(writeText).toHaveBeenCalledWith(schemaToJson(sampleSchema));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
      });
    });
  });

  describe('wrappers', () => {
    it('FormWithSchemaViewer renders children alongside the trigger', () => {
      render(
        <FormWithSchemaViewer schema={sampleSchema}>
          <div>Wrapped form content</div>
        </FormWithSchemaViewer>
      );

      expect(screen.getByText('Wrapped form content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view schema/i })).toBeInTheDocument();
    });

    it('withSchemaViewer wraps a component and passes props through', () => {
      const Inner = ({ schema, note }: { schema: FormSchema; note: string }) => (
        <div>
          {schema.title}: {note}
        </div>
      );
      const Wrapped = withSchemaViewer(Inner);

      render(<Wrapped schema={sampleSchema} note="hello" />);

      expect(screen.getByText('Sample Form: hello')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view schema/i })).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has no accessibility violations when closed', async () => {
      const { container } = render(<SchemaViewer schema={sampleSchema} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations when open', async () => {
      const user = userEvent.setup();
      render(<SchemaViewer schema={sampleSchema} />);

      await user.click(screen.getByRole('button', { name: /view schema/i }));
      await screen.findByText('Schema JSON');

      // The sheet renders in a portal, so run axe against the document body.
      const results = await axe(document.body);
      expect(results).toHaveNoViolations();
    });
  });
});
