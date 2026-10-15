import type { AutopilotChatResourceItem } from '../../service';
import { ServiceIcon } from '../common/service-icon';

/** A `resource-chip` node from `resourceTokenPlugin`: the resource's icon and name, inline. */
export function MarkdownResourceChip({ icon, displayName }: AutopilotChatResourceItem) {
  return (
    <span
      data-slot="wind-chat-resource-chip"
      title={displayName}
      className="mx-0.5 inline-flex max-w-60 items-center gap-1 rounded-md bg-surface-overlay px-1.5 align-bottom text-[0.875em] font-medium [&_svg]:size-3.5 [&_svg]:shrink-0"
    >
      <ServiceIcon icon={icon} />
      <span className="truncate">{displayName}</span>
    </span>
  );
}
