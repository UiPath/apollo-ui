// React wrapper for ap-data-grid web component
import React, { useEffect, useRef } from 'react';
import '../index'; // Import web component

interface ApDataGridProps {
  data?: unknown[];
  columns?: unknown[];
  onRowClick?: (row: unknown) => void;
}

export const ApDataGrid: React.FC<ApDataGridProps> = ({ data, columns, onRowClick }) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Set properties on the web component
    if (data) {
      (element as any).data = data;
    }
    if (columns) {
      (element as any).columns = columns;
    }

    // Handle events
    const handleRowClick = (event: Event) => {
      if (onRowClick) {
        onRowClick((event as CustomEvent).detail);
      }
    };

    element.addEventListener('rowclick', handleRowClick);

    return () => {
      element.removeEventListener('rowclick', handleRowClick);
    };
  }, [data, columns, onRowClick]);

  return React.createElement('ap-data-grid', { ref: elementRef });
};
