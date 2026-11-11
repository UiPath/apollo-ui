import type * as Monaco from 'monaco-editor';
import { useEffect, useState } from 'react';

export type MonacoApi = typeof Monaco;

/**
 * Hands the viewer the host's Monaco. The host owns how Monaco is bundled and where its workers
 * come from: `() => import('monaco-editor')` in a Vite app, the AMD loader in Orchestrator.
 */
export type LoadMonaco = () => Promise<MonacoApi>;

export type MonacoState =
  | { kind: 'loading' }
  | { kind: 'ready'; monaco: MonacoApi }
  | { kind: 'failed' };

const loads = new WeakMap<LoadMonaco, Promise<MonacoApi>>();

/** One load per loader, shared by every editor on the page. A failed load is forgotten, so a later mount retries. */
function loadOnce(load: LoadMonaco): Promise<MonacoApi> {
  const pending = loads.get(load) ?? load();
  loads.set(load, pending);
  pending.catch(() => loads.delete(load));
  return pending;
}

export function useMonaco(load: LoadMonaco): MonacoState {
  const [state, setState] = useState<MonacoState>({ kind: 'loading' });

  useEffect(() => {
    let isCurrent = true;
    loadOnce(load).then(
      (monaco) => isCurrent && setState({ kind: 'ready', monaco }),
      () => isCurrent && setState({ kind: 'failed' })
    );
    return () => {
      isCurrent = false;
    };
  }, [load]);

  return state;
}
