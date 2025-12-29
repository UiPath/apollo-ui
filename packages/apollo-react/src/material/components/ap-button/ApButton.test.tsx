import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ApButton } from './ApButton';
import { ButtonVariants } from './ApButton.types';

describe('ApButton', () => {
    describe('Basic Rendering', () => {
        it('renders the button with label default', () => {
            render(<ApButton label="Click Me" />);
            expect(screen.getByText('Click Me')).toBeInTheDocument();
            expect(screen.getByRole('button')).toBeInTheDocument();
        });

        it('renders button with specific variant', () => {
            render(<ApButton label="Primary" variant="primary" />);
            expect(screen.getByText('Primary')).toBeInTheDocument();
        });

        it('renders the button as disabled', () => {
            render(<ApButton label="Disabled" disabled />);
            expect(screen.getByText('Disabled')).toBeInTheDocument();
        });

        it('renders the button in loading state with loading indicator as label', () => {
            render(<ApButton label="Loading" loading />);
            expect(screen.getByLabelText('Loading')).toBeInTheDocument();
        });

        it('renders the button with start and end icons', () => {
            const StartIcon = () => <span data-testid="start-icon">S</span>;
            const EndIcon = () => <span data-testid="end-icon">E</span>;
            render(<ApButton label="With Icons" startIcon={<StartIcon />} endIcon={<EndIcon />} />);
            expect(screen.getByTestId('start-icon')).toBeInTheDocument();
            expect(screen.getByTestId('end-icon')).toBeInTheDocument();
        });

        it('renders the button with custom content', () => {
            render(<ApButton label="Custom" customContent={<span data-testid="custom-content">Custom Content</span>} />);
            expect(screen.getByTestId('custom-content')).toBeInTheDocument();
        });
    });

    describe('Button Variants', () => {
        const variants = ['primary', 'secondary', 'tertiary', 'destructive', 'text', 'text-foreground'] as ButtonVariants[];

        variants.forEach((variant) => {
            it(`renders the button with ${variant} variant`, () => {
                render(<ApButton label={`${variant} Button`} variant={variant} />);
                const button = screen.getByRole('button');
                expect(button).toBeInTheDocument();
                expect(button.tagName).toBe('BUTTON');
                expect(screen.getByText(`${variant} Button`)).toBeInTheDocument();
            });
        });
    });

    describe('Button Sizes and Width Modes', () => {
        it('renders the button with small size', () => {
            render(<ApButton label="Small Button" size="small" />);
            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
        });

        it('renders the button with tall size', () => {
            render(<ApButton label="Tall Button" size="tall" />);
            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
        });

        it('renders the button with fit-content width mode', () => {
            render(<ApButton label="Fit Content" widthMode="fit-content" />);
            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
        });

        it('renders the button with default width mode', () => {
            render(<ApButton label="Default Width" widthMode="default" />);
            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
        });
    });

    describe('Disabled and Loading States', () => {
        it('renders the button as disabled', () => {
            render(<ApButton label="Disabled Button" disabled />);
            const button = screen.getByRole('button');
            expect(button).toBeDisabled();

            const handleClick = vi.fn();
            render(<ApButton label="Disabled Button" disabled onClick={handleClick} />);
            button.click();
            expect(handleClick).not.toHaveBeenCalled();
        });

        it('renders the button in loading state', () => {
            render(<ApButton label="Loading Button" loading />);
            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('aria-disabled', 'true');
            expect(screen.getByLabelText('Loading Button')).toBeInTheDocument();

            const handleClick = vi.fn();
            render(<ApButton label="Loading Button" loading onClick={handleClick} />);
            button.click();
            expect(handleClick).not.toHaveBeenCalled();
        });

        it('renders the loading incidator in place of label', () => {
           const { container } = render(<ApButton label="Loading Button" loading />);
            expect(screen.getByLabelText('Loading Button')).toBeInTheDocument();
            expect(screen.queryByText('Loading Button')).toHaveStyle('opacity: 0');
            expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
        });

        it('renders the loading indicator as start icon', () => {
            const StartIcon = () => <span data-testid="start-icon">S</span>;
            const { container } = render(<ApButton label="Loading Button" loading startIcon={<StartIcon />} />);
            expect(screen.getByLabelText('Loading Button')).toBeInTheDocument();
            expect(screen.queryByTestId('start-icon')).not.toBeInTheDocument();
            expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
        });

        it('renders the loading indicator as end icon', () => {
            const EndIcon = () => <span data-testid="end-icon">E</span>;
            const { container } = render(<ApButton label="Loading Button" loading endIcon={<EndIcon />} />);
            expect(screen.getByLabelText('Loading Button')).toBeInTheDocument();
            expect(screen.queryByTestId('end-icon')).not.toBeInTheDocument();
            expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
        });

        it('renders loading indicator as start icon when both icons are provided', () => {
            const StartIcon = () => <span data-testid="start-icon">S</span>;
            const EndIcon = () => <span data-testid="end-icon">E</span>;
            const { container } = render(<ApButton label="Loading Button" loading startIcon={<StartIcon />} endIcon={<EndIcon />} />);
            expect(screen.getByLabelText('Loading Button')).toBeInTheDocument();
            expect(screen.queryByTestId('start-icon')).not.toBeInTheDocument();
            expect(screen.queryByTestId('end-icon')).toBeInTheDocument();
            expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
        });
    });

    describe('Id, Type, href, tabIndex, and Event Handlers', () => {
        it('sets the id of the button', () => {
            render(<ApButton label="With ID" id="test-button" />);
            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('id', 'test-button');
        });

        it('sets the type of the button', () => {
            render(<ApButton label="Submit Button" type="submit" />);
            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('type', 'submit');
        });

        it('sets the href of the button when provided', () => {
            render(<ApButton label="Link Button" href="https://example.com" />);
            const button = screen.getByRole('link');
            expect(button).toHaveAttribute('href', 'https://example.com');
        });

        it('sets the tabIndex of the button', () => {
            render(<ApButton label="Tabbable Button" tabIndex={3} />);
            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('tabindex', '3');
        });

        it('calls onClick handler when clicked', async () => {
            const handleClick = vi.fn();
            render(<ApButton label="Clickable" onClick={handleClick} />);
            const button = screen.getByRole('button');
            await button.click();
            expect(handleClick).toHaveBeenCalled();
        });

        it('calls onMouseEnter and onMouseLeave handlers', () => {
            const handleMouseEnter = vi.fn();
            const handleMouseLeave = vi.fn();

            render(
            <ApButton
                label="Hoverable"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            />
            );

            const button = screen.getByRole('button');

            fireEvent.mouseEnter(button);
            expect(handleMouseEnter).toHaveBeenCalledTimes(1);

            fireEvent.mouseLeave(button);
            expect(handleMouseLeave).toHaveBeenCalledTimes(1);
        });

        it('calls onFocus and onBlur handlers', async () => {
            const handleFocus = vi.fn();
            const handleBlur = vi.fn();
            render(<ApButton label="Focusable" onFocus={handleFocus} onBlur={handleBlur} />);
            const button = screen.getByRole('button');
            await button.focus();
            expect(handleFocus).toHaveBeenCalled();
            await button.blur();
            expect(handleBlur).toHaveBeenCalled();
        });

        it('calls onKeyDown handler', async () => {
            const handleKeyDown = vi.fn();
            render(<ApButton label="Keyable" onKeyDown={handleKeyDown} />);
            const button = screen.getByRole('button');
            await button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            expect(handleKeyDown).toHaveBeenCalled();
        }); 
    });

    describe('Accessibility', () => {
        it('has appropriate aria attributes when expanded', () => {
            render(<ApButton label="Expandable" expanded />);
            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('aria-expanded', 'true');
        });

        it('sets the title attribute when provided', () => {
            render(<ApButton label="With Title" title="Button Title" />);
            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('title', 'Button Title');
        });
    });
});