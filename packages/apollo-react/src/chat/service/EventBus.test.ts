import { describe, expect, it, vi } from 'vitest';

import { EventBus } from './EventBus';

describe('EventBus', () => {
  describe('subscribe', () => {
    it('delivers published data to every handler of the event', async () => {
      const bus = new EventBus();
      const first = vi.fn();
      const second = vi.fn();
      bus.subscribe('ping', first);
      bus.subscribe('ping', second);

      await bus.publish('ping', { n: 1 });

      expect(first).toHaveBeenCalledWith({ n: 1 });
      expect(second).toHaveBeenCalledWith({ n: 1 });
    });

    it('does not deliver other events', async () => {
      const bus = new EventBus();
      const handler = vi.fn();
      bus.subscribe('ping', handler);

      await bus.publish('pong');

      expect(handler).not.toHaveBeenCalled();
    });

    it('stops delivering after the returned unsubscribe runs', async () => {
      const bus = new EventBus();
      const kept = vi.fn();
      const removed = vi.fn();
      bus.subscribe('ping', kept);
      const unsubscribe = bus.subscribe('ping', removed);

      unsubscribe();
      await bus.publish('ping');

      expect(removed).not.toHaveBeenCalled();
      expect(kept).toHaveBeenCalledTimes(1);
    });

    it('treats a repeated unsubscribe as a no-op', async () => {
      const bus = new EventBus();
      const handler = vi.fn();
      const other = vi.fn();
      const unsubscribe = bus.subscribe('ping', handler);
      bus.subscribe('ping', other);

      unsubscribe();
      unsubscribe();
      await bus.publish('ping');

      expect(other).toHaveBeenCalledTimes(1);
    });
  });

  describe('intercept', () => {
    it('runs interceptors with the payload before handlers', async () => {
      const bus = new EventBus();
      const order: string[] = [];
      bus.intercept('request', async (data) => {
        order.push(`interceptor:${(data as { id: string }).id}`);
        return false;
      });
      bus.subscribe('request', () => order.push('handler'));

      await bus.publish('request', { id: 'a' });

      expect(order).toEqual(['interceptor:a', 'handler']);
    });

    it('passes the original payload when no interceptor hijacks', async () => {
      const bus = new EventBus();
      const handler = vi.fn();
      bus.intercept('request', () => false);
      bus.subscribe('request', handler);

      await bus.publish('request', { id: 'a' });

      expect(handler).toHaveBeenCalledWith({ id: 'a' });
    });

    it('marks the payload as hijacked when any interceptor returns true', async () => {
      const bus = new EventBus();
      const handler = vi.fn();
      bus.intercept('request', () => false);
      bus.intercept('request', async () => true);
      bus.subscribe('request', handler);

      await bus.publish('request', { id: 'a' });

      expect(handler).toHaveBeenCalledWith({ id: 'a', hijacked: true });
    });

    it('stops intercepting after the returned remover runs', async () => {
      const bus = new EventBus();
      const handler = vi.fn();
      const remove = bus.intercept('request', () => true);
      bus.subscribe('request', handler);

      remove();
      await bus.publish('request', { id: 'a' });

      expect(handler).toHaveBeenCalledWith({ id: 'a' });
    });
  });

  describe('clear', () => {
    it('removes handlers and interceptors for one event', async () => {
      const bus = new EventBus();
      const cleared = vi.fn();
      const kept = vi.fn();
      const interceptor = vi.fn(() => true);
      bus.subscribe('ping', cleared);
      bus.intercept('ping', interceptor);
      bus.subscribe('pong', kept);

      bus.clear('ping');
      await bus.publish('ping');
      await bus.publish('pong');

      expect(cleared).not.toHaveBeenCalled();
      expect(interceptor).not.toHaveBeenCalled();
      expect(kept).toHaveBeenCalledTimes(1);
    });

    it('removes everything when called without an event', async () => {
      const bus = new EventBus();
      const ping = vi.fn();
      const pong = vi.fn();
      bus.subscribe('ping', ping);
      bus.subscribe('pong', pong);

      bus.clear();
      await bus.publish('ping');
      await bus.publish('pong');

      expect(ping).not.toHaveBeenCalled();
      expect(pong).not.toHaveBeenCalled();
    });
  });
});
