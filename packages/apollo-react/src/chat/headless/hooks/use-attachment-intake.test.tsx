import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ApI18nProvider } from '../../../i18n';
import { type AutopilotChatConfiguration, AutopilotChatService } from '../../service';
import { AutopilotAttachmentsProvider, useAttachments } from '../providers/attachments-provider';
import { AutopilotChatServiceProvider } from '../providers/chat-service.provider';
import { AutopilotChatStateProvider } from '../providers/chat-state-provider';
import { AutopilotErrorProvider, useError } from '../providers/error-provider';
import {
  type ChatAttachmentRejection,
  checkAttachmentFiles,
  getAcceptedFileTypes,
  useAttachmentIntake,
} from './use-attachment-intake';

let instanceCounter = 0;
let take: ReturnType<typeof useAttachmentIntake> | undefined;
let state: { names: string[]; error?: string } = { names: [] };

function Probe() {
  take = useAttachmentIntake();
  const { attachments } = useAttachments();
  const { error } = useError();
  state = { names: attachments.map(({ name }) => name), error: error?.message };
  return null;
}

function setup(allowedAttachments: AutopilotChatConfiguration['allowedAttachments']) {
  const service = AutopilotChatService.Instantiate({
    instanceName: `intake-${++instanceCounter}`,
    config: { allowedAttachments },
  });
  render(
    <AutopilotChatServiceProvider chatServiceInstance={service}>
      <ApI18nProvider component="chat">
        <AutopilotChatStateProvider>
          <AutopilotErrorProvider>
            <AutopilotAttachmentsProvider>
              <Probe />
            </AutopilotAttachmentsProvider>
          </AutopilotErrorProvider>
        </AutopilotChatStateProvider>
      </ApI18nProvider>
    </AutopilotChatServiceProvider>
  );
}

const file = (name: string, size = 10) =>
  new File(['x'.repeat(size)], name, { type: 'text/plain', lastModified: 1 });
const reject = (name: string, reason: ChatAttachmentRejection['reason']) => ({
  file: file(name),
  reason,
});
const types = { 'text/plain': ['.txt'] };

describe('useAttachmentIntake', () => {
  it('accepts every MIME type and extension of the allowed types', () => {
    expect(getAcceptedFileTypes({ 'text/plain': ['.txt'], 'image/png': ['.png'] })).toEqual([
      'text/plain',
      'image/png',
      '.txt',
      '.png',
    ]);
  });

  it('checks picked files by MIME type or extension, size, then the count left', () => {
    const allowed = { multiple: true, types, maxSize: 15, maxCount: 3 };
    const picked = [
      new File(['x'], 'a.TXT', { type: '' }),
      new File(['x'], 'b.bin', { type: 'text/plain' }),
      new File(['x'], 'c.exe', { type: 'application/x-msdownload' }),
      new File(['x'.repeat(20)], 'd.txt', { type: 'text/plain' }),
      new File(['x'], 'e.txt', { type: 'text/plain' }),
    ];

    const { accepted, rejected } = checkAttachmentFiles(picked, allowed, 1);

    expect(accepted.map(({ name }) => name)).toEqual(['a.TXT', 'b.bin']);
    expect(rejected.map(({ file, reason }) => [file.name, reason])).toEqual([
      ['c.exe', 'type'],
      ['d.txt', 'size'],
      ['e.txt', 'count'],
    ]);
  });

  it('attaches accepted files and names the rejected ones', async () => {
    setup({ multiple: true, types, maxSize: 1024, maxCount: 5 });

    await act(() => take?.([file('a.txt')], [reject('big.txt', 'size'), reject('x.exe', 'type')]));

    expect(state.names).toEqual(['a.txt']);
    expect(state.error).toMatch(/big\.txt/);
    expect(state.error).toMatch(/x\.exe/);
  });

  it('rejects the whole batch when there are too many files', async () => {
    setup({ multiple: true, types, maxSize: 1024, maxCount: 1 });

    await act(() => take?.([file('a.txt')], [reject('b.txt', 'count')]));

    expect(state.names).toEqual([]);
    expect(state.error).toBeTruthy();
  });

  it('allows one file at a time when multiple is off', async () => {
    setup({ multiple: false, types, maxSize: 1024 });

    await act(() => take?.([file('a.txt'), file('b.txt')], []));
    expect(state.names).toEqual([]);
    expect(state.error).toBeTruthy();

    await act(() => take?.([file('a.txt')], []));
    expect(state.names).toEqual(['a.txt']);
    expect(state.error).toBeUndefined();
  });
});
