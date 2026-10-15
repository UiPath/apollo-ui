import React from 'react';

/**
 * Where Wind's modal dialogs portal: a node carrying the chat's theme class, in the host's
 * `portalContainer` or else `document.body`, so a modal covers the page like Material's instead of
 * sitting in the chat root's stacking context. Menus, tooltips and hover cards stay in the root.
 */
export const DialogContainerContext = React.createContext<HTMLElement | null>(null);

export const useDialogContainer = () => React.useContext(DialogContainerContext);
