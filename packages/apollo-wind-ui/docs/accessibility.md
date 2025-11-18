# Accessibility Guide

**Version:** 1.0
**Last Updated:** November 12, 2025
**WCAG Compliance Target:** WCAG 2.1 Level AAA

---

## Overview

All components in `@uipath/apollo-wind-ui` are built on **Radix UI primitives**, which provide robust accessibility foundations including keyboard navigation, focus management, screen reader support, and ARIA attributes.

### Core Accessibility Principles

- **Keyboard Accessible**: All interactive elements can be operated via keyboard alone
- **Screen Reader Compatible**: Proper ARIA attributes and semantic HTML ensure screen reader users can navigate and understand all components
- **Focus Management**: Visible focus indicators and logical focus order
- **Color Contrast**: Meets WCAG AAA standards (7:1 for normal text, 4.5:1 for large text)
- **Responsive**: Components work across different viewport sizes and zoom levels

---

## Component Accessibility Details

### Button

**Keyboard Navigation:**
- `Enter` or `Space` to activate

**ARIA Attributes:**
- `role="button"` (implicit via `<button>` element)
- Supports `aria-label` for buttons without visible text
- Supports `aria-disabled` for disabled state

**Screen Reader:**
- Announced as "button"
- Button text is read aloud
- Disabled state announced

**Focus:**
- Visible focus ring using `focus-visible:ring-2`
- Focus follows tab order

**Best Practices:**
```tsx
// Good: Descriptive button text
<Button>Save Changes</Button>

// Good: Icon button with aria-label
<Button aria-label="Close dialog">
  <XIcon />
</Button>

// Good: Disabled button
<Button disabled>Cannot Save</Button>
```

---

### Card

**Accessibility:**
- Semantic HTML structure
- Headings within cards maintain document outline
- Interactive cards should use `<button>` or `<a>` elements

**Best Practices:**
```tsx
// Good: Card with proper heading structure
<Card>
  <CardHeader>
    <CardTitle>Settings</CardTitle>
    <CardDescription>Manage your account settings</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>

// Good: Interactive card
<Card asChild>
  <a href="/details">
    <CardTitle>Click for details</CardTitle>
  </a>
</Card>
```

---

### Dialog (Modal)

**Keyboard Navigation:**
- `Escape` to close dialog
- `Tab` to navigate within dialog
- Focus trapped within dialog while open

**ARIA Attributes:**
- `role="dialog"`
- `aria-labelledby` pointing to `DialogTitle`
- `aria-describedby` pointing to `DialogDescription`
- `aria-modal="true"`

**Screen Reader:**
- Announced as "dialog"
- Title and description are read when dialog opens
- Focus moves to dialog content on open

**Focus Management:**
- Focus moves to first focusable element in dialog on open
- Focus returns to trigger element on close
- Focus cannot leave dialog (focus trap)

**Best Practices:**
```tsx
// Good: Accessible dialog
<Dialog>
  <DialogTrigger>Open Settings</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Settings</DialogTitle>
      <DialogDescription>
        Manage your account settings and preferences.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Warning: Always include DialogTitle for screen readers
// Radix will warn if DialogTitle is missing
```

**WCAG Compliance:**
- ✅ 2.1.1 Keyboard (Level A): Fully keyboard accessible
- ✅ 2.1.2 No Keyboard Trap (Level A): Focus trap can be exited with Escape
- ✅ 2.4.3 Focus Order (Level A): Logical focus order within dialog
- ✅ 4.1.2 Name, Role, Value (Level A): Proper ARIA attributes

---

### Dropdown Menu

**Keyboard Navigation:**
- `Space` or `Enter` to open menu
- `Arrow Up/Down` to navigate menu items
- `Arrow Right` to open submenu
- `Arrow Left` to close submenu
- `Escape` to close menu
- `Home` to focus first item
- `End` to focus last item

**ARIA Attributes:**
- `role="menu"` on menu container
- `role="menuitem"` on menu items
- `role="menuitemcheckbox"` for checkbox items
- `role="menuitemradio"` for radio items
- `aria-haspopup="menu"` on trigger
- `aria-expanded` on trigger (true/false)
- `aria-checked` for checkbox/radio items

**Screen Reader:**
- Announced as "menu"
- Number of items announced
- Selected state announced for checkbox/radio items
- Disabled items announced

