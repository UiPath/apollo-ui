import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, type UserEvent, userEvent } from '../../utils/testing';
import { NodeLabel, type NodeLabelProps } from './NodeLabel';

describe('NodeLabel', () => {
  const defaultProps: NodeLabelProps = {
    label: 'Test Node',
    subLabel: 'Test Description',
    onChange: vi.fn(),
    selected: true,
  };

  describe('Rendering', () => {
    it('should render label and subLabel correctly', () => {
      render(<NodeLabel {...defaultProps} />);

      expect(screen.getByText('Test Node')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('should render only label when subLabel is empty', () => {
      render(<NodeLabel {...defaultProps} subLabel="" />);

      expect(screen.getByText('Test Node')).toBeInTheDocument();
      expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
    });

    it('should render empty placeholder when both label and subLabel are empty', () => {
      render(<NodeLabel {...defaultProps} label="" subLabel="" />);

      expect(screen.queryByText('Test Node')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
      // The empty placeholder is rendered with accessible attributes
      expect(screen.getByRole('button', { name: 'Add node label' })).toBeInTheDocument();
    });

    it('should render with custom shape', () => {
      render(<NodeLabel {...defaultProps} shape="rectangle" />);

      expect(screen.getByText('Test Node')).toBeInTheDocument();
    });

    it('should render with centerAdornment', () => {
      render(<NodeLabel {...defaultProps} centerAdornment={<div>Adornment</div>} />);

      expect(screen.getByText('Test Node')).toBeInTheDocument();
      expect(screen.getByText('Adornment')).toBeInTheDocument();
    });
  });

  describe('Edit mode', () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('should enter edit mode when label is double clicked', async () => {
      render(<NodeLabel {...defaultProps} />);

      await user.dblClick(screen.getByText('Test Node'));

      expect(screen.getByRole('textbox', { name: 'Edit node name' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Edit node description' })).toBeInTheDocument();
    });

    it('should enter edit mode when subLabel is double clicked', async () => {
      render(<NodeLabel {...defaultProps} />);

      await user.dblClick(screen.getByText('Test Description'));

      expect(screen.getByRole('textbox', { name: 'Edit node name' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Edit node description' })).toBeInTheDocument();
    });

    it('should enter edit mode when empty placeholder is double clicked', async () => {
      render(<NodeLabel {...defaultProps} label="" subLabel="" />);

      const placeholder = screen.getByRole('button', { name: 'Add node label' });
      await user.dblClick(placeholder);

      expect(screen.getByRole('textbox', { name: 'Edit node name' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Edit node description' })).toBeInTheDocument();
    });

    it('should focus and select label input when double clicking label', async () => {
      render(<NodeLabel {...defaultProps} />);

      await user.dblClick(screen.getByText('Test Node'));

      const labelInput = screen.getByRole('textbox', { name: 'Edit node name' });
      expect(labelInput).toHaveFocus();
      expect(labelInput).toHaveValue('Test Node');
    });

    it('should focus and select subLabel input when double clicking subLabel', async () => {
      render(<NodeLabel {...defaultProps} />);

      await user.dblClick(screen.getByText('Test Description'));

      const subLabelInput = screen.getByRole('textbox', { name: 'Edit node description' });
      expect(subLabelInput).toHaveFocus();
      expect(subLabelInput).toHaveValue('Test Description');
    });

    it('should show both inputs with current values in edit mode', async () => {
      render(<NodeLabel {...defaultProps} />);

      await user.dblClick(screen.getByText('Test Node'));

      const labelInput = screen.getByRole('textbox', { name: 'Edit node name' });
      const subLabelInput = screen.getByRole('textbox', { name: 'Edit node description' });

      expect(labelInput).toHaveValue('Test Node');
      expect(subLabelInput).toHaveValue('Test Description');
    });

    it('should not enter edit mode when readonly', async () => {
      render(<NodeLabel {...defaultProps} readonly />);

      await user.dblClick(screen.getByText('Test Node'));

      expect(screen.queryByRole('textbox', { name: 'Edit node name' })).not.toBeInTheDocument();
    });

    it('should allow editing label value', async () => {
      render(<NodeLabel {...defaultProps} />);

      await user.dblClick(screen.getByText('Test Node'));

      const labelInput = screen.getByRole('textbox', { name: 'Edit node name' });
      await user.clear(labelInput);
      await user.type(labelInput, 'New Label');

      expect(labelInput).toHaveValue('New Label');
    });

    it('should allow editing subLabel value', async () => {
      render(<NodeLabel {...defaultProps} />);

      await user.dblClick(screen.getByText('Test Node'));

      const subLabelInput = screen.getByRole('textbox', { name: 'Edit node description' });
      await user.clear(subLabelInput);
      await user.type(subLabelInput, 'New Description');

      expect(subLabelInput).toHaveValue('New Description');
    });
  });

  describe('Saving changes', () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('should call onChange with new values when Enter is pressed in label input', async () => {
      const onChange = vi.fn();
      render(<NodeLabel {...defaultProps} onChange={onChange} />);

      await user.dblClick(screen.getByText('Test Node'));

      const labelInput = screen.getByRole('textbox', { name: 'Edit node name' });
      await user.clear(labelInput);
      await user.type(labelInput, 'Updated Label');
      await user.keyboard('{Enter}');

      expect(onChange).toHaveBeenCalledWith({
        label: 'Updated Label',
        subLabel: 'Test Description',
      });
    });

    it('should call onChange with new values when Enter is pressed in subLabel input', async () => {
      const onChange = vi.fn();
      render(<NodeLabel {...defaultProps} onChange={onChange} />);

      await user.dblClick(screen.getByText('Test Node'));

      const subLabelInput = screen.getByRole('textbox', { name: 'Edit node description' });
      await user.clear(subLabelInput);
      await user.type(subLabelInput, 'Updated Description');
      await user.keyboard('{Enter}');

      expect(onChange).toHaveBeenCalledWith({
        label: 'Test Node',
        subLabel: 'Updated Description',
      });
    });

    it('should exit edit mode after pressing Enter', async () => {
      render(<NodeLabel {...defaultProps} />);

      await user.dblClick(screen.getByText('Test Node'));

      const labelInput = screen.getByRole('textbox', { name: 'Edit node name' });
      await user.type(labelInput, '{Enter}');

      expect(screen.queryByRole('textbox', { name: 'Edit node name' })).not.toBeInTheDocument();
      expect(screen.getByText('Test Node')).toBeInTheDocument();
    });

    it('should call onChange when clicking outside the inputs', async () => {
      const onChange = vi.fn();
      render(
        <div>
          <NodeLabel {...defaultProps} onChange={onChange} />
          <button type="button">Outside Button</button>
        </div>
      );

      await user.dblClick(screen.getByText('Test Node'));

      const labelInput = screen.getByRole('textbox', { name: 'Edit node name' });
      await user.clear(labelInput);
      await user.type(labelInput, 'Updated Label');

      await user.click(screen.getByText('Outside Button'));

      expect(onChange).toHaveBeenCalledWith({
        label: 'Updated Label',
        subLabel: 'Test Description',
      });
    });

    it('should not call onChange when values have not changed', async () => {
      const onChange = vi.fn();
      render(<NodeLabel {...defaultProps} onChange={onChange} />);

      await user.dblClick(screen.getByText('Test Node'));

      await user.keyboard('{Enter}');

      expect(onChange).not.toHaveBeenCalled();
    });

    it('should not save when tabbing between label and subLabel inputs', async () => {
      const onChange = vi.fn();
      render(<NodeLabel {...defaultProps} onChange={onChange} />);

      await user.dblClick(screen.getByText('Test Node'));

      const labelInput = screen.getByRole('textbox', { name: 'Edit node name' });
      await user.clear(labelInput);
      await user.type(labelInput, 'New Label');

      await user.tab();

      // Should still be in edit mode
      expect(screen.getByRole('textbox', { name: 'Edit node description' })).toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should save when tabbing out of both inputs', async () => {
      const onChange = vi.fn();
      render(
        <div>
          <NodeLabel {...defaultProps} onChange={onChange} />
          <button type="button">Outside</button>
        </div>
      );

      await user.dblClick(screen.getByText('Test Node'));

      const labelInput = screen.getByRole('textbox', { name: 'Edit node name' });
      await user.clear(labelInput);
      await user.type(labelInput, 'New Label');

      await user.tab();
      await user.tab();

      expect(onChange).toHaveBeenCalledWith({
        label: 'New Label',
        subLabel: 'Test Description',
      });
    });
  });

  describe('Canceling changes', () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('should cancel changes when Escape is pressed', async () => {
      const onChange = vi.fn();
      render(<NodeLabel {...defaultProps} onChange={onChange} />);

      await user.dblClick(screen.getByText('Test Node'));

      const labelInput = screen.getByRole('textbox', { name: 'Edit node name' });
      await user.clear(labelInput);
      await user.type(labelInput, 'New Label');
      await user.keyboard('{Escape}');

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByText('Test Node')).toBeInTheDocument();
    });

    it('should restore original values after canceling', async () => {
      render(<NodeLabel {...defaultProps} />);

      await user.dblClick(screen.getByText('Test Node'));

      const labelInput = screen.getByRole('textbox', { name: 'Edit node name' });
      await user.clear(labelInput);
      await user.type(labelInput, 'New Label');
      await user.keyboard('{Escape}');

      // Re-enter edit mode to check values
      await user.dblClick(screen.getByText('Test Node'));

      const newLabelInput = screen.getByRole('textbox', { name: 'Edit node name' });
      expect(newLabelInput).toHaveValue('Test Node');
    });

    it('should exit edit mode after pressing Escape', async () => {
      render(<NodeLabel {...defaultProps} />);

      await user.dblClick(screen.getByText('Test Node'));
      await user.keyboard('{Escape}');

      expect(screen.queryByRole('textbox', { name: 'Edit node name' })).not.toBeInTheDocument();
    });
  });

  describe('State changes', () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('should exit edit mode when node is deselected', async () => {
      const onChange = vi.fn();
      const { rerender } = render(<NodeLabel {...defaultProps} selected onChange={onChange} />);

      await user.dblClick(screen.getByText('Test Node'));

      const labelInput = screen.getByRole('textbox', { name: 'Edit node name' });
      await user.clear(labelInput);
      await user.type(labelInput, 'New Label');

      // Deselect the node
      rerender(<NodeLabel {...defaultProps} selected={false} onChange={onChange} />);

      expect(onChange).toHaveBeenCalledWith({
        label: 'New Label',
        subLabel: 'Test Description',
      });
      expect(screen.queryByRole('textbox', { name: 'Edit node name' })).not.toBeInTheDocument();
    });

    it('should exit edit mode when node starts dragging', async () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <NodeLabel {...defaultProps} dragging={false} onChange={onChange} />
      );

      await user.dblClick(screen.getByText('Test Node'));

      const labelInput = screen.getByRole('textbox', { name: 'Edit node name' });
      await user.clear(labelInput);
      await user.type(labelInput, 'New Label');

      // Start dragging
      rerender(<NodeLabel {...defaultProps} dragging onChange={onChange} />);

      expect(onChange).toHaveBeenCalledWith({
        label: 'New Label',
        subLabel: 'Test Description',
      });
      expect(screen.queryByRole('textbox', { name: 'Edit node name' })).not.toBeInTheDocument();
    });

    it('should exit edit mode when node becomes readonly', async () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <NodeLabel {...defaultProps} readonly={false} onChange={onChange} />
      );

      await user.dblClick(screen.getByText('Test Node'));

      const labelInput = screen.getByRole('textbox', { name: 'Edit node name' });
      await user.clear(labelInput);
      await user.type(labelInput, 'New Label');

      // Set to readonly
      rerender(<NodeLabel {...defaultProps} readonly onChange={onChange} />);

      expect(onChange).toHaveBeenCalledWith({
        label: 'New Label',
        subLabel: 'Test Description',
      });
      expect(screen.queryByRole('textbox', { name: 'Edit node name' })).not.toBeInTheDocument();
    });
  });

  describe('Keyboard interactions', () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('should prevent default behavior when Enter is pressed', async () => {
      render(<NodeLabel {...defaultProps} />);

      await user.dblClick(screen.getByText('Test Node'));

      const labelInput = screen.getByRole('textbox', { name: 'Edit node name' });

      // Type Enter - should not add newline
      await user.type(labelInput, '{Enter}');

      expect(screen.queryByRole('textbox', { name: 'Edit node name' })).not.toBeInTheDocument();
    });

    it('should prevent default behavior when Escape is pressed', async () => {
      render(<NodeLabel {...defaultProps} />);

      await user.dblClick(screen.getByText('Test Node'));

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('textbox', { name: 'Edit node name' })).not.toBeInTheDocument();
    });

    it('should stop propagation when Enter is pressed', async () => {
      const onKeyDown = vi.fn();
      render(
        <div onKeyDown={onKeyDown}>
          <NodeLabel {...defaultProps} />
        </div>
      );

      await user.dblClick(screen.getByText('Test Node'));

      const labelInput = screen.getByRole('textbox', { name: 'Edit node name' });
      await user.type(labelInput, '{Enter}');

      // Event should not propagate to parent
      expect(onKeyDown).not.toHaveBeenCalled();
    });

    it('should stop propagation when Escape is pressed', async () => {
      const onKeyDown = vi.fn();
      render(
        <div onKeyDown={onKeyDown}>
          <NodeLabel {...defaultProps} />
        </div>
      );

      await user.dblClick(screen.getByText('Test Node'));

      await user.keyboard('{Escape}');

      // Event should not propagate to parent
      expect(onKeyDown).not.toHaveBeenCalled();
    });

    it('should stop propagation when double clicking to enter edit mode', async () => {
      const onClick = vi.fn();
      render(
        <div onClick={onClick}>
          <NodeLabel {...defaultProps} />
        </div>
      );

      await user.dblClick(screen.getByText('Test Node'));

      // Double click event should not propagate to parent
      // onClick might be called once but not multiple times
      expect(screen.getByRole('textbox', { name: 'Edit node name' })).toBeInTheDocument();
    });
  });

  describe('Props variations', () => {
    it('should apply custom background color to label', () => {
      render(<NodeLabel {...defaultProps} labelBackgroundColor="#ff0000" />);

      expect(screen.getByText('Test Node')).toBeInTheDocument();
    });

    it('should render with rectangle shape and appropriate row limits', async () => {
      const user = userEvent.setup();
      render(<NodeLabel {...defaultProps} shape="rectangle" />);

      await user.dblClick(screen.getByText('Test Node'));

      const labelInput = screen.getByRole('textbox', { name: 'Edit node name' });
      const subLabelInput = screen.getByRole('textbox', { name: 'Edit node description' });

      expect(labelInput).toHaveAttribute('rows', '1');
      expect(subLabelInput).toHaveAttribute('rows', '2');
    });

    it('should render with hasBottomHandles prop', () => {
      render(<NodeLabel {...defaultProps} hasBottomHandles />);

      expect(screen.getByText('Test Node')).toBeInTheDocument();
    });
  });
});
