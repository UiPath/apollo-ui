'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Children, Suspense, type ReactNode } from 'react';

interface LinkedTabsProps {
  items: string[];
  children: ReactNode;
  /** URL search param key — defaults to "pkg" */
  paramName?: string;
}

function LinkedTabsInner({ items, children, paramName = 'pkg' }: LinkedTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeId = searchParams.get(paramName) ?? items[0];
  const activeIndex = Math.max(0, items.indexOf(activeId));

  const panels = Children.toArray(children);

  function setTab(item: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, item);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="linked-tabs">
      <div className="linked-tabs__bar">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`linked-tabs__btn${activeId === item ? ' linked-tabs__btn--active' : ''}`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="linked-tabs__panel">
        {panels[activeIndex]}
      </div>
    </div>
  );
}

export function LinkedTabs(props: LinkedTabsProps) {
  return (
    <Suspense>
      <LinkedTabsInner {...props} />
    </Suspense>
  );
}
