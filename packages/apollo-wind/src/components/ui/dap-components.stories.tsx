import MonacoEditor from '@monaco-editor/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AtSign,
  Bold,
  Braces,
  ChevronDown,
  CircleAlert,
  CirclePlus,
  Code2,
  ExternalLink,
  Folder,
  FolderCog,
  Info,
  Lightbulb,
  Maximize,
  MoreVertical,
  Paperclip,
  Plus,
  SlidersHorizontal,
  Trash2,
  Type,
  UserRound,
  WandSparkles,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import gmailIconUrl from '../../../../apollo-ui-icons/src/svg/third-party/google-gmail.svg?url';
import { apolloFutureLightMonaco } from '../../editor-themes';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';
import { Alert, AlertDescription } from './alert';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { Combobox } from './combobox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from './input-group';
import { Label } from './label';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { PromptEditor } from './prompt-editor';
import type { PromptEditorAutoCompleteOption, PromptEditorToken } from './prompt-editor/types';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Search } from './search';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

interface PropertyRow {
  id: string;
  label: string;
  type?: string;
  direction?: string;
  kind: 'property' | 'group';
  level?: number;
  selected: boolean;
}

const initialRows: PropertyRow[] = [
  {
    id: 'save-as-draft',
    label: 'Save as draft',
    type: 'Boolean',
    direction: 'In',
    kind: 'property',
    selected: true,
  },
  { id: 'message', label: 'message', kind: 'group', selected: false },
  {
    id: 'subject',
    label: 'Subject',
    type: 'String',
    direction: 'In',
    kind: 'property',
    level: 1,
    selected: true,
  },
  { id: 'body-group', label: 'body', kind: 'group', selected: false },
  {
    id: 'body',
    label: 'Body',
    type: 'String',
    direction: 'In',
    kind: 'property',
    level: 1,
    selected: true,
  },
  {
    id: 'content-type',
    label: 'Message body content type',
    type: 'String',
    direction: 'In',
    kind: 'property',
    level: 1,
    selected: false,
  },
  {
    id: 'reply-to',
    label: 'Reply to',
    type: 'String',
    direction: 'In',
    kind: 'property',
    selected: true,
  },
  {
    id: 'importance',
    label: 'Importance',
    type: 'String',
    direction: 'In',
    kind: 'property',
    selected: true,
  },
];

function PropertyIcon({ kind }: Pick<PropertyRow, 'kind'>) {
  if (kind === 'group') {
    return <Braces aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />;
  }

  return <Type aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />;
}

function ManagePropertiesExample() {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState(initialRows);

  const visibleRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return rows;
    return rows.filter((row) => row.label.toLowerCase().includes(normalizedQuery));
  }, [query, rows]);

  function toggleRow(id: string) {
    setRows((currentRows) =>
      currentRows.map((row) => (row.id === id ? { ...row, selected: !row.selected } : row))
    );
  }

  const selectedCount = rows.filter((row) => row.selected).length;

  function toggleAllRows() {
    const nextSelected = selectedCount !== rows.length;
    setRows((currentRows) => currentRows.map((row) => ({ ...row, selected: nextSelected })));
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-lg">
      <div className="flex min-h-[680px] flex-col">
        <div className="flex-1 px-6 py-7 sm:px-10 sm:py-9">
          <header className="max-w-2xl">
            <h3 className="text-2xl font-semibold tracking-tight">Manage properties</h3>
            <p className="mt-3 text-base text-muted-foreground">
              Select additional fields for the current object.
            </p>
          </header>

          <div className="mt-8 max-w-sm">
            <Search
              aria-label="Search properties"
              className="h-10"
              onChange={setQuery}
              placeholder="Search"
              showClearButton
              value={query}
            />
          </div>

          <div className="mt-5 overflow-hidden rounded-md border">
            <Table>
              <TableHeader className="bg-muted/70">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-14 bg-transparent">
                    <Checkbox
                      aria-label="Select all properties"
                      checked={selectedCount === rows.length ? true : 'indeterminate'}
                      onCheckedChange={toggleAllRows}
                    />
                  </TableHead>
                  <TableHead className="bg-transparent font-semibold text-foreground">
                    Display name
                  </TableHead>
                  <TableHead className="hidden w-48 bg-transparent font-semibold text-foreground sm:table-cell">
                    Data type
                  </TableHead>
                  <TableHead className="hidden w-32 bg-transparent font-semibold text-foreground md:table-cell">
                    In/Out
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((row) => (
                  <TableRow key={row.id} className={row.kind === 'group' ? 'bg-muted/35' : ''}>
                    <TableCell className="w-14 py-3.5">
                      <Checkbox
                        aria-label={`${row.selected ? 'Deselect' : 'Select'} ${row.label}`}
                        checked={row.selected}
                        onCheckedChange={() => toggleRow(row.id)}
                      />
                    </TableCell>
                    <TableCell className="py-3.5 font-medium">
                      <div
                        className="flex items-center gap-2.5"
                        style={{ paddingLeft: row.level ? `${row.level * 40}px` : undefined }}
                      >
                        {row.kind === 'group' && (
                          <ChevronDown
                            aria-hidden="true"
                            className="size-4 shrink-0 text-muted-foreground"
                          />
                        )}
                        <PropertyIcon kind={row.kind} />
                        <span>{row.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden py-3.5 text-muted-foreground sm:table-cell">
                      {row.type}
                    </TableCell>
                    <TableCell className="hidden py-3.5 text-muted-foreground md:table-cell">
                      {row.direction}
                    </TableCell>
                  </TableRow>
                ))}
                {visibleRows.length === 0 && (
                  <TableRow>
                    <TableCell className="h-28 text-center text-muted-foreground" colSpan={4}>
                      No properties match “{query}”.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t bg-background px-6 py-5 sm:flex-row sm:justify-end sm:px-10">
          <Button variant="outline">Cancel</Button>
          <Button>Update fields</Button>
        </footer>
      </div>
    </div>
  );
}

interface ValueSourceMenuProps {
  onClear?: () => void;
}

function ValueSourceMenu({ onClear }: ValueSourceMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <InputGroupButton
          aria-label="Configure value"
          className="h-full rounded-none border-l px-3"
          icon
          title="Configure value"
        >
          <SlidersHorizontal />
        </InputGroupButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal text-muted-foreground">Use</DropdownMenuLabel>
        <DropdownMenuItem>
          <Braces />
          Variables
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Code2 />
          Expression editor
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onClear}>
          <Trash2 />
          Clear value
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SubjectFieldExample() {
  const [subject, setSubject] = useState('');

  return (
    <div className="rounded-xl border bg-background p-6 shadow-sm sm:p-10">
      <div className="flex flex-col gap-2">
        <Label className="text-base font-semibold" htmlFor="dap-subject">
          Subject
        </Label>
        <InputGroup className="future:rounded-lg">
          <InputGroupInput
            id="dap-subject"
            onChange={(event) => setSubject(event.target.value)}
            placeholder="The subject of the email"
            value={subject}
          />
          <InputGroupAddon align="inline-end" className="-my-1 gap-0 self-stretch">
            <InputGroupButton
              aria-label="Insert variable"
              className="h-full rounded-none border-l px-3"
              icon
              onClick={() => setSubject((value) => `${value}{{variable}}`)}
              title="Insert variable"
            >
              <AtSign />
            </InputGroupButton>
            <ValueSourceMenu onClear={() => setSubject('')} />
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  );
}

function BooleanPropertyOptionsExample() {
  const [includeDetails, setIncludeDetails] = useState('false');
  const [replyTo, setReplyTo] = useState('');

  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
      <div className="p-6 sm:p-10">
        <div className="flex flex-col gap-3">
          <Label className="text-base font-semibold">Include message details</Label>
          <RadioGroup
            aria-label="Include message details"
            className="flex flex-wrap gap-x-10 gap-y-3"
            onValueChange={setIncludeDetails}
            value={includeDetails}
          >
            <label
              className="flex cursor-pointer items-center gap-2.5 text-base"
              htmlFor="details-true"
            >
              <RadioGroupItem id="details-true" value="true" />
              True
            </label>
            <label
              className="flex cursor-pointer items-center gap-2.5 text-base"
              htmlFor="details-false"
            >
              <RadioGroupItem id="details-false" value="false" />
              False
            </label>
          </RadioGroup>
        </div>

        <div className="flex justify-center py-9">
          <Button className="gap-2" variant="link">
            <CirclePlus className="size-4" />
            Manage properties
          </Button>
        </div>
      </div>

      <div className="border-y bg-muted/60 px-5 py-2.5 text-sm font-semibold">Options</div>

      <div className="p-6 sm:p-10">
        <div className="flex flex-col gap-2">
          <Label className="text-base font-semibold" htmlFor="dap-reply-to">
            Reply to
          </Label>
          <InputGroup className="future:rounded-lg">
            <InputGroupInput
              id="dap-reply-to"
              onChange={(event) => setReplyTo(event.target.value)}
              placeholder="Reply-to address"
              value={replyTo}
            />
            <InputGroupAddon align="inline-end" className="-my-1 gap-0 self-stretch">
              <InputGroupButton
                aria-label="Insert variable"
                className="h-full rounded-none border-l px-3"
                icon
                onClick={() => setReplyTo((value) => `${value}{{variable}}`)}
                title="Insert variable"
              >
                <AtSign />
              </InputGroupButton>
              <ValueSourceMenu onClear={() => setReplyTo('')} />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
    </div>
  );
}

