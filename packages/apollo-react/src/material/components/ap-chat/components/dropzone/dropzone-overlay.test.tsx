import { fireEvent, render, screen } from '@testing-library/react';
import { ApChat } from '@uipath/apollo-react/ap-chat';
import { AutopilotChatMode, AutopilotChatService } from '@uipath/apollo-react/chat/service';
import { describe, expect, it } from 'vitest';

let instanceCounter = 0;

async function dragOver(maxCount: number) {
  const service = AutopilotChatService.Instantiate({
    instanceName: `material-dropzone-${++instanceCounter}`,
    config: {
      mode: AutopilotChatMode.FullScreen,
      allowedAttachments: {
        multiple: true,
        types: { 'text/plain': ['.txt'] },
        maxSize: 1024 * 1024,
        maxCount,
      },
    },
  });
  const { unmount } = render(<ApChat chatServiceInstance={service} />);
  await screen.findByRole('button', { name: /Attach file/ }, { timeout: 25_000 });
  const root = document.querySelector('input[type="file"][style*="display: none"]')
    ?.parentElement as HTMLElement;
  const item = new File(['x'], 'a.txt', { type: 'text/plain' });
  fireEvent.dragEnter(root, {
    dataTransfer: {
      types: ['Files'],
      files: [item],
      items: [{ kind: 'file', type: item.type, getAsFile: () => item }],
    },
  });
  const hint = await screen.findByText('Drop your files here to add them to your prompt');
  const lines = [...(hint.parentElement as HTMLElement).childNodes].map((node) => node.textContent);
  unmount();
  return lines;
}

describe('Material drop overlay', () => {
  it('lists the limits, with no count line and no stray 0 when maxCount is 0', async () => {
    expect(await dragOver(4)).toEqual([
      'Drop your files here to add them to your prompt',
      'Maximum files allowed: 4',
      'Maximum file size: 1MB',
      'Allowed file types: .txt',
    ]);
    expect(await dragOver(0)).toEqual([
      'Drop your files here to add them to your prompt',
      'Maximum file size: 1MB',
      'Allowed file types: .txt',
    ]);
  }, 40_000);
});
