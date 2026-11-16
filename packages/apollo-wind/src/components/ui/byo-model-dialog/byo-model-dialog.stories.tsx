import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ByoModelDialog } from './byo-model-dialog';
import type { ByoConnection, ByoModelDialogApi } from './types';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A stand-in for the host's API. Any key containing "wrong" is refused the way
 * Integration Service passes on a vendor's refusal, and "bad-model" fails the
 * test call.
 */
function storyApi(): ByoModelDialogApi {
  const connections: ByoConnection[] = [
    { id: 'conn-openai', providerId: 'openai', name: 'OpenAI personal', folderId: 'me' },
  ];
  return {
    loadContext: async () => {
      await wait(300);
      return {
        ok: true,
        value: {
          providers: [
            { id: 'openai', name: 'OpenAI' },
            { id: 'azure-openai', name: 'Azure OpenAI' },
          ],
          connections,
          folders: [
            { id: 'me', label: 'My Workspace' },
            { id: 'shared', label: 'Shared › Finance' },
          ],
          defaultFolderId: 'me',
          takenModelNames: ['gpt-4.1'],
        },
      };
    },
    loadForm: async (providerId) => {
      await wait(300);
      return {
        ok: true,
        value:
          providerId === 'azure-openai'
            ? {
                authTypes: [
                  { value: 'customApiKey', label: 'API key' },
                  { value: 'oauth2ClientCredentials', label: 'Client credentials (Entra app)' },
                ],
                defaultAuthType: 'customApiKey',
                fields: [
                  {
                    key: 'url',
                    label: 'Endpoint',
                    secret: false,
                    required: true,
                    advanced: false,
                    group: null,
                    defaultValue: '',
                    placeholder: 'https://<resource>.openai.azure.com',
                    hint: '',
                  },
                  {
                    key: 'api-key',
                    label: 'API key',
                    secret: true,
                    required: true,
                    advanced: false,
                    group: 'customApiKey',
                    defaultValue: '',
                    placeholder: '',
                    hint: 'Key 1 or Key 2 from the Azure portal.',
                  },
                  {
                    key: 'tenantID',
                    label: 'Tenant ID',
                    secret: false,
                    required: true,
                    advanced: false,
                    group: 'oauth2ClientCredentials',
                    defaultValue: '',
                    placeholder: '',
                    hint: '',
                  },
                  {
                    key: 'clientId',
                    label: 'Client ID',
                    secret: false,
                    required: true,
                    advanced: false,
                    group: 'oauth2ClientCredentials',
                    defaultValue: '',
                    placeholder: '',
                    hint: '',
                  },
                  {
                    key: 'clientSecret',
                    label: 'Client secret',
                    secret: true,
                    required: true,
                    advanced: false,
                    group: 'oauth2ClientCredentials',
                    defaultValue: '',
                    placeholder: '',
                    hint: '',
                  },
                  {
                    key: 'apiVersion',
                    label: 'API version',
                    secret: false,
                    required: false,
                    advanced: true,
                    group: null,
                    defaultValue: '2023-10-01-preview',
                    placeholder: '',
                    hint: '',
                  },
                ],
              }
            : {
                authTypes: [],
                defaultAuthType: null,
                fields: [
                  {
                    key: 'Authorization',
                    label: 'API key',
                    secret: true,
                    required: true,
                    advanced: false,
                    group: null,
                    defaultValue: '',
                    placeholder: 'sk-…',
                    hint: '',
                  },
                  {
                    key: 'organization',
                    label: 'Organization ID',
                    secret: false,
                    required: false,
                    advanced: true,
                    group: null,
                    defaultValue: '',
                    placeholder: '',
                    hint: '',
                  },
                ],
              },
      };
    },
    connect: async ({ providerId, values, name, folderId }) => {
      await wait(900);
      if (Object.values(values).some((v) => v.includes('wrong'))) {
        return {
          ok: false,
          failure: {
            title: 'OpenAI refused the connection (HTTP 401)',
            message: 'Incorrect API key provided.',
            detail: JSON.stringify(
              {
                message: 'Unauthorized',
                providerMessage: 'GET /models|401|Incorrect API key provided.',
              },
              null,
              2
            ),
          },
        };
      }
      const connection = { id: `conn-${Date.now()}`, providerId, name, folderId };
      connections.push(connection);
      return { ok: true, value: connection };
    },
    listModels: async (providerId) => {
      await wait(500);
      return {
        ok: true,
        value:
          providerId === 'azure-openai'
            ? { compatible: [], incompatible: [] }
            : {
                compatible: [
                  { id: 'gpt-5.1' },
                  { id: 'gpt-4.1' },
                  { id: 'gpt-4o' },
                  { id: 'bad-model' },
                ],
                incompatible: [
                  {
                    id: 'text-embedding-3-large',
                    short: 'Embedding model',
                    reason: 'Embedding model: not a chat model.',
                  },
                  {
                    id: 'whisper-1',
                    short: 'Audio model',
                    reason: 'Audio model: not a chat model.',
                  },
                ],
              },
      };
    },
    testAndAdd: async ({ connection, modelId, name }) => {
      await wait(1200);
      if (modelId === 'bad-model') {
        return {
          ok: false,
          failure: {
            title: 'The test call failed: MISSING_TOOL_CALL',
            message: 'The model answered without calling the tool.',
          },
        };
      }
      return {
        ok: true,
        value: {
          name,
          modelId,
          connectionId: connection.id,
          folderId: connection.folderId,
          latencyMs: 1180,
        },
      };
    },
  };
}

const meta = {
  title: 'Components/UiPath/BYO Model Dialog',
  component: ByoModelDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The "Use your own model" dialog. The user picks a provider, reuses a saved connection or creates one from the provider\'s credentials, picks a model, names it, then tests and adds it. The dialog makes no platform calls of its own: every step goes through the `api` prop.',
      },
    },
  },
  args: { open: false, onOpenChange: () => {}, api: storyApi(), onAdded: () => {} },
} satisfies Meta<typeof ByoModelDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    const [added, setAdded] = React.useState<string | null>(null);
    const api = React.useMemo(storyApi, []);
    return (
      <div className="flex flex-col items-center gap-3">
        <Button onClick={() => setOpen(true)}>Use custom model</Button>
        {added && <p className="text-sm text-foreground-muted">Added {added}</p>}
        <ByoModelDialog
          open={open}
          onOpenChange={setOpen}
          api={api}
          onAdded={(m) => setAdded(m.name)}
        />
      </div>
    );
  },
};