function AttachmentFieldsExample() {
  const [attachment, setAttachment] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  return (
    <div className="rounded-xl border bg-background p-6 shadow-sm sm:p-10">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Label className="text-base font-semibold" htmlFor="dap-attachment">
            Attachment
          </Label>
          <InputGroup className="future:rounded-lg">
            <InputGroupInput
              id="dap-attachment"
              onChange={(event) => setAttachment(event.target.value)}
              placeholder="The file to attach to the email"
              value={attachment}
            />
            <InputGroupAddon align="inline-end" className="-my-1 gap-0 self-stretch">
              <InputGroupButton
                aria-label="Insert variable"
                className="h-full rounded-none border-l px-3"
                icon
                onClick={() => setAttachment((value) => `${value}{{variable}}`)}
                title="Insert variable"
              >
                <AtSign />
              </InputGroupButton>
              <ValueSourceMenu onClear={() => setAttachment('')} />
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-base font-semibold" htmlFor="dap-image-url">
            Image URL
          </Label>
          <InputGroup className="future:rounded-lg">
            <InputGroupInput
              id="dap-image-url"
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="The URL of the secondary image attachment to be shared as part of the message"
              value={imageUrl}
            />
            <InputGroupAddon align="inline-end" className="-my-1 gap-0 self-stretch">
              <InputGroupButton
                aria-label="Insert variable"
                className="h-full rounded-none border-l px-3"
                icon
                onClick={() => setImageUrl((value) => `${value}{{variable}}`)}
                title="Insert variable"
              >
                <AtSign />
              </InputGroupButton>
              <ValueSourceMenu onClear={() => setImageUrl('')} />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
    </div>
  );
}

function RichTextBodyExample() {
  const [body, setBody] = useState<PromptEditorToken[]>([]);
  const variables: PromptEditorAutoCompleteOption[] = [
    { type: 'input', value: 'vars.recipientName' },
    { type: 'input', value: 'vars.orderNumber' },
    { type: 'resource', value: 'resource.supportEmail' },
  ];

  return (
    <div className="rounded-xl border bg-background p-6 shadow-sm sm:p-10">
      <div className="flex flex-col gap-2">
        <Label className="text-base font-semibold">Body</Label>
        <PromptEditor
          ariaLabel="Body"
          autoCompleteOptions={variables}
          maxRows={10}
          minRows={5}
          onChange={setBody}
          placeholder="The body of the email. Type $ to insert a variable."
          showToolbar
          value={body}
        />
      </div>
    </div>
  );
}