**Focus Management:**
- Focus moves to first menu item on open
- Arrow keys move focus between items
- Focus returns to trigger on close

**Best Practices:**
```tsx
// Good: Complete dropdown menu
<DropdownMenu>
  <DropdownMenuTrigger>Options</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Log out</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// Good: Checkbox items
<DropdownMenuCheckboxItem checked={showPanel}>
  Show Panel
</DropdownMenuCheckboxItem>

// Good: Radio group
<DropdownMenuRadioGroup value={position}>
  <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
  <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
</DropdownMenuRadioGroup>
```

**WCAG Compliance:**
- ✅ 2.1.1 Keyboard (Level A): Full keyboard navigation
- ✅ 2.4.3 Focus Order (Level A): Logical focus order
- ✅ 3.2.1 On Focus (Level A): No unexpected context changes
- ✅ 4.1.2 Name, Role, Value (Level A): Proper ARIA roles and states

---

### Input

**Keyboard Navigation:**
- `Tab` to focus input
- Standard text input behavior (typing, selection, etc.)

**ARIA Attributes:**
- Associated with `<label>` via `htmlFor`
- `aria-invalid` for error states
- `aria-describedby` for error messages or hints

**Screen Reader:**
- Label is read when focused
- Error state and messages announced
- Placeholder text announced (if present)

**Focus:**
- Visible focus ring
- Focus follows tab order

**Best Practices:**
```tsx
// Good: Input with label
<div>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" />
</div>

// Good: Input with error state
<div>
  <Label htmlFor="password">Password</Label>
  <Input
    id="password"
    type="password"
    aria-invalid={hasError}
    aria-describedby="password-error"
  />
  {hasError && (
    <p id="password-error" role="alert">
      Password must be at least 8 characters
    </p>
  )}
</div>

// Good: Input with placeholder
<Input
  id="search"
  placeholder="Search..."
  aria-label="Search"
/>
```

**WCAG Compliance:**
- ✅ 1.3.1 Info and Relationships (Level A): Proper label association
- ✅ 3.3.2 Labels or Instructions (Level A): Clear labels provided
- ✅ 4.1.2 Name, Role, Value (Level A): Accessible name and role

---

### Label

**Accessibility:**
- Properly associates label text with form controls via `htmlFor`
- Increases click target size (clicking label focuses associated input)

**ARIA Attributes:**
- Uses native `<label>` element
- `for` attribute associates with input `id`

**Screen Reader:**
- Label text is announced when associated control is focused

**Best Practices:**
```tsx
// Good: Label with input
<div>
  <Label htmlFor="username">Username</Label>
  <Input id="username" />
</div>

// Good: Required field indicator
<Label htmlFor="email">
  Email <span aria-label="required">*</span>
</Label>
<Input id="email" required />
```

---

### Popover

**Keyboard Navigation:**
- `Enter` or `Space` to open/close
- `Escape` to close
- `Tab` to navigate within popover content

**ARIA Attributes:**
- `role="dialog"` or custom role
- `aria-haspopup="dialog"` on trigger
- `aria-expanded` on trigger (true/false)

**Screen Reader:**
- Trigger element announced
- Popover content announced when opened
- Close action announced

**Focus Management:**
- Focus moves to popover content on open
- Focus returns to trigger on close
- Focus can navigate within popover

**Best Practices:**
```tsx
// Good: Accessible popover
<Popover>
  <PopoverTrigger>More info</PopoverTrigger>
  <PopoverContent>
    <h3>Additional Information</h3>
    <p>This is supplementary content.</p>
    <Button>Close</Button>
  </PopoverContent>
</Popover>

// Good: Popover with interactive content
<Popover>
  <PopoverTrigger>Settings</PopoverTrigger>
  <PopoverContent>
    <Label htmlFor="theme">Theme</Label>
    <Select id="theme">...</Select>
  </PopoverContent>
</Popover>
```

**WCAG Compliance:**
- ✅ 2.1.1 Keyboard (Level A): Fully keyboard accessible
- ✅ 2.4.3 Focus Order (Level A): Logical focus order
- ✅ 3.2.1 On Focus (Level A): No unexpected changes

---

### Select

**Keyboard Navigation:**
- `Space` or `Enter` to open dropdown
- `Arrow Up/Down` to navigate options
- `Home` to jump to first option
- `End` to jump to last option
- `Escape` to close without selecting
- Type to search options

