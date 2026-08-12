import { render, screen } from '../../utils/testing';
import { NodePropertyPanelLayout } from './NodePropertyPanelLayout';

describe('NodePropertyPanelLayout', () => {
  it('renders three coordinated panels and forwards its class name', () => {
    const { container } = render(
      <NodePropertyPanelLayout
        className="custom-layout"
        input={<div>Input panel</div>}
        properties={<div>Properties panel</div>}
        output={<div>Output panel</div>}
      />
    );

    const panelGroup = container.firstElementChild;

    expect(panelGroup).toHaveClass('custom-layout');
    expect(panelGroup?.querySelectorAll(':scope > :not([role="separator"])')).toHaveLength(3);
    expect(screen.getAllByRole('separator')).toHaveLength(2);
    expect(screen.getByText('Input panel')).toBeInTheDocument();
    expect(screen.getByText('Properties panel')).toBeInTheDocument();
    expect(screen.getByText('Output panel')).toBeInTheDocument();
  });
});
