# Accessibility Testing Guide

This guide outlines the accessibility standards and testing practices for the UiPath Wind Design System.

---

## Table of Contents

1. [Our Accessibility Commitment](#our-accessibility-commitment)
2. [WCAG Compliance Level](#wcag-compliance-level)
3. [Automated Testing with jest-axe](#automated-testing-with-jest-axe)
4. [Manual Testing Checklist](#manual-testing-checklist)
5. [Component-Specific Guidelines](#component-specific-guidelines)
6. [Common Accessibility Issues & Fixes](#common-accessibility-issues--fixes)
7. [Testing Tools](#testing-tools)
8. [Contributing Accessible Components](#contributing-accessible-components)

---

## Our Accessibility Commitment

We are committed to making UiPath Wind accessible to all users, including those who rely on assistive technologies. Every component in this library must:

- Meet **WCAG 2.1 Level AA** standards
- Support keyboard navigation
- Work with screen readers
- Provide appropriate ARIA attributes
- Maintain adequate color contrast
- Include visible focus indicators

---

## WCAG Compliance Level

**Target**: WCAG 2.1 Level AA

### Key Requirements

#### Perceivable

- Text alternatives for non-text content
- Color contrast ratio of at least 4.5:1 for normal text
- Content can be presented in different ways without losing information

#### Operable

- All functionality available via keyboard
- Users can control time limits
- Content doesn't cause seizures
- Users can navigate and find content easily

#### Understandable

- Text is readable and understandable
- Web pages appear and operate in predictable ways
- Users are helped to avoid and correct mistakes

#### Robust

- Content compatible with current and future assistive technologies

---

## Automated Testing with jest-axe

### Setup

jest-axe is already configured in this project. It's imported in test setup and available in all tests.

### Basic Usage

Every component test should include an accessibility test:

```tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Testing Form Components

Form components should be tested with proper labels:

```tsx
it('has no accessibility violations', async () => {
  const { container } = render(
    <div>
      <Label htmlFor="email">Email Address</Label>
      <Input id="email" type="email" />
    </div>,
  );
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Testing Interactive Components

Test interactive states (open/closed, expanded/collapsed):

```tsx
it('has no accessibility violations when open', async () => {
  const { container } = render(
    <Dialog open={true}>
      <DialogContent>
        <DialogTitle>Accessible Dialog</DialogTitle>
        <DialogDescription>This is a description</DialogDescription>
        <p>Dialog content</p>
      </DialogContent>
    </Dialog>,
  );
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Custom axe Configuration

You can customize axe rules if needed:

```tsx
const results = await axe(container, {
  rules: {
    // Disable specific rules if absolutely necessary
    'color-contrast': { enabled: false },
  },
});
```

**Note**: Only disable rules with strong justification and document the reason.

---

## Manual Testing Checklist

Automated testing catches ~30-40% of accessibility issues. Manual testing is essential.

### Keyboard Navigation

Test every component with keyboard only:

- [ ] **Tab**: Moves focus to next interactive element
- [ ] **Shift + Tab**: Moves focus to previous interactive element
- [ ] **Enter**: Activates buttons and links
- [ ] **Space**: Activates buttons, toggles checkboxes/switches
- [ ] **Arrow Keys**: Navigate within menus, tabs, radio groups, comboboxes
- [ ] **Escape**: Closes dialogs, popovers, dropdowns
- [ ] **Home/End**: Navigate to first/last item in lists

#### Focus Management

- [ ] Focus is visible (outline/ring visible)
- [ ] Focus order is logical (follows visual order)
- [ ] Focus is trapped in modals/dialogs
- [ ] Focus returns to trigger element when closing overlays

### Screen Reader Testing

#### macOS: VoiceOver

```bash
# Enable VoiceOver
Cmd + F5

# Navigate
Ctrl + Option + Arrow Keys

# Interact
Ctrl + Option + Space
```

#### Windows: NVDA (Free)

```bash
# Download: https://www.nvaccess.org/
# Navigate
Arrow Keys

# Interact
Enter/Space
```

#### Test Checklist

- [ ] All interactive elements announced correctly
- [ ] Buttons announce as "button"
- [ ] Links announce as "link"
- [ ] Form fields announce label and type
- [ ] Current state announced (expanded, selected, checked)
- [ ] Error messages announced
- [ ] Loading states announced

### Color Contrast

Use browser DevTools or online tools:

- [ ] Normal text (< 18px): 4.5:1 minimum
- [ ] Large text (≥ 18px or 14px bold): 3:1 minimum
- [ ] UI components and graphical objects: 3:1 minimum
- [ ] Disabled states: No minimum (but should be distinguishable)

**Tools**:

- Chrome DevTools Lighthouse
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colorblindly](https://chrome.google.com/webstore/detail/colorblindly) extension

### Motion & Animation

- [ ] Animations respect `prefers-reduced-motion` media query
- [ ] No auto-playing videos with sound
- [ ] Animated content can be paused

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Component-Specific Guidelines

### Buttons

**Requirements**:

- Must have accessible text (visible text, `aria-label`, or `aria-labelledby`)
- Icon-only buttons require `aria-label`
- Disabled state should have `disabled` attribute

```tsx
// ✅ Good
<Button>Save</Button>
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

// ❌ Bad
<Button><X /></Button> // No accessible text
```

### Form Inputs

**Requirements**:

- Must have associated `<Label>` with matching `htmlFor` and `id`
- Required fields should have `required` attribute
- Invalid fields should have `aria-invalid` and `aria-describedby` for error

```tsx
// ✅ Good
<div>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" required />
  {error && <span id="email-error" className="text-destructive">{error}</span>}
</div>

// ❌ Bad
<Input placeholder="Email" /> // No label
```

### Dialogs & Modals

**Requirements**:

- Must have `DialogTitle` (or `aria-labelledby`)
- Should have `DialogDescription` (or `aria-describedby`)
- Focus trapped within dialog
- Focus returns to trigger on close
- Closes with Escape key

```tsx
// ✅ Good
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete Account</DialogTitle>
      <DialogDescription>This action cannot be undone.</DialogDescription>
    </DialogHeader>
    {/* content */}
  </DialogContent>
</Dialog>
```

### Dropdowns & Menus

**Requirements**:

- Trigger has `aria-expanded` attribute
- Trigger has `aria-haspopup` attribute
- Menu items use proper roles
- Keyboard navigation (arrows, home, end)

```tsx
// ✅ Good - Radix handles this automatically
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Data Tables

**Requirements**:

- Use semantic `<table>` elements
- Column headers use `<th>` with `scope="col"`
- Row headers use `<th>` with `scope="row"` (if applicable)
- Sortable columns announce sort state
- Select checkboxes have labels (can be visually hidden)

```tsx
// ✅ Good
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Tabs

**Requirements**:

- Use Radix Tabs primitive (handles ARIA automatically)
- Tab list has `role="tablist"`
- Tabs have `role="tab"`
- Tab panels have `role="tabpanel"`
- Selected tab has `aria-selected="true"`

```tsx
// ✅ Good
<Tabs defaultValue="tab1">
  <TabsList aria-label="Main navigation">
    <TabsTrigger value="tab1">Overview</TabsTrigger>
    <TabsTrigger value="tab2">Details</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Overview content</TabsContent>
  <TabsContent value="tab2">Details content</TabsContent>
</Tabs>
```

### Tooltips

**Requirements**:

- Triggered by focus and hover
- Content descriptive but concise
- Not used for critical information
- Dismissible with Escape

```tsx
// ✅ Good
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon">
        <Info className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Additional information</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Alerts & Notifications

**Requirements**:

- Use appropriate `role` (`alert`, `alertdialog`, `status`)
- Error alerts use `role="alert"` (announces immediately)
- Status updates use `role="status"` (polite announcement)
- Icon accompanied by text (not icon-only)

```tsx
// ✅ Good
<Alert variant="destructive" role="alert">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong.</AlertDescription>
</Alert>
```

---

## Common Accessibility Issues & Fixes

### Issue 1: Missing Accessible Name

**Problem**: Button/input has no text that screen readers can announce.

**Fix**:

```tsx
// Before
<Button><X /></Button>

// After
<Button aria-label="Close">
  <X className="h-4 w-4" />
</Button>
```

### Issue 2: Missing Form Labels

**Problem**: Input field not associated with a label.

**Fix**:

```tsx
// Before
<Input placeholder="Email" />

// After
<>
  <Label htmlFor="email">Email</Label>
  <Input id="email" placeholder="you@example.com" />
</>
```

### Issue 3: Low Color Contrast

**Problem**: Text doesn't meet 4.5:1 contrast ratio.

**Fix**: Use design system tokens that meet contrast requirements:

```tsx
// Use semantic colors from theme
className = 'text-foreground'; // ✅ High contrast
className = 'text-muted-foreground'; // ✅ Still meets minimum

// Avoid custom low-contrast colors
className = 'text-gray-400'; // ❌ May not meet contrast on light backgrounds
```

### Issue 4: Keyboard Trap

**Problem**: User can't navigate out of a component with keyboard.

**Fix**: Ensure dialogs trap focus but allow Escape to close:

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  {/* Dialog handles focus trap and Escape key */}
</Dialog>
```

### Issue 5: Missing Focus Indicators

**Problem**: No visible focus outline.

**Fix**: Use design system focus styles:

```tsx
className =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
```

### Issue 6: Incorrect ARIA Attributes

**Problem**: Using ARIA incorrectly (worse than no ARIA).

**Fix**:

- First rule of ARIA: Don't use ARIA (use semantic HTML)
- If you must use ARIA, follow WAI-ARIA authoring practices
- Use Radix UI primitives (they handle ARIA correctly)

```tsx
// ✅ Good - Semantic HTML
<button>Click me</button>

// ⚠️ Okay - When needed
<div role="button" tabIndex={0} onKeyDown={handleKeyDown}>
  Custom Button
</div>

// ❌ Bad - Incorrect ARIA
<div role="button">No keyboard support</div>
```

---

## Testing Tools

### Browser Extensions

#### Chrome/Edge

- [axe DevTools](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) (built-in to DevTools)
- [WAVE](https://chrome.google.com/webstore/detail/wave-evaluation-tool/jbbplnpkjmmeebjpijfedlgcdilocofh)

#### Firefox

- [axe DevTools](https://addons.mozilla.org/en-US/firefox/addon/axe-devtools/)
- [WAVE](https://addons.mozilla.org/en-US/firefox/addon/wave-accessibility-tool/)

### Command Line Tools

```bash
# pa11y - Automated testing
npm install -g pa11y
pa11y http://localhost:6006

# Lighthouse CI
npm install -g @lhci/cli
lhci autorun
```

### Manual Testing

#### Screen Readers

- **macOS**: VoiceOver (built-in) - `Cmd + F5`
- **Windows**: NVDA (free) - https://www.nvaccess.org/
- **Windows**: JAWS (paid) - https://www.freedomscientific.com/products/software/jaws/
- **iOS**: VoiceOver (built-in) - Settings > Accessibility
- **Android**: TalkBack (built-in) - Settings > Accessibility

#### Keyboard Testing

No special tools needed - just use Tab, Enter, Space, and Arrow keys.

---

## Contributing Accessible Components

### Before Submitting a PR

1. **Run automated tests**:

   ```bash
   npm test
   ```

2. **Test with keyboard**:
   - Tab through all interactive elements
   - Verify focus is visible
   - Test all keyboard shortcuts

3. **Test with screen reader**:
   - VoiceOver (macOS) or NVDA (Windows)
   - Navigate through component
   - Verify all content is announced

4. **Run Lighthouse**:
   - Open Storybook story in Chrome
   - Open DevTools > Lighthouse
   - Run accessibility audit
   - Score should be 100

5. **Check contrast**:
   - Use DevTools or contrast checker
   - All text meets 4.5:1 (or 3:1 for large text)

### Component Checklist

- [ ] Automated axe tests pass
- [ ] Component uses semantic HTML where possible
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] ARIA attributes correct (or Radix primitive used)
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader testing completed
- [ ] Storybook example demonstrates accessible usage
- [ ] Documentation includes accessibility notes

---

## Resources

### Official Guidelines

- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)

### Learning Resources

- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [Deque University](https://dequeuniversity.com/)
- [Inclusive Components](https://inclusive-components.design/)

### Testing Tools

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Pa11y](https://pa11y.org/)

---

## Questions?

If you have questions about accessibility or need help making a component accessible:

1. Check this guide and the resources above
2. Look at existing components for patterns
3. Open a GitHub issue with the `accessibility` label
4. Ask in the team Slack channel

**Remember**: Accessibility is not optional. It's a requirement for all components in this library.