**ARIA Attributes:**
- `role="combobox"` on trigger
- `aria-controls` pointing to options list
- `aria-expanded` (true/false)
- `role="option"` on each option
- `aria-selected` on selected option

**Screen Reader:**
- Announced as "combobox" or "select"
- Current selection announced
- Number of options announced
- Selected option announced when changed

**Focus Management:**
- Focus remains on trigger when dropdown is open
- Arrow keys navigate options
- Enter selects and closes

**Best Practices:**
```tsx
// Good: Select with label
<div>
  <Label htmlFor="country">Country</Label>
  <Select id="country">
    <SelectTrigger>
      <SelectValue placeholder="Select a country" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="us">United States</SelectItem>
      <SelectItem value="uk">United Kingdom</SelectItem>
      <SelectItem value="ca">Canada</SelectItem>
    </SelectContent>
  </Select>
</div>

// Good: Select with default value
<Select defaultValue="us">
  <SelectTrigger aria-label="Select country">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>...</SelectContent>
</Select>
```

**WCAG Compliance:**
- ✅ 2.1.1 Keyboard (Level A): Full keyboard navigation
- ✅ 3.3.2 Labels or Instructions (Level A): Clear labels
- ✅ 4.1.2 Name, Role, Value (Level A): Proper ARIA attributes

---

### Tabs

**Keyboard Navigation:**
- `Tab` to focus tab list
- `Arrow Left/Right` to navigate between tabs (horizontal orientation)
- `Arrow Up/Down` to navigate between tabs (vertical orientation)
- `Home` to jump to first tab
- `End` to jump to last tab
- Focus automatically moves to tab panel content

**ARIA Attributes:**
- `role="tablist"` on tab list container
- `role="tab"` on each tab trigger
- `role="tabpanel"` on each tab content panel
- `aria-selected="true"` on active tab
- `aria-controls` linking tab to panel
- `aria-labelledby` linking panel to tab

**Screen Reader:**
- Announced as "tablist"
- Number of tabs announced
- Current tab position announced (e.g., "1 of 3")
- Active tab announced
- Tab panel content read when tab changes

**Focus Management:**
- Focus follows active tab with arrow keys
- Tab selection and focus move together (automatic activation)
- Focus moves to tab panel with `Tab` key

**Best Practices:**
```tsx
// Good: Accessible tabs
<Tabs defaultValue="account">
  <TabsList aria-label="Account settings">
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
    <TabsTrigger value="notifications">Notifications</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    <h2>Account Settings</h2>
    <p>Manage your account details.</p>
  </TabsContent>
  <TabsContent value="password">
    <h2>Password</h2>
    <p>Change your password.</p>
  </TabsContent>
  <TabsContent value="notifications">
    <h2>Notifications</h2>
    <p>Manage notification preferences.</p>
  </TabsContent>
</Tabs>

// Good: Tabs with disabled tab
<TabsTrigger value="premium" disabled>
  Premium (Coming Soon)
</TabsTrigger>
```

**WCAG Compliance:**
- ✅ 2.1.1 Keyboard (Level A): Full keyboard navigation
- ✅ 2.4.3 Focus Order (Level A): Logical focus order
- ✅ 4.1.2 Name, Role, Value (Level A): Proper ARIA roles and states

---

### Tooltip

**Keyboard Navigation:**
- Tooltip appears on focus (for interactive triggers)
- `Escape` to dismiss tooltip

**ARIA Attributes:**
- `role="tooltip"` on tooltip content
- `aria-describedby` on trigger, pointing to tooltip

**Screen Reader:**
- Tooltip content is announced when trigger is focused or hovered
- Tooltip content is read as description of trigger element

**Focus Management:**
- Tooltip does not receive focus
- Focus remains on trigger element
- Tooltip dismissed when focus leaves trigger

**Best Practices:**
```tsx
// Good: Tooltip for supplementary information
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="outline">Hover me</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>This provides additional context</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>

// Warning: Do not put essential information only in tooltips
// Tooltips may not be accessible on touch devices

// Good: Icon button with tooltip
<Tooltip>
  <TooltipTrigger asChild>
    <Button size="icon" aria-label="Delete item">
      <TrashIcon />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Delete</TooltipContent>
</Tooltip>
```

