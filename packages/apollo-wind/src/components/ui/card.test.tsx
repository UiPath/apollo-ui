import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './card';

describe('Card', () => {
  it('renders card with all parts', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
