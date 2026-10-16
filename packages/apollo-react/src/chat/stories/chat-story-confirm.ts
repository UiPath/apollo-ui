/**
 * A host's own confirmation, as a pre-hook might show one: a native `<dialog>` on the page's
 * body, outside the chat, resolving with the choice.
 */
export function confirmWithHostDialog(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.dataset.storyConfirm = '';
    dialog.style.cssText =
      'padding: 16px; border: 1px solid #888; border-radius: 8px; font: 14px sans-serif; background: #fff; color: #111;';
    const text = document.createElement('p');
    text.textContent = message;
    text.style.margin = '0 0 12px';
    const actions = document.createElement('div');
    actions.style.cssText = 'display: flex; gap: 8px; justify-content: flex-end;';

    const finish = (proceed: boolean) => {
      dialog.close();
      dialog.remove();
      resolve(proceed);
    };
    for (const [label, proceed] of [
      ['Cancel', false],
      ['Continue', true],
    ] as const) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', () => finish(proceed));
      actions.append(button);
    }
    // Escape cancels.
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      finish(false);
    });

    dialog.append(text, actions);
    document.body.append(dialog);
    dialog.showModal();
  });
}