**WCAG Compliance:**
- ✅ 1.4.13 Content on Hover or Focus (Level AAA): Tooltip is dismissible, hoverable, and persistent
- ✅ 4.1.2 Name, Role, Value (Level A): Proper ARIA attributes

---

## General Accessibility Testing

### Keyboard Testing Checklist

Test all components with keyboard only (no mouse):

- [ ] Can navigate to all interactive elements with `Tab`
- [ ] Can activate buttons/links with `Enter` or `Space`
- [ ] Can navigate menus/lists with arrow keys
- [ ] Can close dialogs/dropdowns with `Escape`
- [ ] Focus indicators are clearly visible
- [ ] No keyboard traps (can navigate away from all elements)
- [ ] Tab order is logical and follows visual order

### Screen Reader Testing

**Recommended Screen Readers:**
- **Windows**: NVDA (free), JAWS (paid)
- **macOS**: VoiceOver (built-in)
- **Linux**: Orca (free)

**Testing Checklist:**
- [ ] All interactive elements have accessible names
- [ ] Form fields are properly labeled
- [ ] Error messages are announced
- [ ] Dynamic content changes are announced
- [ ] Headings and landmarks are correctly identified
- [ ] Images have alt text
- [ ] Links have descriptive text

### Automated Testing

**Tools:**
- **axe-core**: Automated accessibility testing
- **Lighthouse**: Accessibility audit in Chrome DevTools
- **eslint-plugin-jsx-a11y**: Catch common accessibility issues during development

**Running axe-core tests:**
```typescript
import { axe } from 'vitest-axe';

it('has no accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Common Accessibility Patterns

### Form Validation

```tsx
// Good: Accessible form with validation
<form>
  <div>
    <Label htmlFor="email">Email</Label>
    <Input
      id="email"
      type="email"
      aria-invalid={emailError ? 'true' : 'false'}
      aria-describedby={emailError ? 'email-error' : undefined}
    />
    {emailError && (
      <p id="email-error" role="alert" className="text-destructive">
        Please enter a valid email address
      </p>
    )}
  </div>
</form>
```

### Loading States

```tsx
// Good: Accessible loading state
<Button disabled aria-busy="true">
  <Spinner aria-hidden="true" />
  Loading...
</Button>

// Good: Loading with live region
<div role="status" aria-live="polite">
  {loading ? 'Loading content...' : 'Content loaded'}
</div>
```

### Error Handling

```tsx
// Good: Error message with role="alert"
{error && (
  <div role="alert" className="error">
    <strong>Error:</strong> {error.message}
  </div>
)}
```

### Skip Links

```tsx
// Good: Skip to main content link
<a href="#main-content" className="skip-link">
  Skip to main content
</a>

<main id="main-content">
  {/* Page content */}
</main>
```

---

## Color and Contrast

### WCAG AAA Compliance

All Apollo Design System colors meet WCAG AAA contrast ratios:

- **Normal text**: 7:1 contrast ratio minimum
- **Large text (18pt+)**: 4.5:1 contrast ratio minimum
- **UI components**: 3:1 contrast ratio minimum

### Color Combinations (Apollo Theme)

**Text on Background:**
- ✅ `text-foreground` on `bg-background`: 14.5:1 (AAA)
- ✅ `text-muted-foreground` on `bg-background`: 7.2:1 (AAA)
- ✅ `text-primary-foreground` on `bg-primary`: 12:1 (AAA)

**Interactive Elements:**
- ✅ Buttons: 4.5:1 minimum
- ✅ Links: 4.5:1 minimum, underlined for additional cue
- ✅ Focus indicators: 3:1 minimum contrast with background

**Do Not Rely on Color Alone:**
- Use icons, labels, or patterns in addition to color
- Provide text alternatives for color-coded information

---

## Resources

### Official Documentation

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)

### Testing Tools

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [VoiceOver (macOS)](https://www.apple.com/accessibility/voiceover/)

### Learning Resources

- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

---

## Support

If you discover accessibility issues with any component, please [open an issue](https://github.com/uipath/apollo-wind-ui/issues) with:
- Component name
- Description of the accessibility barrier
- Steps to reproduce
- Screen reader and/or browser used
- Expected vs. actual behavior

We are committed to maintaining and improving accessibility across all components.

---

**Last Updated:** November 12, 2025
**Maintained by:** UiPath Apollo Design System Team
