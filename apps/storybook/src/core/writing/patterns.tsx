import type { ReactNode } from 'react';
import {
  CopyExample,
  DoDont,
  GuideTable,
  LivePreview,
  PatternLink,
  RuleList,
  Section,
  SubSection,
  WritingPage,
  WritingTab,
  WritingTabs,
} from './writing-ui';

// Human-facing versions of the apollo-writing skill's content patterns
// (packages/apollo-wind/skills/apollo-writing). The skill files are written
// for AI agents and stay as they are; keep the rules here in step with them.
// AI and agents, Loading and progress, Onboarding, and Success confirmation
// exist only here and have no skill file yet.

interface CommonCase {
  name: string;
  guidance: string[];
  doItems?: string[];
  dontItems?: string[];
}

export interface ContentPattern {
  /** Story name and page title in the sidebar. */
  name: string;
  title: string;
  summary: string;
  appliesTo: string[];
  /** Which fields to write for each component variant. */
  fieldsByVariant?: [string, string][];
  rules: string[];
  /** Extra rule groups, shown after the main rules. */
  ruleGroups?: { title: string; rules: string[] }[];
  cases: CommonCase[];
  doDont?: { doItems: string[]; dontItems: string[] };
  example: { caption: string; fields: [string, string][] };
  related?: string[];
}