const emailFolders = [
  'Archive',
  'Conversation History',
  'Deleted Items',
  'Drafts',
  'Inbox',
  'Junk Email',
  'Outbox',
  'Promotions',
];

function FolderPickerExample() {
  const [selectedFolder, setSelectedFolder] = useState<string>();

  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-lg">
      <div className="border-b px-6 py-5">
        <h3 className="text-xl font-semibold">Root folder</h3>
      </div>

      <ul aria-label="Email folders" className="flex flex-col py-2">
        {emailFolders.map((folder) => (
          <li key={folder}>
            <Button
              aria-pressed={selectedFolder === folder}
              className="h-12 w-full justify-start rounded-none px-6 text-base font-normal"
              onClick={() => setSelectedFolder(folder)}
              variant={selectedFolder === folder ? 'secondary' : 'ghost'}
            >
              <Folder aria-hidden="true" className="mr-3 size-5" />
              <span className="flex-1 text-left">{folder}</span>
              <ChevronDown aria-hidden="true" className="size-4 -rotate-90" />
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex flex-col-reverse gap-3 border-t px-6 py-5 sm:flex-row sm:justify-end">
        <Button disabled={!selectedFolder}>Save</Button>
        <Button variant="outline">Cancel</Button>
      </div>
    </div>
  );
}

const users = [
  {
    value: 'avery-example',
    label: 'Avery Example - avery@example.com - USER-001',
  },
  {
    value: 'blake-example',
    label: 'Blake Example - blake@example.com - USER-002',
  },
  { value: 'casey-example', label: 'Casey Example - casey@example.com - USER-003' },
  { value: 'devon-example', label: 'Devon Example - devon@example.com - USER-004' },
  { value: 'ellis-example', label: 'Ellis Example - ellis@example.com - USER-005' },
  { value: 'frankie-example', label: 'Frankie Example - frankie@example.com - USER-006' },
  { value: 'gray-example', label: 'Gray Example - gray@example.com - USER-007' },
];

function UserComboboxExample() {
  const [user, setUser] = useState('anurag-krishna');

  return (
    <div className="rounded-xl border bg-background p-6 shadow-sm sm:p-10">
      <div className="flex flex-col gap-2">
        <Label className="text-base font-semibold">
          User <span className="text-primary">*</span>
        </Label>
        <div className="flex w-full items-stretch">
          <Combobox
            className="min-w-0 flex-1 rounded-r-none future:rounded-r-none"
            emptyText="No users found."
            items={users}
            onValueChange={setUser}
            placeholder="Select a user"
            searchPlaceholder="Search users..."
            value={user}
          />
          <Button
            aria-label="Clear selected user"
            className="rounded-none border-l-0 px-3 future:rounded-none"
            disabled={!user}
            onClick={() => setUser('')}
            variant="outline"
          >
            <X className="size-4" />
          </Button>
          <div className="flex h-9 items-stretch rounded-r-md border border-l-0 future:h-10 future:rounded-r-xl">
            <ValueSourceMenu onClear={() => setUser('')} />
          </div>
        </div>
        {!user && <p className="text-sm text-destructive">Select a user.</p>}
      </div>
    </div>
  );
}

interface MatchModeControlProps {
  value: 'all' | 'any';
  onChange: (value: 'all' | 'any') => void;
}

function MatchModeControl({ value, onChange }: MatchModeControlProps) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border">
      <Button
        className="rounded-none border-0"
        onClick={() => onChange('all')}
        variant={value === 'all' ? 'secondary' : 'ghost'}
      >
        All (AND)
      </Button>
      <Button
        className="rounded-none border-0 border-l"
        onClick={() => onChange('any')}
        variant={value === 'any' ? 'secondary' : 'ghost'}
      >
        Any (OR)
      </Button>
    </div>
  );
}

interface FilterConditionRowProps {
  id: string;
}

function FilterConditionRow({ id }: FilterConditionRowProps) {
  const [value, setValue] = useState('');

  return (
    <div className="grid items-center gap-3 lg:grid-cols-[auto_minmax(180px,1fr)_minmax(160px,0.55fr)_minmax(240px,1fr)_auto]">
      <Checkbox aria-label={`Select condition ${id}`} />
      <Select defaultValue="bcc">
        <SelectTrigger aria-label="Field">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bcc">BCC (email)</SelectItem>
          <SelectItem value="cc">CC (email)</SelectItem>
          <SelectItem value="subject">Subject</SelectItem>
          <SelectItem value="sender">Sender</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="contains">
        <SelectTrigger aria-label="Operator">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="contains">Within Contains</SelectItem>
          <SelectItem value="equals">Equals</SelectItem>
          <SelectItem value="starts-with">Starts with</SelectItem>
        </SelectContent>
      </Select>
      <InputGroup className="future:rounded-lg">
        <InputGroupInput
          aria-label="Condition value"
          onChange={(event) => setValue(event.target.value)}
          placeholder="Enter text or press Ctrl + Space"
          value={value}
        />
        <InputGroupAddon align="inline-end" className="-my-1 gap-0 self-stretch">
          <InputGroupButton
            aria-label="Insert variable"
            className="h-full rounded-none border-l px-3"
            icon
            onClick={() => setValue((current) => `${current}{{variable}}`)}
          >
            <AtSign />
          </InputGroupButton>
          <ValueSourceMenu onClear={() => setValue('')} />
        </InputGroupAddon>
      </InputGroup>
      <Button aria-label="Condition actions" icon variant="ghost">
        <MoreVertical className="size-4" />
      </Button>
    </div>
  );
}

