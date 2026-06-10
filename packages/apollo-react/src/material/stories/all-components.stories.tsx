import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  LinearProgress,
  Link,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Slider,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Search } from '../../icons';
import {
  ApBadge,
  ApIcon,
  ApProgressSpinner,
  ApSkeleton,
  ApToolCall,
  ApTypography,
  StatusTypes,
} from '../components';
import { materialParameters } from './storybook-helpers';

/**
 * Gallery of every component in the Material layer: MUI components styled by
 * the Apollo theme overrides plus the Ap* wrapper components.
 */
const meta: Meta = {
  title: 'Components/All Components',
  parameters: {
    ...materialParameters,
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

enum Category {
  Inputs = 'Inputs',
  DataDisplay = 'Data Display',
  Feedback = 'Feedback',
  Navigation = 'Navigation',
  Ai = 'AI',
}

const CATEGORY_ORDER: Category[] = [
  Category.Inputs,
  Category.DataDisplay,
  Category.Feedback,
  Category.Navigation,
  Category.Ai,
];

interface ComponentInfo {
  name: string;
  description: string;
  storyPath: string;
  category: Category;
  preview: ReactNode;
}

const storyDocs = (slug: string) => `material-maintenance-only-components-${slug}--docs`;

const components: ComponentInfo[] = [
  // ── Inputs ────────────────────────────────────────────────────────────
  {
    name: 'Button',
    description: 'Contained, outlined and text actions',
    storyPath: storyDocs('button'),
    category: Category.Inputs,
    preview: (
      <Stack direction="row" spacing={1}>
        <Button variant="contained" size="small">
          Contained
        </Button>
        <Button variant="outlined" size="small">
          Outlined
        </Button>
      </Stack>
    ),
  },
  {
    name: 'Icon Button',
    description: 'Icon-only compact actions',
    storyPath: storyDocs('icon-button'),
    category: Category.Inputs,
    preview: (
      <Stack direction="row" spacing={1}>
        <IconButton aria-label="search">
          <Search />
        </IconButton>
        <IconButton color="primary" aria-label="primary search">
          <Search />
        </IconButton>
      </Stack>
    ),
  },
  {
    name: 'Button Base',
    description: 'Low-level button behavior primitive',
    storyPath: storyDocs('button-base'),
    category: Category.Inputs,
    preview: (
      <Button variant="text" size="small">
        Base behavior
      </Button>
    ),
  },
  {
    name: 'Checkbox',
    description: 'Binary selection control',
    storyPath: storyDocs('checkbox'),
    category: Category.Inputs,
    preview: (
      <Stack direction="row">
        <Checkbox defaultChecked />
        <Checkbox />
        <Checkbox disabled />
      </Stack>
    ),
  },
  {
    name: 'Radio',
    description: 'Single-choice selection control',
    storyPath: storyDocs('radio'),
    category: Category.Inputs,
    preview: (
      <RadioGroup row defaultValue="a">
        <FormControlLabel value="a" control={<Radio />} label="A" />
        <FormControlLabel value="b" control={<Radio />} label="B" />
      </RadioGroup>
    ),
  },
  {
    name: 'Switch',
    description: 'On/off toggle control',
    storyPath: storyDocs('switch'),
    category: Category.Inputs,
    preview: (
      <Stack direction="row">
        <Switch defaultChecked />
        <Switch />
      </Stack>
    ),
  },
  {
    name: 'Select',
    description: 'Dropdown single selection',
    storyPath: storyDocs('select'),
    category: Category.Inputs,
    preview: (
      <Select size="small" value="one" sx={{ minWidth: 120 }}>
        <MenuItem value="one">Option one</MenuItem>
        <MenuItem value="two">Option two</MenuItem>
      </Select>
    ),
  },
  {
    name: 'Slider',
    description: 'Value selection along a range',
    storyPath: storyDocs('slider'),
    category: Category.Inputs,
    preview: <Slider defaultValue={40} sx={{ width: 120 }} size="small" />,
  },
  {
    name: 'Text Field',
    description: 'Single-line text input',
    storyPath: storyDocs('text-field'),
    category: Category.Inputs,
    preview: <TextField size="small" label="Label" placeholder="Type here" />,
  },
  {
    name: 'Text Area',
    description: 'Multi-line text input',
    storyPath: storyDocs('text-area'),
    category: Category.Inputs,
    preview: <TextField size="small" label="Notes" multiline minRows={2} sx={{ width: 160 }} />,
  },
  {
    name: 'Inputs',
    description: 'Input, OutlinedInput and adornments',
    storyPath: storyDocs('inputs'),
    category: Category.Inputs,
    preview: (
      <TextField
        size="small"
        placeholder="Search"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />
    ),
  },
  {
    name: 'Input Base',
    description: 'Unstyled input building block',
    storyPath: storyDocs('input-base'),
    category: Category.Inputs,
    preview: <TextField size="small" variant="standard" placeholder="Base input" />,
  },
  {
    name: 'Autocomplete',
    description: 'Text input with suggestions',
    storyPath: storyDocs('autocomplete'),
    category: Category.Inputs,
    preview: <TextField size="small" label="Search options" />,
  },
  {
    name: 'Form Controls',
    description: 'Labels, helper text and groups',
    storyPath: storyDocs('form-controls'),
    category: Category.Inputs,
    preview: <FormControlLabel control={<Checkbox defaultChecked />} label="Accept terms" />,
  },
  {
    name: 'Datepicker',
    description: 'Date selection with calendar',
    storyPath: storyDocs('datepicker'),
    category: Category.Inputs,
    preview: <TextField size="small" label="Date" placeholder="06/10/2026" />,
  },
  {
    name: 'Rich Text Editor',
    description: 'Formatted text editing',
    storyPath: storyDocs('rich-text-editor'),
    category: Category.Inputs,
    preview: (
      <Box
        sx={(theme) => ({
          border: `1px solid ${theme.palette.semantic.colorBorderDeEmp}`,
          borderRadius: 1,
          px: 1.5,
          py: 1,
          fontSize: 13,
          color: 'text.secondary',
          width: 160,
        })}
      >
        <b>B</b> <i>I</i> <u>U</u> — rich text…
      </Box>
    ),
  },

  // ── Data Display ──────────────────────────────────────────────────────
  {
    name: 'Typography',
    description: 'Headings, body and token variants',
    storyPath: storyDocs('typography'),
    category: Category.DataDisplay,
    preview: (
      <Stack alignItems="center">
        <Typography variant="h6">Heading</Typography>
        <ApTypography>Body text</ApTypography>
      </Stack>
    ),
  },
  {
    name: 'List',
    description: 'Vertical item collections',
    storyPath: storyDocs('list'),
    category: Category.DataDisplay,
    preview: (
      <List dense sx={{ width: 150, py: 0 }}>
        <ListItem disablePadding sx={{ px: 1 }}>
          <ListItemText primary="First item" />
        </ListItem>
        <ListItem disablePadding sx={{ px: 1 }}>
          <ListItemText primary="Second item" />
        </ListItem>
      </List>
    ),
  },
  {
    name: 'Chip',
    description: 'Compact labels and filters',
    storyPath: storyDocs('chip'),
    category: Category.DataDisplay,
    preview: (
      <Stack direction="row" spacing={1}>
        <Chip label="Default" size="small" />
        <Chip label="Primary" size="small" color="primary" />
      </Stack>
    ),
  },
  {
    name: 'Badge',
    description: 'Status badges',
    storyPath: storyDocs('badge'),
    category: Category.DataDisplay,
    preview: <ApBadge status={StatusTypes.SUCCESS} label="Success" />,
  },
  {
    name: 'Icon',
    description: 'Apollo icon library',
    storyPath: storyDocs('icon'),
    category: Category.DataDisplay,
    preview: <ApIcon name="home" />,
  },
  {
    name: 'Tooltip',
    description: 'Contextual hover hints',
    storyPath: storyDocs('tooltip'),
    category: Category.DataDisplay,
    preview: (
      <Tooltip title="Tooltip content" open placement="top" arrow>
        <Button variant="outlined" size="small">
          Hover me
        </Button>
      </Tooltip>
    ),
  },
  {
    name: 'Divider',
    description: 'Content separation lines',
    storyPath: storyDocs('divider'),
    category: Category.DataDisplay,
    preview: (
      <Box sx={{ width: 140 }}>
        <Typography variant="body2">Above</Typography>
        <Divider sx={{ my: 1 }} />
        <Typography variant="body2">Below</Typography>
      </Box>
    ),
  },
  {
    name: 'Tree View',
    description: 'Hierarchical item navigation',
    storyPath: storyDocs('tree-view'),
    category: Category.DataDisplay,
    preview: (
      <Box sx={{ fontSize: 13, color: 'text.secondary', textAlign: 'left' }}>
        ▾ Parent
        <Box sx={{ pl: 2 }}>▸ Child A</Box>
        <Box sx={{ pl: 2 }}>▸ Child B</Box>
      </Box>
    ),
  },
  {
    name: 'Sankey Diagram',
    description: 'Flow quantity visualization',
    storyPath: storyDocs('sankey-diagram'),
    category: Category.DataDisplay,
    preview: <Box sx={{ fontSize: 13, color: 'text.secondary' }}>Flows → between → nodes</Box>,
  },
  {
    name: 'Accordion',
    description: 'Expandable content sections',
    storyPath: storyDocs('accordion'),
    category: Category.DataDisplay,
    preview: (
      <Box
        sx={(theme) => ({
          border: `1px solid ${theme.palette.semantic.colorBorderDeEmp}`,
          borderRadius: 1,
          px: 1.5,
          py: 1,
          width: 160,
          fontSize: 13,
        })}
      >
        Section title ▾
      </Box>
    ),
  },

  // ── Feedback ──────────────────────────────────────────────────────────
  {
    name: 'Alert',
    description: 'Inline status messages',
    storyPath: storyDocs('alert'),
    category: Category.Feedback,
    preview: (
      <Alert severity="info" sx={{ py: 0 }}>
        Heads up
      </Alert>
    ),
  },
  {
    name: 'Alert Bar',
    description: 'Page-level status banner',
    storyPath: storyDocs('alert-bar'),
    category: Category.Feedback,
    preview: (
      <Alert severity="warning" sx={{ py: 0 }}>
        Banner message
      </Alert>
    ),
  },
  {
    name: 'Snackbar',
    description: 'Transient bottom notifications',
    storyPath: storyDocs('snackbar'),
    category: Category.Feedback,
    preview: (
      <Box
        sx={(theme) => ({
          backgroundColor: theme.palette.semantic.colorBackgroundInverse,
          color: theme.palette.semantic.colorForegroundInverse,
          borderRadius: 1,
          px: 2,
          py: 1,
          fontSize: 13,
        })}
      >
        Saved successfully
      </Box>
    ),
  },
  {
    name: 'Dialog',
    description: 'Modal MUI dialogs',
    storyPath: storyDocs('dialog'),
    category: Category.Feedback,
    preview: (
      <Button variant="outlined" size="small">
        Open dialog
      </Button>
    ),
  },
  {
    name: 'Modal',
    description: 'Apollo modal with header/footer',
    storyPath: storyDocs('modal'),
    category: Category.Feedback,
    preview: (
      <Button variant="outlined" size="small">
        Open modal
      </Button>
    ),
  },
  {
    name: 'Progress Spinner',
    description: 'Apollo loading spinner',
    storyPath: storyDocs('progress-spinner'),
    category: Category.Feedback,
    preview: <ApProgressSpinner />,
  },
  {
    name: 'Circular Progress',
    description: 'Circular loading indicator',
    storyPath: storyDocs('circular-progress'),
    category: Category.Feedback,
    preview: <CircularProgress size={28} />,
  },
  {
    name: 'Linear Progress',
    description: 'Horizontal progress bar',
    storyPath: storyDocs('linear-progress'),
    category: Category.Feedback,
    preview: <LinearProgress sx={{ width: 140 }} />,
  },
  {
    name: 'Skeleton',
    description: 'Loading placeholders',
    storyPath: storyDocs('skeleton'),
    category: Category.Feedback,
    preview: (
      <Stack spacing={0.5} sx={{ width: 140 }}>
        <ApSkeleton variant="rectangle" style={{ height: 12 }} />
        <ApSkeleton variant="rectangle" style={{ height: 32 }} />
      </Stack>
    ),
  },

  // ── Navigation ────────────────────────────────────────────────────────
  {
    name: 'Tabs',
    description: 'Sectioned content navigation',
    storyPath: storyDocs('tabs'),
    category: Category.Navigation,
    preview: (
      <Tabs value={0} sx={{ minHeight: 36 }}>
        <Tab label="One" sx={{ minHeight: 36 }} />
        <Tab label="Two" sx={{ minHeight: 36 }} />
      </Tabs>
    ),
  },
  {
    name: 'Menu',
    description: 'Contextual action menus',
    storyPath: storyDocs('menu'),
    category: Category.Navigation,
    preview: (
      <Button variant="outlined" size="small">
        Open menu ▾
      </Button>
    ),
  },
  {
    name: 'Link',
    description: 'Inline navigation links',
    storyPath: storyDocs('link'),
    category: Category.Navigation,
    preview: <Link href="#preview">Navigate somewhere</Link>,
  },
  {
    name: 'Stepper',
    description: 'Multi-step progress indicator',
    storyPath: storyDocs('stepper'),
    category: Category.Navigation,
    preview: (
      <Stepper activeStep={1} sx={{ width: 200 }}>
        <Step>
          <StepLabel />
        </Step>
        <Step>
          <StepLabel />
        </Step>
        <Step>
          <StepLabel />
        </Step>
      </Stepper>
    ),
  },

  // ── AI ────────────────────────────────────────────────────────────────
  {
    name: 'Chat',
    description: 'Autopilot chat experience',
    storyPath: storyDocs('chat'),
    category: Category.Ai,
    preview: <Box sx={{ fontSize: 13, color: 'text.secondary' }}>💬 Autopilot chat harness</Box>,
  },
  {
    name: 'Tool Call',
    description: 'Agent tool invocation display',
    storyPath: storyDocs('tool-call'),
    category: Category.Ai,
    preview: <ApToolCall toolName="search_files" output="2 files found" />,
  },
];

function ComponentGallery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

  const filteredComponents = useMemo(() => {
    return components.filter((component) => {
      const matchesSearch =
        searchQuery === '' ||
        component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <Box
      sx={(theme) => ({
        minHeight: '100vh',
        backgroundColor: theme.palette.semantic.colorBackground,
      })}
    >
      <Box
        sx={(theme) => ({
          borderBottom: `1px solid ${theme.palette.semantic.colorBorderDeEmp}`,
          px: 5,
          py: 6,
        })}
      >
        <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            All components
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1, maxWidth: 640 }}>
            The Material layer: {components.length} components available both as Apollo-themed MUI
            components and as Ap* wrappers.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }} useFlexGap>
            <TextField
              size="small"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              sx={{ minWidth: 260 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Chip
                label={`All (${components.length})`}
                color={selectedCategory === 'all' ? 'primary' : 'default'}
                onClick={() => setSelectedCategory('all')}
              />
              {CATEGORY_ORDER.map((category) => {
                const count = components.filter((c) => c.category === category).length;
                return (
                  <Chip
                    key={category}
                    label={`${category} (${count})`}
                    color={selectedCategory === category ? 'primary' : 'default'}
                    onClick={() => setSelectedCategory(category)}
                  />
                );
              })}
            </Stack>
          </Stack>
        </Box>
      </Box>

      <Box sx={{ px: 5, py: 5, maxWidth: 1280, mx: 'auto' }}>
        {filteredComponents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="h6">No components found</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Try adjusting your search or category filter.
            </Typography>
          </Box>
        ) : (
          CATEGORY_ORDER.map((category) => {
            const categoryComponents = filteredComponents.filter(
              (component) => component.category === category
            );
            if (categoryComponents.length === 0) {
              return null;
            }
            return (
              <Box component="section" key={category} sx={{ mb: 6 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  {category}
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'repeat(2, 1fr)',
                      sm: 'repeat(3, 1fr)',
                      lg: 'repeat(4, 1fr)',
                    },
                    gap: 2,
                  }}
                >
                  {categoryComponents.map((component) => (
                    <Box
                      key={component.name}
                      component="a"
                      href={`/?path=/story/${component.storyPath}`}
                      target="_top"
                      sx={(theme) => ({
                        display: 'block',
                        textDecoration: 'none',
                        color: 'inherit',
                        border: `1px solid ${theme.palette.semantic.colorBorderDeEmp}`,
                        borderRadius: 2,
                        overflow: 'hidden',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                        '&:hover': {
                          borderColor: theme.palette.semantic.colorBorder,
                          boxShadow: theme.shadows[2],
                        },
                      })}
                    >
                      <Box
                        sx={(theme) => ({
                          height: 140,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          p: 2,
                          overflow: 'hidden',
                          backgroundColor: theme.palette.semantic.colorBackgroundSecondary,
                          pointerEvents: 'none',
                        })}
                      >
                        {component.preview}
                      </Box>
                      <Box
                        sx={(theme) => ({
                          px: 2,
                          py: 1.5,
                          borderTop: `1px solid ${theme.palette.semantic.colorBorderDeEmp}`,
                        })}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {component.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {component.description}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}

export const Default: Story = {
  render: () => <ComponentGallery />,
};