export const PATTERNS: Record<string, ContentPattern> = {
  errorMessage: {
    name: 'Error Message',
    title: 'Error messages',
    summary:
      'Error messages help people recover. Say what happened and what to do next, without blame or drama.',
    appliesTo: [
      'Inline validation and form errors',
      'Banner and toast errors',
      'Upload and permission errors',
      'System and network errors',
    ],
    fieldsByVariant: [
      ['Inline validation', 'Body only'],
      ['Toast', 'Body, plus a CTA when there is a recovery action'],
      ['Banner', 'Body, plus a CTA when there is a recovery action'],
      ['Modal or full page', 'Title, body, and CTA'],
    ],
    rules: [
      'Use sentence case.',
      'Be specific about what happened when you know the cause.',
      'Focus on what the person can do next.',
      'Keep the tone calm and neutral. Use contractions sparingly.',
      'Use "we" when the system is the actor ("We couldn\'t save your changes"). Use "your" for the person\'s content. Avoid "you" as the subject, since it can read as blame.',
      'Skip "Oops," "Uh-oh," and "Something went wrong." If the cause is truly unknown, write "We couldn\'t complete this action."',
      'Keep CTAs to 2–4 words, verb + noun where possible. Use "Try again," not "Retry."',
      'Keep inline validation errors short and direct.',
      'For page-level or system errors, pair a short title with a concise body.',
      'Include technical details only when they help someone recover.',
    ],
    cases: [
      {
        name: 'Validation error',
        guidance: ['Say what needs to be corrected.', 'Keep it short.'],
        doItems: ['Enter a valid email address.'],
      },
      {
        name: 'Permission error',
        guidance: ['Say what access is missing.', 'Point to the next step when you can.'],
      },
      {
        name: 'System or network error',
        guidance: [
          'State the problem in plain language.',
          'Offer a recovery action if one exists.',
        ],
      },
      {
        name: 'Failed action',
        guidance: ['Say that the action did not complete.', 'Make clear whether anything changed.'],
      },
    ],
    doDont: {
      doItems: [
        "We couldn't save your changes.",
        'Check your connection and try again.',
        "You don't have permission to edit.",
        'Try again in a few seconds.',
      ],
      dontItems: [
        'Oops! Something went wrong.',
        'Uh-oh! We hit a snag.',
        "You can't do this.",
        'Please try again later (code: 4592).',
        'You did something wrong. Try again.',
      ],
    },
    example: {
      caption: 'Upload error banner',
      fields: [
        ['Body', "We couldn't upload your file. Check your connection and try again."],
        ['CTA', 'Try again'],
      ],
    },
    related: ['Notification', 'Form Field'],
  },

  notification: {
    name: 'Notification',
    title: 'Notifications',
    summary:
      'Notifications tell people what happened and whether they need to act. Keep them short, specific, and calm, even when celebrating.',
    appliesTo: [
      'Success toasts',
      'Warning alerts',
      'Info banners',
      'Inline status messages',
      'Action notifications',
    ],
    fieldsByVariant: [
      ['Toast', 'Body, plus a CTA only when there is a strong next step'],
      ['Inline status', 'Body only, no CTA'],
      [
        'Banner or alert',
        'Optional title and a body, plus a CTA or link only when there is a next action',
      ],
    ],
    rules: [
      'Use sentence case.',
      'Keep notifications short, clear, and specific.',
      'Focus on what happened and what the person can do next.',
      'Keep the tone calm and neutral. Use contractions sparingly.',
      'Skip exclamation points, even in success messages. Confirm the outcome without over-celebrating.',
      'For warnings, explain the risk or consequence clearly.',
      'For info messages, keep it factual and useful.',
      "Don't repeat the same message across several surfaces.",
      'Use specific CTA labels of 2–4 words. Use "Try again," not "Retry."',
      'Use Run as a verb only. The noun is Job ("The job completed," not "The run completed").',
    ],
    cases: [
      {
        name: 'Success toast',
        guidance: [
          'Confirm that the action completed.',
          'Keep it brief.',
          'Usually no CTA, unless there is a strong next step.',
        ],
      },
      {
        name: 'Error banner',
        guidance: [
          'State what failed.',
          'Give the clearest next action.',
          'Add a CTA only if the recovery action works in place.',
        ],
      },
      {
        name: 'Warning alert',
        guidance: [
          'Explain the risk, limit, or upcoming consequence.',
          'Stay direct without sounding alarmed.',
        ],
      },
      {
        name: 'Info banner',
        guidance: [
          'Share status, policy, or system information clearly.',
          'Add a link only when the destination is specific and helpful.',
        ],
      },
      {
        name: 'Inline status',
        guidance: ['Keep it very short.', 'Match the surrounding task.', 'No CTA.'],
      },
    ],
    doDont: {
      doItems: ['Project created', 'The job completed', 'Storage is almost full'],
      dontItems: ['Project created!', 'The run completed', 'Uh-oh, storage is running out!'],
    },
    example: {
      caption: 'Sync error banner',
      fields: [
        ['Title', 'Sync failed'],
        ['Body', "We couldn't sync your changes. Check your connection and try again."],
        ['Primary CTA', 'Try again'],
      ],
    },
    related: ['Error Message'],
  },

  emptyState: {
    name: 'Empty State',
    title: 'Empty states',
    summary:
      'An empty state explains why there is nothing here yet and points to the most useful next step.',
    appliesTo: [
      'First use',
      'No search results',
      'Filters that return nothing',
      'No data yet',
      'Lists emptied by an action',
    ],
    rules: [
      'Use sentence case.',
      'Write a clear, direct title.',
      'Keep the body to 1–2 short sentences.',
      'Explain why the area is empty when that helps.',
      'Focus on the next useful action.',
      'Use specific CTAs of 2–4 words, verb + noun where possible.',
      'Use Build for automations, agents, and apps. Use Create for other objects.',
      'Make link text describe the destination. Avoid "Learn more" and "Click here."',
      'Avoid blame, filler, idioms, exclamation points, and dramatic language.',
    ],
    cases: [
      {
        name: 'First use',
        guidance: [
          'Explain what this area is for.',
          'Help the person get started with a clear creation CTA.',
        ],
      },
      {
        name: 'No results',
        guidance: ['Say that nothing matched.', 'Suggest changing the search terms or filters.'],
      },
      {
        name: 'Filtered view with no results',
        guidance: [
          'Explain that the current filters return nothing.',
          'Offer a way to reset or clear the filters.',
        ],
        doItems: ['No results match your filters. Try adjusting or clearing your filters.'],
      },
      {
        name: 'No data yet',
        guidance: ['Briefly explain why nothing appears.', 'Point to the most relevant next step.'],
      },
      {
        name: 'After an action',
        guidance: [
          'Explain that the list or area is now empty.',
          'Include a CTA only if there is a meaningful next action.',
        ],
      },
    ],
    example: {
      caption: 'First use of an automations table',
      fields: [
        ['Title', 'No automations yet'],
        ['Body', 'Build an automation to start running workflows in this workspace.'],
        ['Primary CTA', 'Build automation'],
      ],
    },
    related: ['Search and Filter', 'Button and CTA'],
  },

  buttonAndCta: {
    name: 'Button and CTA',
    title: 'Buttons and CTAs',
    summary:
      'Button labels name the action. Pick the verb that matches what happens, and keep it short.',
    appliesTo: [
      'Primary and secondary buttons',
      'Menu actions',
      'Destructive actions',
      'Recovery actions',
      'Button sets',
    ],
    rules: [
      'Use sentence case.',
      'Keep labels short and specific: 2–4 words when you can.',
      "Use verb + noun when the object isn't obvious from context.",
      'Avoid vague labels like "Click here," "Learn more," "Go," "Submit," "Confirm," or "Continue" unless they really are the clearest choice.',
      'Use Select instead of Choose for clickable choices.',
      'Use "Try again" instead of "Retry."',
      "Don't use Execute for automations or jobs.",
      'Use Run as a verb only ("Run automation"). The noun is Job.',
    ],
    ruleGroups: [
      {
        title: 'Build, Create, or Add',
        rules: [
          'Build: agents, automations, and apps.',
          "Create: new objects that didn't exist before, such as projects, users, templates, or datasets.",
          'Add: putting an existing object into an existing list, group, view, or container.',
          'Use "Create new" or "Build new" only when the button opens a menu of object types. Never use New on its own as a verb.',
        ],
      },
      {
        title: 'Delete or Remove',
        rules: [
          'Delete: permanent removal.',
          'Remove: taking something out of a list, group, or container without deleting it.',
        ],
      },
    ],
    cases: [
      {
        name: 'Primary CTA',
        guidance: [
          'Use the clearest action for the next step.',
          'Prefer a specific action over a generic "Next" or "Continue."',
        ],
      },
      {
        name: 'Secondary CTA',
        guidance: ['Use a safe supporting action such as Cancel, Back, Discard, or Clear.'],
      },
      {
        name: 'Link CTA',
        guidance: [
          'Make the destination or outcome obvious.',
          'Leave the word "link" out of the text.',
        ],
      },
      {
        name: 'Recovery CTA',
        guidance: [
          'Use Try again when an action failed and should be repeated.',
          'Make sure the surrounding copy explains what happened.',
        ],
      },
    ],
    doDont: {
      doItems: ['Build automation', 'Create project', 'Add user', 'Try again'],
      dontItems: ['Create automation', 'New project', 'Add new user', 'Retry'],
    },
    example: {
      caption: 'Button set for a new automation',
      fields: [
        ['Primary CTA', 'Build automation'],
        ['Secondary CTA', 'Cancel'],
        ['Link CTA', 'Manage access'],
      ],
    },
    related: ['Link', 'Destructive Modal'],
  },

  link: {
    name: 'Link',
    title: 'Links',
    summary:
      'Link text should tell people exactly where they are going or what will happen when they select it.',
    appliesTo: ['Inline links', 'Action links', 'Help and documentation links', 'Navigation links'],
    rules: [
      'Use sentence case.',
      'Keep link text short, clear, and specific.',
      'Make the destination, action, or outcome obvious.',
      'Leave the word "link" out. Screen readers already announce it.',
      'Avoid "Learn more," "See more," "Read more," and "Click here."',
      'Use action wording when the link starts a task, and destination wording when it opens a page, panel, or document.',
      'Use the same link text everywhere you link to the same destination.',
      "Don't repeat context that the surrounding UI already makes obvious.",
    ],
    cases: [
      {
        name: 'Inline help link',
        guidance: ['Make the topic obvious.'],
        doItems: ['Review password requirements', 'View workspace roles'],
      },
      {
        name: 'Action link',
        guidance: ['Start with a clear verb.', 'Name the object or destination when it helps.'],
      },
      {
        name: 'Documentation link',
        guidance: ['Name the policy, guide, or topic clearly.'],
      },
      {
        name: 'Navigation link',
        guidance: ['Use the destination name, or a clear action tied to it.'],
      },
      {
        name: 'Follow-up link',
        guidance: ['Tie the link to the next logical step after the surrounding message.'],
      },
    ],
    doDont: {
      doItems: [
        'View automation details',
        'Manage access',
        'Review retention policy',
        'Open job history',
      ],
      dontItems: ['Learn more', 'Click here', 'See more', 'Link to settings'],
    },
    example: {
      caption: 'Inline link in a storage banner',
      fields: [['Link text', 'Review retention policy']],
    },
    related: ['Button and CTA', 'Tabs and Navigation'],
  },

  toggleAndSelection: {
    name: 'Toggle and Selection',
    title: 'Toggles and selection controls',
    summary:
      'Selection controls need labels that say exactly what is being turned on, chosen, or assigned.',
    appliesTo: [
      'Toggle switches',
      'Checkboxes',
      'Radio groups',
      'Dropdowns',
      'People pickers',
      'Selection instructions',
    ],
    rules: [
      'Use sentence case.',
      'Keep labels short, clear, and specific, with no punctuation at the end.',
      'Use Select instead of Choose, and Clear instead of Deselect.',
      'Make sure no two options start with the same word or phrase. It slows down scanning and is confusing with a screen reader.',
    ],
    cases: [
      {
        name: 'Toggle',
        guidance: [
          'Always give the switch a label or clear surrounding context.',
          'Name the setting or behavior it turns on or off.',
          "Don't phrase the label as a question.",
          "Don't change the label when the switch changes state.",
          'Put any extra explanation in helper text.',
        ],
        doItems: ['Email notifications'],
        dontItems: ['Send me emails?', 'Notifications are on'],
      },
      {
        name: 'Checkbox',
        guidance: ['Use a short, descriptive phrase.', 'Move long explanations into helper text.'],
      },
      {
        name: 'Radio group and dropdown',
        guidance: [
          'Make the purpose obvious from the label.',
          'Keep option names short and distinct.',
        ],
      },
      {
        name: 'People picker',
        guidance: ['Add helper text for requirements such as role, email format, or access scope.'],
      },
      {
        name: 'Selection instruction',
        guidance: ['Use direct action language: "Select a workspace."'],
      },
    ],
    example: {
      caption: 'Notification setting',
      fields: [
        ['Control', 'Toggle'],
        ['Label', 'Email notifications'],
        ['Helper text', 'Send notifications when a job starts or fails.'],
      ],
    },
    related: ['Form Field'],
  },

  destructiveModal: {
    name: 'Destructive Modal',
    title: 'Destructive modals',
    summary:
      'A destructive modal asks people to confirm an action they might regret. Say exactly what will happen, then let them decide.',
    appliesTo: [
      'Delete confirmations',
      'Remove confirmations',
      'Unsaved changes and exit dialogs',
      'Access revocation',
    ],
    rules: [
      'Use sentence case.',
      'Write a direct, descriptive title, usually a question.',
      'Keep the body to 1–2 short sentences that say what will happen and any real consequence.',
      "Say the action can't be undone only when that is true.",
      'Use Delete for permanent removal and Remove for taking something out of a list, group, or container.',
      'Use specific CTAs of 2–4 words. Default the secondary CTA to Cancel.',
      'Use contractions sparingly.',
    ],
    cases: [
      {
        name: 'Permanent deletion',
        guidance: [
          'Name the action and the object in the title.',
          'Explain what will be deleted and whether it can be undone.',
          'Use Delete + object as the primary CTA when it helps.',
        ],
      },
      {
        name: 'Removal that is not deletion',
        guidance: [
          'Use Remove, not Delete.',
          'Explain what access, association, or placement changes.',
          "Don't imply permanent loss unless it's true.",
        ],
      },
      {
        name: 'Unsaved changes or leaving a flow',
        guidance: [
          'Be explicit that edits will be lost or the flow will end.',
          'Keep the consequence short and plain.',
        ],
      },
      {
        name: 'Access revocation',
        guidance: [
          'Say whose access is changing and to what.',
          'Make clear whether access can be restored.',
          'Use "Revoke access" as the primary CTA.',
        ],
      },
    ],
    example: {
      caption: 'Deleting an automation',
      fields: [
        ['Title', 'Delete this automation?'],
        [
          'Body',
          "This will permanently delete the automation and all associated logs. You can't undo this action.",
        ],
        ['Secondary CTA', 'Cancel'],
        ['Primary CTA', 'Delete automation'],
      ],
    },
    related: ['Button and CTA'],
  },

  formField: {
    name: 'Form Field',
    title: 'Form fields',
    summary:
      'Good field copy lets people fill in a form without guessing. The label does the main work; placeholder and helper text only support it.',
    appliesTo: [
      'Labels',
      'Placeholder text',
      'Helper text',
      'Inline errors',
      'Dropdowns, checkboxes, toggles, and people pickers in forms',
    ],
    rules: [
      'Use sentence case.',
      'Keep labels short and specific, with no punctuation at the end.',
      'Never use placeholder text in place of a label. It disappears on input and creates accessibility issues.',
      'Treat placeholder text as optional support. Keep essential instructions out of it, and leave off the period.',
      'Use helper text only for real guidance: examples, syntax, character counts, or constraints. Keep it to 1–2 short sentences.',
      'Keep inline errors direct and actionable, 1–2 short sentences at most.',
      'Avoid casual or vague placeholders such as "Type here" or "Enter value."',
    ],
    cases: [
      {
        name: 'Text input',
        guidance: [
          'Use a short, noun-based label.',
          "Add placeholder text only when the expected input isn't obvious from the label.",
          'Put examples or formatting help in helper text.',
        ],
      },
      {
        name: 'Dropdown',
        guidance: [
          'Make the label clear and purposeful.',
          'Keep options short and distinct, and make sure no two start with the same word.',
        ],
      },
      {
        name: 'Checkbox and toggle',
        guidance: [
          'State what the control does in a short label.',
          "Don't phrase a toggle label as a question or change it with the switch state.",
        ],
      },
      {
        name: 'People picker',
        guidance: ['Add helper text when input requirements matter for finishing the task.'],
      },
      {
        name: 'Inline error',
        guidance: [
          'Say what needs to be corrected.',
          'Place the error next to the field when possible.',
        ],
      },
    ],
    doDont: {
      doItems: ['Label: Workspace name', 'Placeholder: e.g. Finance automations'],
      dontItems: ['Label: Workspace name:', 'Placeholder used as the only label', 'Type here...'],
    },
    example: {
      caption: 'Workspace name field',
      fields: [
        ['Label', 'Workspace name'],
        ['Helper text', 'Use a name your team will recognize.'],
        ['Error', 'Enter a workspace name'],
      ],
    },
    related: ['Search and Filter', 'Error Message', 'Toggle and Selection'],
  },

  searchAndFilter: {
    name: 'Search and Filter',
    title: 'Search and filters',
    summary:
      'Search and filter copy should make clear what can be found, and what to do when nothing turns up.',
    appliesTo: [
      'Search field labels and placeholders',
      'Filter labels',
      'Filter reset actions',
      'No-results and filtered empty states',
      'Result summaries',
    ],
    rules: [
      'Use sentence case.',
      'Always label search fields. Placeholder text alone hides context and creates accessibility issues.',
      'Use the placeholder to say what can be searched, not how to type.',
      'Keep filter labels short and distinct. Use nouns, not verbs.',
      'When nothing matches, say so clearly and suggest the next step.',
      'For reset actions, use "Clear all filters" or "Reset filters."',
    ],
    cases: [
      {
        name: 'Search field',
        guidance: ['Always include a label.', 'Describe what can be searched in the placeholder.'],
        doItems: ['Search automations', 'Search by name or keyword', 'Search users and groups'],
        dontItems: ['Search...'],
      },
      {
        name: 'Filter label',
        guidance: [
          'Use a short noun or noun phrase.',
          'Keep related filter labels parallel.',
          'Make sure no two filter labels start with the same word.',
        ],
      },
      {
        name: 'No results',
        guidance: ['Say that nothing matched.', 'Suggest changing the search terms.'],
      },
      {
        name: 'Filtered view with no results',
        guidance: ['Explain that the filters returned nothing.', 'Offer a clear reset action.'],
        doItems: ['No results match your filters. Try adjusting or clearing your filters.'],
      },
      {
        name: 'Result summary',
        guidance: ['Keep it short and factual.'],
      },
      {
        name: 'Reset action',
        guidance: ['Name the action clearly.'],
        doItems: ['Clear all filters', 'Reset filters'],
        dontItems: ['Cancel', 'X'],
      },
    ],
    example: {
      caption: 'Automations list with search and filters',
      fields: [
        ['Search label', 'Search'],
        ['Search placeholder', 'Search automations and folders'],
        ['Filter label', 'Status'],
        ['Empty state title', 'No results'],
        [
          'Empty state body',
          'No results match your search or filters. Try adjusting your search term or clearing your filters.',
        ],
        ['Primary CTA', 'Clear all filters'],
      ],
    },
    related: ['Empty State', 'Form Field'],
  },

  tabsAndNavigation: {
    name: 'Tabs and Navigation',
    title: 'Tabs and navigation',
    summary:
      'Headings, tabs, and navigation labels describe places, not tasks. Use nouns that help people scan and find their way.',
    appliesTo: [
      'Page and section headings',
      'Tab labels',
      'Side navigation',
      'Breadcrumbs',
      'Menu navigation',
    ],
    rules: [
      'Use sentence case. Capitalize only proper names and branded products, not feature names.',
      'Use noun-based headings that describe the section, not what to do there.',
      'Label tabs by the content inside them.',
      'Put the most logical starting tab first, and keep related tabs next to each other.',
      'Keep navigation labels scannable and distinct from each other.',
      'Avoid "Learn more," "Click here," "View page," and "Go to..." in navigation.',
      'Use the same terms across tabs, headings, links, and navigation.',
    ],
    cases: [
      {
        name: 'Page heading',
        guidance: ['Describe the screen or content area with a noun.'],
        doItems: ['Process overview', 'Configuration details', 'Output parameters'],
        dontItems: ['Learn about processes', 'Configure the settings', 'View output'],
      },
      {
        name: 'Section heading',
        guidance: ['Use a noun that helps people scan.', 'Keep it parallel with nearby headings.'],
      },
      {
        name: 'Tabs',
        guidance: ['Keep labels short.', 'Lead with the most useful or expected tab.'],
      },
      {
        name: 'Side navigation',
        guidance: ['Name destinations, not instructions.'],
      },
      {
        name: 'Breadcrumbs',
        guidance: ['Use short destination names that match labels used elsewhere.'],
      },
      {
        name: 'Menu navigation',
        guidance: ["Use short labels, and don't repeat words the menu already implies."],
      },
    ],
    example: {
      caption: 'Project settings page',
      fields: [
        ['Page heading', 'Project settings'],
        ['Section heading', 'Access and permissions'],
        ['Tabs', 'Overview, Activity, Settings'],
        ['Navigation items', 'Projects, Automation hub'],
        ['Breadcrumb', 'Project settings'],
      ],
    },
    related: ['Link', 'Accordion and Disclosure'],
  },

  drawer: {
    name: 'Drawer',
    title: 'Drawers',
    summary:
      'Drawers hold extra content without a full change of context. The header states the purpose, and one primary action finishes the job.',
    appliesTo: ['Drawer and side panel headers', 'Section headings', 'Body copy', 'Action buttons'],
    rules: [
      'Use sentence case.',
      'Make the header state the purpose of the panel, short and specific.',
      'Group related fields under noun-based section headings so people can skim.',
      'Add body copy only when it helps. Skip instructions the fields already make clear.',
      'Keep body copy to 1–2 short sentences.',
      'Use one primary action, usually Save or Apply, and a secondary action such as Cancel or Discard when needed.',
      'Avoid vague labels like Confirm, Submit, or Continue.',
      'Use Build for agents, automations, and apps; Create for new objects; Add for existing objects; Select instead of Choose.',
    ],
    cases: [
      {
        name: 'Edit drawer',
        guidance: [
          'Use a direct header such as "Edit project settings."',
          'Use Save as the primary action.',
        ],
      },
      {
        name: 'Apply or configure drawer',
        guidance: [
          'Name the setting or configuration area in the header.',
          'Use Apply when the action applies filters, settings, or scoped changes.',
        ],
      },
      {
        name: 'Create or set up drawer',
        guidance: [
          'Name what is being created or set up.',
          'Use Create or Build only when the drawer completes the creation.',
        ],
      },
      {
        name: 'Selection drawer',
        guidance: [
          'Tell people what they are selecting.',
          'Use Select, not Choose, for the primary action.',
        ],
      },
      {
        name: 'Discarding changes',
        guidance: [
          'Use Discard only when changes will be lost.',
          'Use Cancel when the drawer just closes.',
        ],
      },
    ],
    example: {
      caption: 'Editing project settings',
      fields: [
        ['Header', 'Edit project settings'],
        ['Section heading', 'Access and permissions'],
        ['Body', 'Changes apply to all members of this project.'],
        ['Primary CTA', 'Save'],
        ['Secondary CTA', 'Cancel'],
      ],
    },
    related: ['Form Field', 'Button and CTA'],
  },

  accordionAndDisclosure: {
    name: 'Accordion and Disclosure',
    title: 'Accordions and disclosure',
    summary:
      'Expandable content needs plain, neutral labels that say what will appear when it opens.',
    appliesTo: [
      'Accordion labels',
      'Show and hide triggers',
      'Advanced settings',
      'Expandable summaries',
      'Section headings',
    ],
    rules: [
      'Use sentence case.',
      'Use clear, neutral triggers that make the hidden content obvious.',
      'Avoid playful or vague labels such as "Sneak peek," "Unlock more," or "See magic."',
      'Use noun-based section headings.',
      'Keep summary text to 1 short sentence.',
    ],
    cases: [
      {
        name: 'Expand label',
        guidance: ['Use Show, View, or Expand, and name what appears.'],
        doItems: ['Show advanced settings', 'View details', 'Expand task history'],
        dontItems: ['Sneak peek', 'Unlock more'],
      },
      {
        name: 'Collapse label',
        guidance: [
          'Keep the pair parallel: Show and Hide, View and Hide, Expand and Collapse.',
          "Don't use Close or Dismiss to collapse.",
        ],
        doItems: [
          'Show advanced settings / Hide advanced settings',
          'View details / Hide details',
          'Expand task history / Collapse task history',
        ],
      },
      {
        name: 'Advanced settings',
        guidance: ['Use a direct label. Avoid hinting at mystery, reward, or surprise.'],
      },
      {
        name: 'Summary text',
        guidance: ['Briefly describe what is inside when that helps.'],
      },
    ],
    example: {
      caption: 'Configuration section',
      fields: [
        ['Section heading', 'Configuration details'],
        ['Expand label', 'Show advanced settings'],
        ['Collapse label', 'Hide advanced settings'],
        ['Summary text', 'Review configuration options for this automation.'],
      ],
    },
    related: ['Tabs and Navigation'],
  },

  tableAndStatus: {
    name: 'Table and Status',
    title: 'Tables and status',
    summary:
      'Tables are for scanning. Keep column labels, statuses, and row actions short and consistent so the data stands out.',
    appliesTo: [
      'Column labels',
      'Status badges',
      'Row actions',
      'Timestamps and durations',
      'Empty tables',
    ],
    rules: [
      'Use sentence case.',
      'Use nouns for column labels, not actions.',
      'Keep status badges to 1–2 words, with no wrapping.',
      'Use the same terms and the same date format across the whole table, and align dates to the left.',
      'Use "Last updated" for update-time columns and "Duration" for duration columns.',
      'Use numerals for dates, times, and durations.',
      'Keep row actions specific. Use Run as a verb only; the noun is Job.',
    ],
    cases: [
      {
        name: 'Column label',
        guidance: ['Use a short noun or noun phrase.'],
        doItems: ['Status', 'Owner', 'Last updated', 'Duration'],
        dontItems: ['Check status', 'Execution time'],
      },
      {
        name: 'Status badge',
        guidance: ['Keep it to 1–2 words, distinct from nearby statuses.'],
        doItems: ['In progress', 'Failed', 'Completed'],
      },
      {
        name: 'Last updated values',
        guidance: [
          'Show relative time for updates in the last 24 hours, then switch to absolute time.',
          'When a cell shows relative time, show the absolute date and time in a tooltip.',
          'Use absolute time in logs and detail tables where precision matters.',
        ],
        doItems: [
          'Updated just now',
          'Updated 5 minutes ago',
          'Updated May 30, 2025',
          'Updated May 30, 2025 at 4:12 PM',
        ],
        dontItems: ['Updated recently', 'Last modified', 'Date of change'],
      },
      {
        name: 'Duration',
        guidance: [
          'Exact: 2h 15m 30s. Rounded: 2.25 hrs, with the exact time in a tooltip.',
          'Show up to three units in a row, starting with the largest.',
          'Never mix hours, minutes, and seconds with years, weeks, and days.',
        ],
      },
      {
        name: 'Row action',
        guidance: [
          'Use clear verbs from the platform terminology: Build, Create, Add, Remove, Delete, Select, Clear, Try again.',
        ],
      },
      {
        name: 'Empty table',
        guidance: [
          'Say whether the table is empty because nothing exists yet or because search or filters returned nothing.',
        ],
      },
    ],
    example: {
      caption: 'Automations table',
      fields: [
        ['Column label', 'Last updated'],
        ['Status badge', 'In progress'],
        ['Row action', 'Manage access'],
        ['Timestamp format', 'Relative in the cell, absolute on hover'],
        ['Duration label', 'Duration'],
        ['Empty state title', 'No automations yet'],
        ['Empty state body', 'Build an automation to start running workflows in this workspace.'],
      ],
    },
    related: ['Date, Time, and Duration', 'Empty State'],
  },

  dateTimeAndDuration: {
    name: 'Date, Time, and Duration',
    title: 'Dates, times, and durations',
    summary:
      'Consistent date and time formats help people compare events quickly. Pick relative or absolute time based on whether speed or precision matters more.',
    appliesTo: [
      'Timestamp labels',
      'Relative and absolute time',
      'Duration labels',
      'Date picker helper text',
      'Time columns in tables',
    ],
    rules: [
      'Use sentence case and numerals.',
      'Use relative time for scanning recent activity, and absolute time when people need precision.',
      'When relative time appears in a table or list, show the absolute date and time with the time zone in a tooltip.',
      'Use one format throughout an experience. In tables, align dates to the left.',
    ],
    ruleGroups: [
      {
        title: 'Date format',
        rules: [
          'Format: ddd, MMM D, YYYY (Mon, Dec 12, 2023).',
          'No leading zero on the day. You can leave out the year for dates in the current year.',
          'Use the full date in cards and wherever space allows.',
        ],
      },
      {
        title: 'Time format',
        rules: [
          'Format: H:MM AM/PM time zone (4:12 PM UTC).',
          'No leading zero on the hour; always a leading zero on minutes.',
          'Put a space before AM or PM, with no periods.',
          'Always include the time zone.',
          'Noon and midnight can be "Noon" and "Midnight," or "12 PM" and "12 AM."',
        ],
      },
      {
        title: 'Duration format',
        rules: [
          'Call it Duration, not execution time or throughput time.',
          'Exact: 2h 15m 30s, always with the unit after the number.',
          'Rounded: 2.25 hrs, with at most two decimal places and the exact time in a tooltip.',
          'Show up to three units in a row, starting with the largest (1h 00m 30s, not 1h 30s).',
          'Never mix hours, minutes, and seconds with years, weeks, and days.',
        ],
      },
    ],
    cases: [
      {
        name: 'Last updated',
        guidance: [
          'Use "Last updated" as the label.',
          'Show relative time for the last 24 hours, then absolute time.',
        ],
        doItems: ['Updated just now', 'Updated 1 hour ago', 'Updated May 30, 2025 at 4:12 PM'],
        dontItems: ['Updated recently', 'Last modified', 'Date of change'],
      },
      {
        name: 'Logs and audit trails',
        guidance: [
          'Use absolute time so back-to-back events are easy to tell apart.',
          'Show seconds and the time zone when needed.',
        ],
      },
      {
        name: 'Date picker helper text',
        guidance: ['Add helper text only for input guidance, constraints, or format.'],
      },
      {
        name: 'Scheduled dates',
        guidance: ['Say what the date represents, such as Start date or End time.'],
      },
      {
        name: 'Timestamp tooltip',
        guidance: ['Format: Month D, YYYY at H:MM AM/PM time zone.'],
        doItems: ['December 12, 2025 at 4:12 PM UTC'],
      },
    ],
    example: {
      caption: 'Last updated column',
      fields: [
        ['Label', 'Last updated'],
        [
          'Format',
          'Relative time in the cell for the last 24 hours, absolute date and time on hover. Absolute time in logs and detail views.',
        ],
        ['Tooltip', 'December 12, 2025 at 4:12 PM UTC'],
      ],
    },
    related: ['Table and Status', 'Tooltip'],
  },

  tooltip: {
    name: 'Tooltip',
    title: 'Tooltips',
    summary:
      'Tooltips add short, optional context. If people need the information to finish a task, it belongs somewhere they will always see it.',
    appliesTo: [
      'Icon buttons',
      'Truncated values',
      'Relative timestamps',
      'Status indicators',
      'Inline guidance',
    ],
    rules: [
      'Use sentence case.',
      'Use tooltips only for short, plain-text, nonessential context. Never for critical information, errors, long explanations, images, or interactive content.',
      'Keep most tooltips to about 2 lines. Lists can run longer if each line is 1–2 words.',
      'Keep icon button tooltips to 1–2 words.',
      "Don't repeat the label or copy of the element it belongs to.",
      'If the information is essential, move it to helper text.',
    ],
    cases: [
      {
        name: 'Icon button',
        guidance: ['Use a short action or noun phrase.'],
        doItems: ['Copy', 'Settings', 'Download logs'],
      },
      {
        name: 'Truncated value',
        guidance: ['Show the full value exactly, without extra explanation.'],
      },
      {
        name: 'Timestamp',
        guidance: ['Show the absolute date and time, always with the time zone.'],
        doItems: ['December 12, 2025 at 4:12 PM UTC'],
      },
      {
        name: 'Inline guidance',
        guidance: [
          'Add brief help only when it is nonessential.',
          'If people need it to complete the task, use helper text instead.',
        ],
      },
      {
        name: 'Status',
        guidance: ['Clarify the status in a short, concrete phrase.'],
      },
    ],
    example: {
      caption: 'Relative timestamp in a table',
      fields: [['Tooltip', 'December 12, 2025 at 4:12 PM UTC']],
    },
    related: ['Date, Time, and Duration', 'Form Field'],
  },

  aiAndAgents: {
    name: 'AI and Agents',
    title: 'AI and agents',
    summary:
      'Copy for AI features and agents should be honest about what the AI did, clear about what it is doing now, and careful before it acts for someone.',
    appliesTo: [
      'Autopilot and chat responses',
      'Labels for AI-generated content',
      'Thinking and progress states',
      'Prompt suggestions',
      'Confirmations before an agent acts',
      'AI errors and disclaimers',
    ],
    rules: [
      'Use sentence case.',
      'Label AI-generated content so people know where it came from.',
      'Remind people to review AI output before they rely on it, especially for important decisions.',
      'Describe what the AI is doing in plain, present-tense words: "Searching your documents."',
      'Ask before an agent takes an action with real consequences, and name the action and its scope.',
      'Keep responses direct. Avoid claims of feelings, opinions, or certainty the system does not have.',
      'Avoid hype such as "magic," "smart," or "intelligent." Say what the feature does.',
      'Show sources when the AI uses them, and name each source in the link text.',
      'Use platform terms: Build agents, Run automations, and call each performance a Job.',
    ],
    cases: [
      {
        name: 'Generated content label',
        guidance: ['Use a short, consistent label next to the content.'],
        doItems: ['AI-generated'],
        dontItems: ['Created by our smart assistant', 'Magic summary'],
      },
      {
        name: 'Thinking and progress',
        guidance: [
          'Say what is happening, not just that something is happening.',
          'An ellipsis is fine for ongoing actions.',
        ],
        doItems: ['Searching your documents...', 'Reading 12 invoices...'],
        dontItems: ['Thinking really hard...', 'Doing some magic...'],
      },
      {
        name: 'Prompt suggestions',
        guidance: [
          'Start with a verb, keep each one short, and tie it to the current context.',
          'Make sure no two suggestions start with the same word.',
        ],
        doItems: ['Summarize overdue invoices', 'Draft a reminder email'],
        dontItems: ['Ask me anything!', 'Try something cool'],
      },
      {
        name: 'Confirming an action',
        guidance: [
          'Name what the agent will do and how many items it affects.',
          'Use a specific primary CTA, and Cancel as the secondary.',
        ],
        doItems: ['Send email to 12 vendors?'],
        dontItems: ['Are you sure?', 'Proceed?'],
      },
      {
        name: 'AI errors',
        guidance: [
          'Say what failed and what to try next, like any other error.',
          'Skip apologies written as if the AI had feelings.',
        ],
        doItems: ["We couldn't generate a summary. Try again or shorten your request."],
        dontItems: ["Sorry, I'm having trouble thinking right now."],
      },
      {
        name: 'Disclaimers',
        guidance: [
          'Keep them to one short sentence, placed where people read the output.',
          "Don't repeat the disclaimer on every message.",
        ],
        doItems: ['AI can make mistakes. Review the results before you act on them.'],
      },
    ],
    example: {
      caption: 'Autopilot answer',
      fields: [
        ['Thinking state', 'Searching your documents'],
        ['Label', 'AI-generated'],
        ['Response', 'Invoices from 3 vendors are overdue. The largest is $12,400 from Contoso.'],
        ['Disclaimer', 'AI can make mistakes. Review the results before you act on them.'],
        ['Suggestions', 'Summarize overdue invoices, Draft a reminder email'],
      ],
    },
    related: ['Loading and Progress', 'Error Message', 'Destructive Modal'],
  },

  loadingAndProgress: {
    name: 'Loading and Progress',
    title: 'Loading and progress',
    summary:
      'Loading copy tells people what is happening and how long to expect. The longer the wait, the more they need to know.',
    appliesTo: [
      'Spinners and page loaders',
      'Progress bars',
      'Long-running operations and background jobs',
      'Skeleton screens',
    ],
    rules: [
      'Use sentence case.',
      'Say what is loading or happening: "Loading automations," not "Loading" or "Please wait."',
      'Use an ellipsis only for actions that are still in progress, and leave it off finished states.',
      'Use numerals for counts and percentages: "Uploading 3 of 5 files," "60%."',
      'For waits longer than a few seconds, show progress and say whether people can leave the page.',
      'Don\'t promise timing you can\'t keep, such as "Almost done."',
      'Give spinners and skeletons an accessible label even when no text shows.',
    ],
    cases: [
      {
        name: 'Short wait',
        guidance: ['A spinner with a short label is enough.'],
        doItems: ['Loading automations', 'Saving changes...'],
        dontItems: ['Please wait', 'Hang tight!'],
      },
      {
        name: 'Measurable progress',
        guidance: [
          'Show a progress bar with a count or percentage.',
          'Name the item being processed when it helps.',
        ],
        doItems: ['Uploading 3 of 5 files'],
      },
      {
        name: 'Long-running operation',
        guidance: [
          'Tell people they can leave and how they will hear back.',
          'Link to where they can check status later.',
        ],
        doItems: ["You can leave this page. We'll notify you when the upload is done."],
      },
      {
        name: 'Skeleton screens',
        guidance: [
          'No visible text is needed, but give the region an accessible label such as "Loading jobs."',
        ],
      },
      {
        name: 'Loading failed',
        guidance: ['Switch to an error message with a recovery action.'],
        doItems: ["We couldn't load your automations. Try again."],
      },
    ],
    example: {
      caption: 'File upload',
      fields: [
        ['Spinner label', 'Loading automations'],
        ['Progress label', 'Uploading 3 of 5 files'],
        ['Progress value', '60%'],
        ['Helper text', "You can leave this page. We'll notify you when the upload is done."],
      ],
    },
    related: ['Error Message', 'Success Confirmation', 'AI and Agents'],
  },

  onboarding: {
    name: 'Onboarding',
    title: 'Onboarding',
    summary:
      'Onboarding copy helps people get value quickly. Focus on the next useful step, keep each step short, and always let people skip.',
    appliesTo: [
      'Welcome messages',
      'Guided tours and coach marks',
      'Setup checklists',
      'New feature announcements',
    ],
    rules: [
      'Use sentence case.',
      'Lead with what people can do, not with what the feature is called.',
      'Cover one idea per step, in 1–2 short sentences.',
      'Show where people are in a sequence: "Step 2 of 3."',
      'In tours, Next, Back, and Done are clear enough. Always offer a way out, such as "Skip tour."',
      'A greeting can have one exclamation point. Nothing else should.',
      'Avoid calling tasks "simple," "easy," or "quick."',
      'For new features, say what changed and why it helps. Skip the hype.',
    ],
    cases: [
      {
        name: 'Welcome message',
        guidance: ['Greet people, then point to the first useful action.'],
        doItems: ['Hi, Daniel! Build your first automation to get started.'],
        dontItems: ['Welcome to the amazing world of automation!!'],
      },
      {
        name: 'Guided tour step',
        guidance: [
          'Title the step with the task, using a verb.',
          'Keep the body to one or two sentences.',
        ],
        doItems: ['Add a trigger', 'Set when your automation starts.'],
      },
      {
        name: 'Setup checklist',
        guidance: [
          'Start each item with a verb.',
          'Mark completed items clearly, and let people come back later.',
        ],
        doItems: ['Connect an app', 'Add a trigger', 'Run a test job'],
      },
      {
        name: 'New feature announcement',
        guidance: [
          'Say what is new and what people can now do.',
          'Link to the feature itself, not just to documentation.',
        ],
        doItems: ['You can now schedule jobs from the automation page.'],
        dontItems: ['Introducing our revolutionary new scheduler!'],
      },
    ],
    example: {
      caption: 'Guided tour, second step',
      fields: [
        ['Title', 'Build your first automation'],
        ['Body', 'Connect an app, add a trigger, and run a test job.'],
        ['Step indicator', 'Step 2 of 3'],
        ['Buttons', 'Skip tour, Back, Next'],
      ],
    },
    related: ['Empty State', 'Button and CTA'],
  },

  successConfirmation: {
    name: 'Success Confirmation',
    title: 'Success confirmations',
    summary:
      'A success message confirms that something worked. Keep it short, name what happened, and offer a next step only when it helps.',
    appliesTo: [
      'Success toasts',
      'Inline confirmations',
      'Success pages at the end of a flow',
      'Undo prompts',
    ],
    rules: [
      'Use sentence case.',
      'Name the object and the outcome, usually in past tense: "Automation published."',
      'Skip exclamation points and celebration words such as "Awesome" or "Woohoo."',
      'Add a CTA only when there is a likely next step, such as viewing the result.',
      'Offer Undo for actions that can be reversed, and keep the toast visible long enough to use it.',
      "Don't confirm actions whose result is already visible on screen.",
      'For the end of a longer flow, use a short title, one sentence on what happens next, and a clear CTA.',
    ],
    cases: [
      {
        name: 'Success toast',
        guidance: ['Object + outcome, with no period.'],
        doItems: ['Automation published', 'Project created', '3 users added'],
        dontItems: ['Success!', 'Awesome, your automation was published!'],
      },
      {
        name: 'Undo',
        guidance: ['Pair the confirmation with an Undo action.'],
        doItems: ['2 files deleted. Undo'],
      },
      {
        name: 'Success page',
        guidance: [
          'Title with the outcome, then say what happens next.',
          'Offer the most likely next action as the primary CTA.',
        ],
        doItems: ['Your automation is live', 'It will run every weekday at 9:00 AM UTC.'],
      },
    ],
    example: {
      caption: 'Publishing an automation',
      fields: [
        ['Toast', 'Automation published'],
        ['Link CTA', 'View automation'],
      ],
    },
    related: ['Notification', 'Loading and Progress'],
  },
};

