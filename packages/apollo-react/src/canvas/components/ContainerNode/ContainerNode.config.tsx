import type { ReactNode } from 'react';
import type { NodeContainerDisplayManifest } from '../../schema/node-definition';
import { ContainerBadge } from './ContainerBadge';
import type {
  ContainerAccent,
  ContainerBodyFrame,
  ContainerBorderStyle,
  ContainerNodeConfig,
  ContainerRadius,
} from './ContainerNode.types';

export const DEFAULT_CONTAINER_KIND = 'container';

export interface ResolvedContainerNodeConfig {
  kind: string;
  headerBadges: ReactNode | null;
  headerEnd: ReactNode;
  subtitle: ReactNode;
  emptyStateLabel?: string;
  bodyFrame: ContainerBodyFrame;
  borderStyle: ContainerBorderStyle;
  accent: ContainerAccent;
  radius: ContainerRadius;
  labelEditable: boolean;
}

type ContainerConfigInput = Pick<
  ContainerNodeConfig,
  | 'kind'
  | 'headerBadges'
  | 'headerEnd'
  | 'subtitle'
  | 'emptyStateLabel'
  | 'bodyFrame'
  | 'appearance'
  | 'labelEditable'
  | 'defaults'
>;

function resolveManifestBadge(badge: NodeContainerDisplayManifest['badge']): ReactNode | null {
  if (badge === undefined) return undefined;
  if (badge === false) return null;
  return <ContainerBadge>{badge}</ContainerBadge>;
}

/**
 * Resolves container presentation. Props win over `display.container` from the
 * manifest, which wins over the preset `defaults`. The subtitle also takes the
 * node's own `display.subLabel` (written by inline editing) ahead of the manifest.
 */
export function resolveContainerNodeConfig(
  props: ContainerConfigInput,
  manifestContainer: NodeContainerDisplayManifest | undefined,
  instanceSubLabel?: string
): ResolvedContainerNodeConfig {
  const defaults = props.defaults ?? {};
  const manifest = manifestContainer ?? {};
  const manifestBadge = resolveManifestBadge(manifest.badge);

  return {
    kind: props.kind ?? manifest.kind ?? defaults.kind ?? DEFAULT_CONTAINER_KIND,
    headerBadges:
      props.headerBadges !== undefined
        ? props.headerBadges
        : manifestBadge !== undefined
          ? manifestBadge
          : (defaults.headerBadges ?? null),
    headerEnd: props.headerEnd ?? defaults.headerEnd,
    subtitle:
      props.subtitle ?? (instanceSubLabel || undefined) ?? manifest.subtitle ?? defaults.subtitle,
    emptyStateLabel: props.emptyStateLabel ?? manifest.emptyStateLabel ?? defaults.emptyStateLabel,
    bodyFrame: props.bodyFrame ?? manifest.bodyFrame ?? defaults.bodyFrame ?? 'dashed',
    borderStyle:
      props.appearance?.borderStyle ??
      manifest.borderStyle ??
      defaults.appearance?.borderStyle ??
      'solid',
    accent: props.appearance?.accent ?? manifest.accent ?? defaults.appearance?.accent ?? 'default',
    radius: props.appearance?.radius ?? manifest.radius ?? defaults.appearance?.radius ?? 'default',
    labelEditable: props.labelEditable ?? manifest.labelEditable ?? defaults.labelEditable ?? false,
  };
}
