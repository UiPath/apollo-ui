import React from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.(QUERY).matches
  );

  React.useEffect(() => {
    const media = window.matchMedia?.(QUERY);

    if (!media) {
      return;
    }

    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);

    return () => media.removeEventListener('change', update);
  }, []);

  return reduced;
}