/** Full page for one content pattern, with an optional live rendering of its example. */
export function PatternPage({
  pattern,
  preview,
}: {
  pattern: ContentPattern;
  preview?: ReactNode;
}) {
  return (
    <WritingPage title={pattern.title} intro={pattern.summary}>
      <WritingTabs>
        <WritingTab label="Overview">
          <Section title="Example">
            {preview && <LivePreview>{preview}</LivePreview>}
            <CopyExample caption={pattern.example.caption} fields={pattern.example.fields} />
          </Section>

          <Section title="Use it for">
            <RuleList rules={pattern.appliesTo} />
          </Section>

          {pattern.fieldsByVariant && (
            <Section title="What to include">
              <GuideTable columns={['Component', 'Fields']} rows={pattern.fieldsByVariant} />
            </Section>
          )}

          {pattern.related && (
            <Section title="Related patterns">
              <RuleList
                rules={pattern.related.map((story) => <PatternLink key={story} story={story} />)}
              />
            </Section>
          )}
        </WritingTab>

        <WritingTab label="Rules">
          <Section title="Rules">
            <RuleList rules={pattern.rules} />
            {pattern.ruleGroups?.map((group) => (
              <SubSection key={group.title} title={group.title}>
                <RuleList rules={group.rules} />
              </SubSection>
            ))}
          </Section>

          {pattern.doDont && (
            <Section title="Do and don't">
              <DoDont doItems={pattern.doDont.doItems} dontItems={pattern.doDont.dontItems} />
            </Section>
          )}
        </WritingTab>

        <WritingTab label="Examples">
          <Section title="Common cases">
            {pattern.cases.map((c) => (
              <SubSection key={c.name} title={c.name}>
                <RuleList rules={c.guidance} />
                {(c.doItems || c.dontItems) && (
                  <DoDont doItems={c.doItems} dontItems={c.dontItems} />
                )}
              </SubSection>
            ))}
          </Section>
        </WritingTab>
      </WritingTabs>
    </WritingPage>
  );
}
