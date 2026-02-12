import React from 'react';
import type { AutopilotChatResourceItem } from '../../../service';
import { ResourceChipBase } from '../../input/tiptap/resource-chip-node-view';

export const ResourceChip = React.memo(({ icon, displayName }: AutopilotChatResourceItem) => (
  <ResourceChipBase label={displayName} icon={icon} readonly />
));
ResourceChip.displayName = 'ResourceChip';
