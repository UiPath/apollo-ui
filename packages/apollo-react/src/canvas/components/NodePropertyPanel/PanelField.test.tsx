import { Input } from '@uipath/apollo-wind';
import { render, screen } from '../../utils/testing';
import { PanelField, PanelFieldLabel } from './PanelField';

describe('PanelField', () => {
  it('labels a panel control and renders supporting text', () => {
    render(
      <PanelField htmlFor="endpoint" label="Endpoint" description="The URL to call.">
        <Input id="endpoint" />
      </PanelField>
    );

    expect(screen.getByLabelText('Endpoint')).toHaveAttribute(
      'aria-describedby',
      'endpoint-description'
    );
    expect(screen.getByText('The URL to call.')).toBeInTheDocument();
  });

  it('renders required and error states without changing the control', () => {
    render(
      <PanelField htmlFor="name" label="Name" required error="Name is required.">
        <Input id="name" />
      </PanelField>
    );

    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Name is required.')).toHaveAttribute('id', 'name-error');
  });

  it('provides the same label treatment to controls that own their layout', () => {
    render(
      <PanelFieldLabel htmlFor="expression" required>
        Expression
      </PanelFieldLabel>
    );

    expect(screen.getByText('Expression')).toHaveAttribute('for', 'expression');
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
