import type { Meta, StoryObj } from '@storybook/react-vite';

import { FormDesigner } from './form-designer';

const meta: Meta<typeof FormDesigner> = {
  title: 'Forms/Designer',
  component: FormDesigner,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Builds a \`FormSchema\` interactively: sections, fields, validation, options, data sources and rules, with a live
\`MetadataForm\` preview and the schema JSON beside it.

For the field types fitted to the field anatomy, **Value modes and actions** sets \`valueModes\` (the modes a value can
take, the default one, and whether users can switch), \`headerActions\`, \`menuActions\` and \`badge\`. The preview
supplies variables and the Insert variable and AI assist actions, as a host would through a plugin.

**Rules & conditions** edits a field's rules in a \`RulesEditor\`, stored as RulesEngine \`FieldRule\`s through
\`useFieldRules\`. Renaming a field renames it in every rule that names it. Removing one keeps its rules, flagged in
the editor and marked in the field list, so the author decides what they should compare instead.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormDesigner>;

export const Default: Story = {};
