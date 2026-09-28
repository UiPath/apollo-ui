import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../utils/testing';
import { AddNodePanelEmptyMessage } from './AddNodePanelEmptyMessage';

describe('AddNodePanelEmptyMessage', () => {
  it('renders message content without an action when no action label is provided', () => {
    render(<AddNodePanelEmptyMessage icon="hourglass" message="Availability is still pending." />);

    expect(screen.getByRole('status')).toHaveTextContent('Availability is still pending.');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a button action when actionLabel is provided without actionHref', () => {
    const onAction = vi.fn();

    render(
      <AddNodePanelEmptyMessage
        icon="wifi-off"
        message="Availability could not be checked."
        actionLabel="Try again"
        onAction={onAction}
      />
    );

    const button = screen.getByRole('button', { name: 'Try again' });
    button.click();

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders a link action when actionLabel and actionHref are provided', () => {
    render(
      <AddNodePanelEmptyMessage
        icon="circle-alert"
        message="The service is not enabled."
        actionLabel="Open tenant services"
        actionHref="#tenant-services"
      />
    );

    expect(screen.getByRole('link', { name: 'Open tenant services' })).toHaveAttribute(
      'href',
      '#tenant-services'
    );
  });
});