function FilterBuilderExample() {
  const [rootMode, setRootMode] = useState<'all' | 'any'>('any');
  const [nestedMode, setNestedMode] = useState<'all' | 'any'>('all');
  const [nestedConditions, setNestedConditions] = useState(['nested-1']);

  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-lg">
      <div className="p-6 sm:p-10">
        <h3 className="text-2xl font-semibold">Filter builder</h3>

        <div className="mt-8 flex flex-col gap-5 border-l-2 border-muted pl-5">
          <div className="flex flex-wrap items-center gap-3">
            <Checkbox aria-label="Select root group" />
            <MatchModeControl onChange={setRootMode} value={rootMode} />
            <span className="text-sm text-muted-foreground">of the conditions are met:</span>
          </div>

          <FilterConditionRow id="root-1" />

          <div className="rounded-lg border bg-muted/30 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
              <Checkbox aria-label="Select nested group" />
              <MatchModeControl onChange={setNestedMode} value={nestedMode} />
              <span className="text-sm text-muted-foreground">of the conditions are met:</span>
              <Button aria-label="Nested group actions" className="ml-auto" icon variant="ghost">
                <MoreVertical className="size-4" />
              </Button>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-l-2 border-muted pl-4">
              {nestedConditions.map((condition) => (
                <FilterConditionRow id={condition} key={condition} />
              ))}
              <Button
                className="w-fit"
                onClick={() =>
                  setNestedConditions((conditions) => [
                    ...conditions,
                    `nested-${conditions.length + 1}`,
                  ])
                }
                variant="outline"
              >
                Add condition
              </Button>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-fit" variant="outline">
                Add
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem>Condition</DropdownMenuItem>
              <DropdownMenuItem>Group</DropdownMenuItem>
              <DropdownMenuItem disabled>Group from selection</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t px-6 py-5 sm:flex-row sm:justify-end sm:px-10">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </div>
    </div>
  );
}

const accountFields = [
  {
    id: 'account-name',
    label: 'Account name',
    placeholder: 'Name of the account',
    required: true,
  },
  {
    id: 'account-number',
    label: 'Account number',
    placeholder: 'The user-defined external identifier of the account',
  },
  {
    id: 'account-type',
    label: 'Account type',
    placeholder:
      'Type of the account. E.g. Prospect, Customer, Partner. The values are customizable',
  },
  { id: 'phone', label: 'Phone', placeholder: 'Phone number of the account' },
  { id: 'website', label: 'Website', placeholder: 'Website belonging to the account' },
];

