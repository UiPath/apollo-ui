import type { MouseEventHandler } from 'react';
import { CanvasIcon } from '../../utils';

interface AddNodePanelEmptyMessageBaseProps {
  icon: string;
  message: string;
}

type AddNodePanelEmptyMessageNoActionProps = {
  actionLabel?: never;
  actionHref?: never;
  onAction?: never;
};

type AddNodePanelEmptyMessageLinkActionProps = {
  actionLabel: string;
  actionHref: string;
  onAction?: MouseEventHandler<HTMLAnchorElement>;
};

type AddNodePanelEmptyMessageButtonActionProps = {
  actionLabel: string;
  actionHref?: never;
  onAction: MouseEventHandler<HTMLButtonElement>;
};

export type AddNodePanelEmptyMessageProps = AddNodePanelEmptyMessageBaseProps &
  (
    | AddNodePanelEmptyMessageNoActionProps
    | AddNodePanelEmptyMessageLinkActionProps
    | AddNodePanelEmptyMessageButtonActionProps
  );

function hasButtonAction(
  props: AddNodePanelEmptyMessageProps
): props is AddNodePanelEmptyMessageBaseProps & AddNodePanelEmptyMessageButtonActionProps {
  return Boolean(props.actionLabel && !props.actionHref && props.onAction);
}

export function AddNodePanelEmptyMessage(props: AddNodePanelEmptyMessageProps) {
  const { icon, message } = props;
  const actionClassName =
    'rounded-md border border-solid px-3 py-1.5 text-xs font-medium no-underline';
  const actionStyle = {
    borderColor: 'var(--canvas-border)',
    color: 'var(--canvas-foreground-emp)',
    backgroundColor: 'var(--canvas-background)',
  };

  return (
    <output
      className="flex min-h-[250px] flex-1 flex-col items-center justify-center gap-4 px-6 py-8 text-center"
      aria-live="polite"
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{
          backgroundColor: 'var(--canvas-background-hover)',
          color: 'var(--canvas-foreground-de-emp)',
        }}
      >
        <CanvasIcon icon={icon} size={22} />
      </div>
      <p className="m-0 max-w-[240px] text-sm leading-5 text-foreground-muted">{message}</p>
      {props.actionLabel && props.actionHref && (
        <a
          href={props.actionHref}
          className={actionClassName}
          style={actionStyle}
          onClick={props.onAction}
        >
          {props.actionLabel}
        </a>
      )}
      {hasButtonAction(props) && (
        <button
          type="button"
          className={actionClassName}
          style={actionStyle}
          onClick={props.onAction}
        >
          {props.actionLabel}
        </button>
      )}
    </output>
  );
}