function AccountFieldsExample() {
  const [values, setValues] = useState<Record<string, string>>({});

  function updateValue(id: string, value: string) {
    setValues((current) => ({ ...current, [id]: value }));
  }

  return (
    <div className="rounded-xl border bg-background p-6 shadow-sm sm:p-10">
      <div className="mb-5 flex justify-end">
        <Button variant="link">Switch to object view</Button>
      </div>
      <div className="flex flex-col gap-6">
        {accountFields.map((field) => {
          const value = values[field.id] ?? '';
          const invalid = field.required && !value;

          return (
            <div className="flex flex-col gap-2" key={field.id}>
              <Label
                className={`text-base font-semibold ${invalid ? 'text-destructive' : ''}`}
                htmlFor={`dap-${field.id}`}
              >
                {field.label} {field.required && <span aria-hidden="true">*</span>}
              </Label>
              <InputGroup className="future:rounded-lg">
                <InputGroupInput
                  aria-invalid={invalid}
                  aria-required={field.required}
                  id={`dap-${field.id}`}
                  onChange={(event) => updateValue(field.id, event.target.value)}
                  placeholder={field.placeholder}
                  value={value}
                />
                <InputGroupAddon align="inline-end" className="-my-1 gap-0 self-stretch">
                  <InputGroupButton
                    aria-label={`Insert variable for ${field.label}`}
                    className="h-full rounded-none border-l px-3"
                    icon
                    onClick={() => updateValue(field.id, `${value}{{variable}}`)}
                  >
                    <AtSign className={invalid ? 'text-destructive' : undefined} />
                  </InputGroupButton>
                  {invalid && (
                    <span
                      className="flex items-center px-2 text-destructive"
                      title="Required field"
                    >
                      <CircleAlert aria-label="Required field" className="size-4" />
                    </span>
                  )}
                  <ValueSourceMenu onClear={() => updateValue(field.id, '')} />
                </InputGroupAddon>
              </InputGroup>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const accountJson = `{
  "AccountNumber": null,
  "AccountSource": null,
  "Active__c": null,
  "AnnualRevenue": null,
  "BillingCity": null,
  "BillingCountry": null,
  "BillingCountryCode": null,
  "BillingGeocodeAccuracy": null,
  "BillingLatitude": null,
  "BillingLongitude": null,
  "BillingPostalCode": null,
  "BillingState": null,
  "BillingStateCode": null,
  "BillingStreet": null
}`;

let accountEditorThemeRegistered = false;

// biome-ignore lint/suspicious/noExplicitAny: Monaco's runtime instance is supplied by the editor package
function registerAccountEditorTheme(monaco: any) {
  if (accountEditorThemeRegistered) return;
  monaco.editor.defineTheme('apollo-account-light', apolloFutureLightMonaco);
  accountEditorThemeRegistered = true;
}

function AccountObjectEditorExample() {
  return (
    <div className="rounded-xl border bg-background p-6 shadow-sm sm:p-10">
      <div className="mb-2 flex items-center justify-between gap-4">
        <Label className="text-base font-semibold">
          Account <span aria-hidden="true">*</span>
        </Label>
        <Button variant="link">Switch to fields view</Button>
      </div>

      <div className="overflow-hidden rounded-md border future:rounded-lg">
        <div className="flex min-h-12 items-center justify-between gap-3 border-b px-3 py-2">
          <div className="flex flex-wrap items-center gap-1">
            <Button className="gap-2" disabled size="sm" variant="ghost">
              <WandSparkles className="size-4" />
              Fix
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2" size="sm" variant="ghost">
                  <Braces className="size-4" />
                  Insert variable
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem>Account owner</DropdownMenuItem>
                <DropdownMenuItem>Account ID</DropdownMenuItem>
                <DropdownMenuItem>Workflow output</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button aria-label="Open editor fullscreen" icon variant="ghost">
            <Maximize className="size-4" />
          </Button>
        </div>

        <MonacoEditor
          beforeMount={registerAccountEditorTheme}
          defaultLanguage="json"
          defaultValue={accountJson}
          height="420px"
          options={{
            automaticLayout: true,
            folding: false,
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            fontSize: 14,
            glyphMargin: false,
            lineHeight: 24,
            minimap: { enabled: false },
            overviewRulerBorder: false,
            padding: { top: 12, bottom: 12 },
            scrollBeyondLastLine: false,
            wordWrap: 'off',
          }}
          theme="apollo-account-light"
        />
      </div>
    </div>
  );
}

const messageConfigurationFields = [
  {
    id: 'message-fields',
    label: 'Message fields',
    placeholder:
      'Fields to be displayed below the message. Can be used to pass variables such as ID, name, event',
    guidance:
      'Displays name-value pairs in a two-column layout. Provide field names and values separated by a semicolon.',
    example: 'Example: Name: John Doe; Age: 30; Location: New York.',
  },
  {
    id: 'button-actions',
    label: 'Button actions',
    placeholder: 'Button actions to be displayed below the message. Ex: action1,Approve,primary;',
    guidance:
      'Up to 5 button actions, separated by semicolons. Each button is comma-separated: action ID (unique, required), action name (required), style (primary/danger), confirmation title, confirmation text, confirm ok title, confirm deny title.',
    example:
      'Example: approve,Approve,primary;reject,Reject,danger and with confirmation dialog: approve,Approve,primary,Confirm,Are you sure?,Yes,No;reject,Reject,danger.',
  },
];

function MessageConfigurationExample() {
  const [values, setValues] = useState<Record<string, string>>({});

  function updateValue(id: string, value: string) {
    setValues((current) => ({ ...current, [id]: value }));
  }

  return (
    <div className="rounded-xl border bg-background p-6 shadow-sm sm:p-10">
      <div className="flex flex-col gap-10">
        {messageConfigurationFields.map((field) => {
          const value = values[field.id] ?? '';

          return (
            <div className="flex flex-col gap-3" key={field.id}>
              <Label className="text-base font-semibold" htmlFor={`dap-${field.id}`}>
                {field.label}
              </Label>
              <InputGroup className="future:rounded-lg">
                <InputGroupInput
                  id={`dap-${field.id}`}
                  onChange={(event) => updateValue(field.id, event.target.value)}
                  placeholder={field.placeholder}
                  value={value}
                />
                <InputGroupAddon align="inline-end" className="-my-1 gap-0 self-stretch">
                  <InputGroupButton
                    aria-label={`Insert variable for ${field.label}`}
                    className="h-full rounded-none border-l px-3"
                    icon
                    onClick={() => updateValue(field.id, `${value}{{variable}}`)}
                  >
                    <AtSign />
                  </InputGroupButton>
                  <ValueSourceMenu onClear={() => updateValue(field.id, '')} />
                </InputGroupAddon>
              </InputGroup>

              <Alert className="rounded-none border-primary bg-primary/10 text-foreground">
                <Lightbulb className="size-4 text-primary" />
                <AlertDescription className="space-y-3 leading-6">
                  <p>{field.guidance}</p>
                  <p>{field.example}</p>
                </AlertDescription>
              </Alert>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const gmailConnections = [
  { id: 'personal', label: 'alex@example.com', group: 'Defined resources' },
  {
    id: 'workspace',
    label: "automation@example.com's workspace",
    group: 'Platform resources',
    workspace: true,
  },
  { id: 'platform-gmail', label: 'platform@example.com', group: 'Platform resources' },
];

function GmailIcon() {
  return <img alt="" aria-hidden="true" className="size-5 shrink-0" src={gmailIconUrl} />;
}

function GmailConnectionPickerExample() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedConnection, setSelectedConnection] = useState('alex@example.com');

  const filteredConnections = gmailConnections.filter((connection) =>
    connection.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="rounded-xl border bg-background p-6 shadow-sm sm:p-10">
      <div className="mb-2 flex items-center justify-between gap-4">
        <Label className="text-base font-semibold" htmlFor="gmail-connection-picker">
          Gmail connection <span aria-hidden="true">*</span>
        </Label>
        <Button variant="link">Refresh schema</Button>
      </div>

      <Popover onOpenChange={setOpen} open={open}>
        <div className="flex h-10 items-stretch rounded-md border future:rounded-xl">
          <PopoverTrigger asChild>
            <Button
              aria-expanded={open}
              aria-label="Select a Gmail connection"
              className="h-full min-w-0 flex-1 justify-start rounded-none px-3 font-normal future:rounded-l-xl"
              id="gmail-connection-picker"
              variant="ghost"
            >
              {selectedConnection ? (
                <span className="flex min-w-0 items-center gap-2 rounded bg-primary/15 px-2 py-1">
                  <GmailIcon />
                  <span className="truncate text-sm">{selectedConnection}</span>
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">Select a Gmail connection</span>
              )}
            </Button>
          </PopoverTrigger>
          {selectedConnection && (
            <Button
              aria-label="Clear Gmail connection"
              className="h-full rounded-none px-3 future:rounded-none"
              onClick={() => setSelectedConnection('')}
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        <PopoverContent
          align="start"
          className="w-[--radix-popover-trigger-width] min-w-[340px] p-0"
        >
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row">
            <Search
              aria-label="Search connections"
              className="flex-1"
              onChange={setQuery}
              placeholder="Search connections"
              value={query}
            />
            <Button className="shrink-0 gap-2" variant="ghost">
              <Plus className="size-4" />
              New connection
            </Button>
          </div>

          <div className="max-h-72 overflow-y-auto p-3">
            {['Defined resources', 'Platform resources'].map((group) => {
              const groupConnections = filteredConnections.filter(
                (connection) => connection.group === group
              );
              if (groupConnections.length === 0) return null;

              return (
                <div className="mb-3 last:mb-0" key={group}>
                  <p className="px-2 pb-1.5 text-xs font-semibold text-muted-foreground">{group}</p>
                  {groupConnections.map((connection) => (
                    <Button
                      className="h-auto w-full justify-start gap-3 px-2 py-2 font-normal"
                      key={connection.id}
                      onClick={() => {
                        setSelectedConnection(connection.label);
                        setOpen(false);
                      }}
                      variant="ghost"
                    >
                      {connection.workspace ? (
                        <FolderCog className="size-5 text-muted-foreground" />
                      ) : (
                        <GmailIcon />
                      )}
                      <span className="truncate">{connection.label}</span>
                    </Button>
                  ))}
                </div>
              );
            })}
          </div>

          <Button className="w-full gap-2 rounded-none border-t" variant="ghost">
            Open Orchestrator
            <ExternalLink className="size-4" />
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

const allSections = [
  'manage-properties',
  'subject-field',
  'boolean-property-options',
  'attachment-fields',
  'rich-text-body',
  'folder-picker',
  'user-combobox',
  'filter-builder',
  'account-fields',
  'account-object-editor',
  'message-configuration',
  'gmail-connection-picker',
];

type AlignmentStatus = 'Align layout now' | 'Target-state decision' | 'Runtime integration gap';

const reactDapDifferences: Array<{
  area: string;
  status: AlignmentStatus;
  layoutAction: string;
  remainingGap: string;
}> = [
  {
    area: 'Manage properties',
    status: 'Align layout now',
    layoutAction:
      'Keep the grouped rows, selection controls, search, and footer actions aligned with Flow Workbench’s Manage Properties dropdown.',
    remainingGap: 'Validate final density and hierarchy against representative connector metadata.',
  },
  {
    area: 'Value-source actions',
    status: 'Target-state decision',
    layoutAction:
      'The current React path exposes Insert variable; the layouts page also explores runtime, type, and clear actions.',
    remainingGap:
      'Decide whether the page documents current behavior or the proposed broader menu.',
  },
  {
    area: 'Expression and object editing',
    status: 'Target-state decision',
    layoutAction: 'Keep the Monaco object editor clearly presented as a proposed target layout.',
    remainingGap:
      'Flow Workbench does not yet wire the expression editor or test-expression context into React DAP.',
  },
  {
    area: 'Rich-text editing',
    status: 'Align layout now',
    layoutAction:
      'Aligned: this page now uses Apollo Wind Prompt Editor with its toolbar and variable autocomplete.',
    remainingGap:
      'Connector-specific validation and persistence remain owned by the Activity runtime.',
  },
  {
    area: 'Folder and remote pickers',
    status: 'Runtime integration gap',
    layoutAction: 'The compact picker shell and hierarchical rows can remain aligned in Storybook.',
    remainingGap: 'Live values and dependent options require the authenticated Activity runtime.',
  },
  {
    area: 'User and lookup comboboxes',
    status: 'Runtime integration gap',
    layoutAction:
      'The field chrome, search treatment, clear action, and result rows can align now.',
    remainingGap: 'Available values still depend on connector metadata and live lookup results.',
  },
  {
    area: 'Filter builder',
    status: 'Runtime integration gap',
    layoutAction: 'The nested AND/OR composition and field actions can align visually now.',
    remainingGap: 'Validation, reordering, and serialization require the connector field model.',
  },
  {
    area: 'Connection picker',
    status: 'Runtime integration gap',
    layoutAction: 'The trigger, grouped resources, search, and action placement can align now.',
    remainingGap:
      'Connection creation, refresh, bindings, and Orchestrator navigation require host integration.',
  },
  {
    area: 'Supported activity types',
    status: 'Runtime integration gap',
    layoutAction: 'Keep these examples explicitly scoped to reusable API connector layouts.',
    remainingGap:
      'React DAP support for trigger, agent, and automation activities is not implemented.',
  },
];

const alignmentStatusStyles: Record<AlignmentStatus, string> = {
  'Align layout now': 'border-primary/30 bg-primary/10 text-primary',
  'Target-state decision': 'border-warning/30 bg-warning/10 text-warning-foreground',
  'Runtime integration gap': 'border-border bg-muted/50 text-muted-foreground',
};

function DapLayoutsPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  return (
    <main className="min-h-screen bg-muted/30 px-5 py-10 text-foreground sm:px-8 sm:py-14">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="border-b pb-8">
          <p className="text-sm font-medium text-muted-foreground">Apollo Wind patterns</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">DAP layouts</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            This is a temporary page for internal alignment between teams. It recreates DAP layouts
            with Apollo Wind primitives and calls out where a dedicated component or production
            behavior is not yet available.
          </p>
        </header>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{allSections.length} component layouts</p>
          <div className="flex items-center gap-1">
            <Button
              disabled={expandedSections.length === allSections.length}
              onClick={() => setExpandedSections(allSections)}
              size="sm"
              variant="ghost"
            >
              Expand all
            </Button>
            <Button
              disabled={expandedSections.length === 0}
              onClick={() => setExpandedSections([])}
              size="sm"
              variant="ghost"
            >
              Collapse all
            </Button>
          </div>
        </div>

        <Accordion
          className="flex flex-col gap-4"
          onValueChange={setExpandedSections}
          type="multiple"
          value={expandedSections}
        >
          <AccordionItem
            className="rounded-xl border bg-background px-5 sm:px-6"
            value="manage-properties"
          >
            <AccordionTrigger className="gap-4 py-5 text-left hover:no-underline">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                  <SlidersHorizontal aria-hidden="true" className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="block text-xl leading-6 font-semibold">Manage properties</span>
                  <span className="block text-sm leading-5 font-normal text-muted-foreground">
                    Search and select fields from a grouped property list.
                  </span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-5 pb-6">
              <ManagePropertiesExample />

              <aside className="flex gap-3 rounded-lg border border-dashed bg-muted/20 px-4 py-3.5">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="text-sm leading-5">
                  <p className="font-medium">Component gap: hierarchical data table</p>
                  <p className="mt-0.5 text-muted-foreground">
                    Apollo Wind does not currently provide a dedicated tree-table. This example
                    composes the grouped rows from Table, Checkbox, and icon primitives.
                  </p>
                </div>
              </aside>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            className="rounded-xl border bg-background px-5 sm:px-6"
            value="subject-field"
          >
            <AccordionTrigger className="gap-4 py-5 text-left hover:no-underline">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                  <Type aria-hidden="true" className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="block text-xl leading-6 font-semibold">Subject field</span>
                  <span className="block text-sm leading-5 font-normal text-muted-foreground">
                    A text value with variable and configuration actions.
                  </span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-5 pb-6">
              <SubjectFieldExample />

              <aside className="flex gap-3 rounded-lg border border-dashed bg-muted/20 px-4 py-3.5">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="text-sm leading-5">
                  <p className="font-medium">Guidance: use Input Group</p>
                  <p className="mt-0.5 text-muted-foreground">
                    The reference does not show locking semantics, so Lockable Value Field would add
                    behavior that is not evidenced here. Input Group is the closer match, with the
                    sliders action opening the value-source menu shown in the related options
                    pattern.
                  </p>
                </div>
              </aside>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            className="rounded-xl border bg-background px-5 sm:px-6"
            value="boolean-property-options"
          >
            <AccordionTrigger className="gap-4 py-5 text-left hover:no-underline">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                  <SlidersHorizontal aria-hidden="true" className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="block text-xl leading-6 font-semibold">
                    Boolean property and options
                  </span>
                  <span className="block text-sm leading-5 font-normal text-muted-foreground">
                    A boolean choice, property management action, and configurable optional field.
                  </span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-5 pb-6">
              <BooleanPropertyOptionsExample />

              <aside className="flex gap-3 rounded-lg border border-dashed bg-muted/20 px-4 py-3.5">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="text-sm leading-5">
                  <p className="font-medium">Apollo Wind composition</p>
                  <p className="mt-0.5 text-muted-foreground">
                    This layout uses Radio Group, Button, Input Group, and Dropdown Menu. No new
                    component is required; the value-source menu is a reusable composition shared
                    with other configurable fields.
                  </p>
                </div>
              </aside>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            className="rounded-xl border bg-background px-5 sm:px-6"
            value="attachment-fields"
          >
            <AccordionTrigger className="gap-4 py-5 text-left hover:no-underline">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                  <Paperclip aria-hidden="true" className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="block text-xl leading-6 font-semibold">Attachment fields</span>
                  <span className="block text-sm leading-5 font-normal text-muted-foreground">
                    File and image URL values with variable and configuration actions.
                  </span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-5 pb-6">
              <AttachmentFieldsExample />

              <aside className="flex gap-3 rounded-lg border border-dashed bg-muted/20 px-4 py-3.5">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="text-sm leading-5">
                  <p className="font-medium">Apollo Wind composition</p>
                  <p className="mt-0.5 text-muted-foreground">
                    Both examples use the same Input Group pattern and shared value-source menu. No
                    additional component is required for these layouts.
                  </p>
                </div>
              </aside>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            className="rounded-xl border bg-background px-5 sm:px-6"
            value="rich-text-body"
          >
            <AccordionTrigger className="gap-4 py-5 text-left hover:no-underline">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                  <Bold aria-hidden="true" className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="block text-xl leading-6 font-semibold">Rich-text body</span>
                  <span className="block text-sm leading-5 font-normal text-muted-foreground">
                    Email body content with inline formatting and value-source actions.
                  </span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-5 pb-6">
              <RichTextBodyExample />

              <aside className="flex gap-3 rounded-lg border border-dashed bg-muted/20 px-4 py-3.5">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="text-sm leading-5">
                  <p className="font-medium">Aligned component: Prompt Editor</p>
                  <p className="mt-0.5 text-muted-foreground">
                    This layout now uses the same Apollo Wind Prompt Editor foundation selected by
                    Flow Workbench’s React DAP path, including its formatting toolbar and variable
                    autocomplete behavior.
                  </p>
                </div>
              </aside>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            className="rounded-xl border bg-background px-5 sm:px-6"
            value="folder-picker"
          >
            <AccordionTrigger className="gap-4 py-5 text-left hover:no-underline">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                  <Folder aria-hidden="true" className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="block text-xl leading-6 font-semibold">Folder picker</span>
                  <span className="block text-sm leading-5 font-normal text-muted-foreground">
                    Browse and select an email folder from a hierarchical list.
                  </span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-5 pb-6">
              <FolderPickerExample />

              <aside className="flex gap-3 rounded-lg border border-dashed bg-muted/20 px-4 py-3.5">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="text-sm leading-5">
                  <p className="font-medium">Component gap: compact folder picker</p>
                  <p className="mt-0.5 text-muted-foreground">
                    Apollo Wind provides Dialog and a feature-rich Tree View, but Tree View includes
                    controls that are not part of this layout. This prototype composes the compact
                    selectable rows from Button and icon primitives; a production version should use
                    a purpose-built folder-picker variant with hierarchical navigation semantics.
                  </p>
                </div>
              </aside>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            className="rounded-xl border bg-background px-5 sm:px-6"
            value="user-combobox"
          >
            <AccordionTrigger className="gap-4 py-5 text-left hover:no-underline">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                  <UserRound aria-hidden="true" className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="block text-xl leading-6 font-semibold">User combobox</span>
                  <span className="block text-sm leading-5 font-normal text-muted-foreground">
                    Search for and select a required user from a directory.
                  </span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-5 pb-6">
              <UserComboboxExample />

              <aside className="flex gap-3 rounded-lg border border-dashed bg-muted/20 px-4 py-3.5">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="text-sm leading-5">
                  <p className="font-medium">Apollo Wind composition</p>
                  <p className="mt-0.5 text-muted-foreground">
                    The searchable selection behavior comes from Combobox. The clear and
                    value-source controls are composed as adjacent actions, so no additional
                    component is required for this layout.
                  </p>
                </div>
              </aside>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            className="rounded-xl border bg-background px-5 sm:px-6"
            value="filter-builder"
          >
            <AccordionTrigger className="gap-4 py-5 text-left hover:no-underline">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                  <SlidersHorizontal aria-hidden="true" className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="block text-xl leading-6 font-semibold">Filter builder</span>
                  <span className="block text-sm leading-5 font-normal text-muted-foreground">
                    Build nested AND/OR groups from configurable conditions.
                  </span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-5 pb-6">
              <FilterBuilderExample />

              <aside className="flex gap-3 rounded-lg border border-dashed bg-muted/20 px-4 py-3.5">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="text-sm leading-5">
                  <p className="font-medium">Component gap: nested filter builder</p>
                  <p className="mt-0.5 text-muted-foreground">
                    Apollo Wind provides the required form and menu primitives, but no reusable
                    condition-tree model or filter-builder component. This prototype demonstrates
                    the layout; production use still needs group nesting, validation, reordering,
                    deletion, keyboard semantics, and serialization behavior.
                  </p>
                </div>
              </aside>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            className="rounded-xl border bg-background px-5 sm:px-6"
            value="account-fields"
          >
            <AccordionTrigger className="gap-4 py-5 text-left hover:no-underline">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                  <Type aria-hidden="true" className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="block text-xl leading-6 font-semibold">Account fields</span>
                  <span className="block text-sm leading-5 font-normal text-muted-foreground">
                    A configurable field group with required-state validation.
                  </span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-5 pb-6">
              <AccountFieldsExample />

              <aside className="flex gap-3 rounded-lg border border-dashed bg-muted/20 px-4 py-3.5">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="text-sm leading-5">
                  <p className="font-medium">Apollo Wind composition</p>
                  <p className="mt-0.5 text-muted-foreground">
                    This example reuses Label, Input Group, Button, validation tokens, and the
                    shared value-source menu. No additional component is required for the layout.
                  </p>
                </div>
              </aside>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            className="rounded-xl border bg-background px-5 sm:px-6"
            value="account-object-editor"
          >
            <AccordionTrigger className="gap-4 py-5 text-left hover:no-underline">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                  <Braces aria-hidden="true" className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="block text-xl leading-6 font-semibold">
                    Account object editor
                  </span>
                  <span className="block text-sm leading-5 font-normal text-muted-foreground">
                    Edit the complete account payload as structured JSON.
                  </span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-5 pb-6">
              <AccountObjectEditorExample />

              <aside className="flex gap-3 rounded-lg border border-dashed bg-muted/20 px-4 py-3.5">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="text-sm leading-5">
                  <p className="font-medium">Apollo editor integration</p>
                  <p className="mt-0.5 text-muted-foreground">
                    This example uses Monaco with Apollo’s Future editor theme and existing Button,
                    Dropdown Menu, and Label primitives. Apollo documents this integration under
                    Patterns → Code Editors, so no additional component is required.
                  </p>
                </div>
              </aside>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            className="rounded-xl border bg-background px-5 sm:px-6"
            value="message-configuration"
          >
            <AccordionTrigger className="gap-4 py-5 text-left hover:no-underline">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                  <Lightbulb aria-hidden="true" className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="block text-xl leading-6 font-semibold">
                    Message configuration
                  </span>
                  <span className="block text-sm leading-5 font-normal text-muted-foreground">
                    Structured message fields and action definitions with inline guidance.
                  </span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-5 pb-6">
              <MessageConfigurationExample />

              <aside className="flex gap-3 rounded-lg border border-dashed bg-muted/20 px-4 py-3.5">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="text-sm leading-5">
                  <p className="font-medium">Apollo Wind composition</p>
                  <p className="mt-0.5 text-muted-foreground">
                    This example uses Label, Input Group, Alert, and the shared value-source menu.
                    Alert does not currently expose a named informational variant, so its
                    information treatment is composed with Apollo semantic primary tokens.
                  </p>
                </div>
              </aside>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            className="rounded-xl border bg-background px-5 sm:px-6"
            value="gmail-connection-picker"
          >
            <AccordionTrigger className="gap-4 py-5 text-left hover:no-underline">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                  <GmailIcon />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="block text-xl leading-6 font-semibold">
                    Gmail connection picker
                  </span>
                  <span className="block text-sm leading-5 font-normal text-muted-foreground">
                    Search, select, and manage defined or platform connection resources.
                  </span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-5 pb-6">
              <GmailConnectionPickerExample />

              <aside className="flex gap-3 rounded-lg border border-dashed bg-muted/20 px-4 py-3.5">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="text-sm leading-5">
                  <p className="font-medium">Component gap: connection picker</p>
                  <p className="mt-0.5 text-muted-foreground">
                    Apollo Wind provides Popover, Search, Button, and menu primitives, but no
                    reusable connection picker with resource grouping, schema refresh, connection
                    creation, and Orchestrator navigation. This prototype composes those behaviors
                    for the documented layout.
                  </p>
                </div>
              </aside>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <section
          className="flex flex-col gap-4 border-t pt-8"
          aria-labelledby="react-dap-alignment"
        >
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-muted-foreground">Flow Workbench comparison</p>
            <h2 id="react-dap-alignment" className="mt-1 text-2xl font-semibold tracking-tight">
              React DAP alignment map
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Separates layout work we can do here from target-state decisions and behavior that
              belongs to the React <code className="font-mono text-xs">&lt;Activity&gt;</code>{' '}
              runtime.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border bg-background">
            <Table className="min-w-[840px]">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[18%]">Area</TableHead>
                  <TableHead className="w-[20%]">Status</TableHead>
                  <TableHead className="w-[31%]">Layout action</TableHead>
                  <TableHead className="w-[31%]">Outside this page</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reactDapDifferences.map((difference) => (
                  <TableRow key={difference.area}>
                    <TableCell className="align-top font-medium">{difference.area}</TableCell>
                    <TableCell className="align-top">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${alignmentStatusStyles[difference.status]}`}
                      >
                        {difference.status}
                      </span>
                    </TableCell>
                    <TableCell className="align-top text-muted-foreground">
                      {difference.layoutAction}
                    </TableCell>
                    <TableCell className="align-top text-muted-foreground">
                      {difference.remainingGap}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </main>
  );
}

const meta = {
  title: 'Patterns/DAP layouts',
  component: DapLayoutsPage,
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof DapLayoutsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Page: Story = {};
