# Localization (i18n) Guide

This guide explains how localization works in the UiPath Wind Design System and how to implement multilingual support in your application.

## ✨ Recent Update: 100% Localization Coverage

**All hardcoded strings have been removed!** The library now supports full localization:

- ✅ **MultiSelect**: Added `clearAllText` prop (string or function)
- ✅ **DataTable**: Added `columnToggleText` prop
- ✅ **DatePicker**: Added `calendarProps` for locale support

No more hardcoded user-facing text - every string is customizable!

---

## Table of Contents

1. [Current State](#current-state)
2. [Localization Strategy](#localization-strategy)
3. [Implementation Options](#implementation-options)
4. [Component-by-Component Guide](#component-by-component-guide)
5. [Best Practices](#best-practices)
6. [Example Implementations](#example-implementations)

---

## Current State

### No Built-in i18n Library

**The library does NOT include a built-in internationalization solution.** This is an intentional design decision because:

1. **Flexibility** - Different applications have different i18n requirements
2. **Bundle Size** - Keeps the library lean by not bundling an i18n framework
3. **Framework Agnostic** - Works with any i18n solution (react-i18next, next-intl, formatjs, etc.)
4. **Consumer Choice** - You control which i18n library to use

### Components with User-Facing Text

Components expose **props for all user-facing strings**, allowing you to provide translated text:

#### Components with Localizable Props

| Component         | Props                                                              | Default Values                                                           |
| ----------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `Combobox`        | `placeholder`, `searchPlaceholder`, `emptyText`                    | "Select an option...", "Search...", "No results found."                  |
| `MultiSelect`     | `placeholder`, `emptyMessage`, `searchPlaceholder`, `clearAllText` | "Select items...", "No items found.", "Search...", "Clear All ({count})" |
| `DataTable`       | `searchPlaceholder`, `columnToggleText`                            | "Search...", "Columns"                                                   |
| `Search`          | `placeholder`                                                      | "Search..."                                                              |
| `EmptyState`      | `title`, `description`, `action.label`, `secondaryAction.label`    | N/A (required/optional props)                                            |
| `Pagination`      | Children text ("Previous", "Next")                                 | Rendered via children                                                    |
| `DatePicker`      | `placeholder`, `calendarProps.locale`                              | "Pick a date", English                                                   |
| `DateRangePicker` | `placeholder`, `calendarProps.locale`                              | "Pick a date range", English                                             |

---

## Localization Strategy

### Recommended Approach: Props-Based Localization

**Pass translated strings as props to components:**

```tsx
import { useTranslation } from "react-i18next"; // or your i18n library
import { Combobox, MultiSelect, DataTable } from "@/components/ui";

function MyComponent() {
  const { t } = useTranslation();

  return (
    <>
      <Combobox
        items={items}
        placeholder={t("common.selectOption")}
        searchPlaceholder={t("common.search")}
        emptyText={t("common.noResults")}
      />

      <MultiSelect
        options={options}
        selected={selected}
        onChange={setSelected}
        placeholder={t("common.selectItems")}
        emptyMessage={t("common.noItemsFound")}
        searchPlaceholder={t("common.search")}
      />

      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder={t("common.searchPlaceholder")}
      />
    </>
  );
}
```

---

## Implementation Options

### Option 1: react-i18next (Most Popular)

**Installation:**

```bash
npm install react-i18next i18next
```

**Setup:**

```tsx
// i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    common: {
      selectOption: "Select an option...",
      selectItems: "Select items...",
      search: "Search...",
      noResults: "No results found.",
      noItemsFound: "No items found.",
      previous: "Previous",
      next: "Next",
      clearAll: "Clear all",
    },
  },
  es: {
    common: {
      selectOption: "Seleccionar una opción...",
      selectItems: "Seleccionar elementos...",
      search: "Buscar...",
      noResults: "No se encontraron resultados.",
      noItemsFound: "No se encontraron elementos.",
      previous: "Anterior",
      next: "Siguiente",
      clearAll: "Limpiar todo",
    },
  },
  fr: {
    common: {
      selectOption: "Sélectionner une option...",
      selectItems: "Sélectionner des éléments...",
      search: "Rechercher...",
      noResults: "Aucun résultat trouvé.",
      noItemsFound: "Aucun élément trouvé.",
      previous: "Précédent",
      next: "Suivant",
      clearAll: "Tout effacer",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
```

**Usage:**

```tsx
import { useTranslation } from "react-i18next";
import { Combobox } from "@/components/ui";

function LocalizedCombobox({ items, value, onChange }) {
  const { t } = useTranslation("common");

  return (
    <Combobox
      items={items}
      value={value}
      onValueChange={onChange}
      placeholder={t("selectOption")}
      searchPlaceholder={t("search")}
      emptyText={t("noResults")}
    />
  );
}
```

---

### Option 2: next-intl (Next.js)

**Installation:**

```bash
npm install next-intl
```

**Setup (App Router):**

```tsx
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

**Messages (messages/en.json):**

```json
{
  "components": {
    "combobox": {
      "placeholder": "Select an option...",
      "search": "Search...",
      "noResults": "No results found."
    },
    "multiSelect": {
      "placeholder": "Select items...",
      "search": "Search...",
      "noItems": "No items found.",
      "clearAll": "Clear all ({count})"
    },
    "dataTable": {
      "search": "Search..."
    },
    "pagination": {
      "previous": "Previous",
      "next": "Next"
    }
  }
}
```

**Usage:**

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Combobox } from "@/components/ui";

function LocalizedCombobox({ items, value, onChange }) {
  const t = useTranslations("components.combobox");

  return (
    <Combobox
      items={items}
      value={value}
      onValueChange={onChange}
      placeholder={t("placeholder")}
      searchPlaceholder={t("search")}
      emptyText={t("noResults")}
    />
  );
}
```

---

### Option 3: FormatJS (React-Intl)

**Installation:**

```bash
npm install react-intl
```

**Setup:**

```tsx
import { IntlProvider } from "react-intl";

const messages = {
  en: {
    "combobox.placeholder": "Select an option...",
    "combobox.search": "Search...",
    "combobox.noResults": "No results found.",
  },
  es: {
    "combobox.placeholder": "Seleccionar una opción...",
    "combobox.search": "Buscar...",
    "combobox.noResults": "No se encontraron resultados.",
  },
};

function App() {
  const [locale, setLocale] = useState("en");

  return (
    <IntlProvider messages={messages[locale]} locale={locale}>
      <YourApp />
    </IntlProvider>
  );
}
```

**Usage:**

```tsx
import { useIntl } from "react-intl";
import { Combobox } from "@/components/ui";

function LocalizedCombobox({ items, value, onChange }) {
  const intl = useIntl();

  return (
    <Combobox
      items={items}
      value={value}
      onValueChange={onChange}
      placeholder={intl.formatMessage({ id: "combobox.placeholder" })}
      searchPlaceholder={intl.formatMessage({ id: "combobox.search" })}
      emptyText={intl.formatMessage({ id: "combobox.noResults" })}
    />
  );
}
```

---

### Option 4: Custom Solution

For simple needs, you can create your own translation system:

```tsx
// translations.ts
export const translations = {
  en: {
    selectOption: "Select an option...",
    search: "Search...",
    noResults: "No results found.",
  },
  es: {
    selectOption: "Seleccionar una opción...",
    search: "Buscar...",
    noResults: "No se encontraron resultados.",
  },
};

// i18n-context.tsx
import { createContext, useContext } from "react";

const I18nContext = createContext({ locale: "en", t: (key: string) => key });

export function I18nProvider({ locale, children }) {
  const t = (key: string) => translations[locale]?.[key] || key;

  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);

// Usage
function LocalizedCombobox({ items, value, onChange }) {
  const { t } = useI18n();

  return (
    <Combobox
      items={items}
      value={value}
      onValueChange={onChange}
      placeholder={t("selectOption")}
      searchPlaceholder={t("search")}
      emptyText={t("noResults")}
    />
  );
}
```

---

## Component-by-Component Guide

### Combobox

**Localizable Props:**

- `placeholder` - Button text when no selection
- `searchPlaceholder` - Search input placeholder
- `emptyText` - Text shown when no results

**Example:**

```tsx
<Combobox
  items={items}
  value={value}
  onValueChange={setValue}
  placeholder={t("combobox.placeholder")}
  searchPlaceholder={t("common.search")}
  emptyText={t("combobox.noResults")}
/>
```

**Recommended Translation Keys:**

```json
{
  "combobox": {
    "placeholder": "Select an option...",
    "noResults": "No results found."
  },
  "common": {
    "search": "Search..."
  }
}
```

---

### MultiSelect

**Localizable Props:**

- `placeholder` - Button text when nothing selected
- `searchPlaceholder` - Search input placeholder
- `emptyMessage` - Text shown when no options available

**Additional Localizable Text:**

- "Clear all ({count})" button (rendered internally)

**Example:**

```tsx
<MultiSelect
  options={options}
  selected={selected}
  onChange={setSelected}
  placeholder={t("multiSelect.placeholder")}
  searchPlaceholder={t("common.search")}
  emptyMessage={t("multiSelect.noItems")}
/>
```

**Note**: The "Clear all" button text is hardcoded. To localize it, you'd need to fork the component or submit a PR to make it configurable.

**Recommended Translation Keys:**

```json
{
  "multiSelect": {
    "placeholder": "Select items...",
    "noItems": "No items found."
  }
}
```

---

### DataTable

**Localizable Props:**

- `searchPlaceholder` - Search input placeholder

**Additional Localizable Elements:**

- Column headers (via `columns` prop)
- "Columns" dropdown text (hardcoded)
- "Previous" / "Next" pagination (rendered via children)

**Example:**

```tsx
const columns = [
  {
    accessorKey: "name",
    header: t("table.columns.name"), // ✅ Localize headers
  },
  {
    accessorKey: "email",
    header: t("table.columns.email"),
  },
];

<DataTable
  columns={columns}
  data={data}
  searchPlaceholder={t("common.search")}
/>;
```

**Recommended Translation Keys:**

```json
{
  "table": {
    "columns": {
      "name": "Name",
      "email": "Email",
      "actions": "Actions"
    }
  }
}
```

---

### DatePicker

Uses `react-day-picker` internally, which supports localization via the `locale` prop.

**Example:**

```tsx
import { fr } from "date-fns/locale";
import { DatePicker } from "@/components/ui";

<DatePicker
  value={date}
  onValueChange={setDate}
  // Pass locale to underlying Calendar component
  calendarProps={{ locale: fr }}
/>;
```

**Note**: Currently DatePicker doesn't expose all Calendar props. You may need to modify the component to pass through `locale`.

**Workaround**: Use Calendar directly:

```tsx
import { Calendar } from "@/components/ui";
import { fr } from "date-fns/locale";

<Calendar mode="single" selected={date} onSelect={setDate} locale={fr} />;
```

---

### EmptyState

**Localizable Props:**

- `title` - Main heading (required)
- `description` - Subtext (optional)
- `action.label` - Primary button text
- `secondaryAction.label` - Secondary button text

**Example:**

```tsx
<EmptyState
  icon={<Inbox className="h-12 w-12" />}
  title={t("emptyState.noData.title")}
  description={t("emptyState.noData.description")}
  action={{
    label: t("emptyState.noData.action"),
    onClick: handleCreate,
  }}
  secondaryAction={{
    label: t("common.learnMore"),
    onClick: handleLearnMore,
  }}
/>
```

**Recommended Translation Keys:**

```json
{
  "emptyState": {
    "noData": {
      "title": "No data available",
      "description": "Get started by creating your first item.",
      "action": "Create Item"
    }
  },
  "common": {
    "learnMore": "Learn More"
  }
}
```

---

### Pagination

Pagination components render text via children, so you control all text:

**Example:**

```tsx
import { useTranslation } from "react-i18next";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui";

function LocalizedPagination({ currentPage, totalPages, onPageChange }) {
  const { t } = useTranslation("common");

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious onClick={() => onPageChange(currentPage - 1)}>
            {t("pagination.previous")}
          </PaginationPrevious>
        </PaginationItem>

        {/* Page numbers */}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              onClick={() => onPageChange(page)}
              isActive={page === currentPage}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext onClick={() => onPageChange(currentPage + 1)}>
            {t("pagination.next")}
          </PaginationNext>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
```

**Recommended Translation Keys:**

```json
{
  "pagination": {
    "previous": "Previous",
    "next": "Next"
  }
}
```

---

### Search

**Localizable Props:**

- `placeholder` - Input placeholder text

**Example:**

```tsx
<Search
  placeholder={t("common.search")}
  value={searchValue}
  onChange={setSearchValue}
/>
```

---

### Dialogs, Alerts, Toasts

These components render your content, so you control all text:

**Example:**

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{t('dialog.deleteUser.title')}</DialogTitle>
      <DialogDescription>
        {t('dialog.deleteUser.description')}
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        {t('common.cancel')}
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        {t('common.delete')}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>{t('alert.error')}</AlertTitle>
  <AlertDescription>{t('alert.somethingWentWrong')}</AlertDescription>
</Alert>

// Toast
toast.success(t('toast.saveSuccess'));
toast.error(t('toast.saveFailed'));
```

---

## Best Practices

### 1. Create Wrapper Components

Wrap components with localization logic once, reuse everywhere:

```tsx
// components/localized/LocalizedCombobox.tsx
import { useTranslation } from "react-i18next";
import { Combobox, ComboboxProps } from "@/components/ui";

export function LocalizedCombobox(
  props: Omit<ComboboxProps, "placeholder" | "searchPlaceholder" | "emptyText">,
) {
  const { t } = useTranslation("common");

  return (
    <Combobox
      {...props}
      placeholder={t("selectOption")}
      searchPlaceholder={t("search")}
      emptyText={t("noResults")}
    />
  );
}

// Usage - no translation needed!
<LocalizedCombobox items={items} value={value} onValueChange={setValue} />;
```

### 2. Organize Translation Keys by Component

```json
{
  "components": {
    "combobox": {
      "placeholder": "Select an option...",
      "search": "Search...",
      "noResults": "No results found."
    },
    "multiSelect": {
      "placeholder": "Select items...",
      "noItems": "No items found."
    },
    "dataTable": {
      "search": "Search...",
      "columns": "Columns"
    },
    "emptyState": {
      "noData": "No data available"
    }
  },
  "common": {
    "search": "Search...",
    "previous": "Previous",
    "next": "Next",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "close": "Close"
  }
}
```

### 3. Use Common Keys for Repeated Text

Many components use "Search..." - define it once:

```tsx
// ✅ Good
<Combobox searchPlaceholder={t('common.search')} />
<MultiSelect searchPlaceholder={t('common.search')} />
<DataTable searchPlaceholder={t('common.search')} />

// ❌ Bad - Duplicated translations
<Combobox searchPlaceholder={t('combobox.search')} />
<MultiSelect searchPlaceholder={t('multiSelect.search')} />
<DataTable searchPlaceholder={t('dataTable.search')} />
```

### 4. Support RTL Languages

For Arabic, Hebrew, etc., use CSS direction:

```tsx
<html dir={locale === "ar" || locale === "he" ? "rtl" : "ltr"}>
  {/* Your app */}
</html>
```

Tailwind supports RTL automatically with utility classes like `rtl:text-right`.

### 5. Handle Pluralization

Use your i18n library's pluralization features:

```tsx
// react-i18next
const { t } = useTranslation();
const itemCount = selected.length;

// Translation file
{
  "itemsSelected_one": "{{count}} item selected",
  "itemsSelected_other": "{{count}} items selected"
}

// Usage
aria-label={t('itemsSelected', { count: itemCount })}
// Result: "1 item selected" or "5 items selected"
```

### 6. Date and Number Formatting

Use Intl APIs for locale-aware formatting:

```tsx
// Numbers
const formatter = new Intl.NumberFormat(locale, {
  style: "currency",
  currency: "USD",
});
formatter.format(1234.56); // "$1,234.56" (en-US) or "1 234,56 $US" (fr-FR)

// Dates
const dateFormatter = new Intl.DateTimeFormat(locale, {
  year: "numeric",
  month: "long",
  day: "numeric",
});
dateFormatter.format(new Date()); // "January 15, 2024" (en) or "15 janvier 2024" (fr)
```

### 7. Test with Multiple Locales

Always test your app in at least 2-3 languages:

- English (baseline)
- A language with longer text (German, Finnish)
- An RTL language (Arabic, Hebrew)

This helps catch layout issues and missing translations.

---

## Example Implementations

### Full Example: User Management Page

```tsx
"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, UserPlus } from "lucide-react";
import {
  Button,
  DataTable,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  EmptyState,
  toast,
} from "@/components/ui";

export default function UsersPage() {
  const { t } = useTranslation(["users", "common"]);
  const [users, setUsers] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const columns = [
    {
      accessorKey: "name",
      header: t("users:table.name"),
    },
    {
      accessorKey: "email",
      header: t("users:table.email"),
    },
    {
      accessorKey: "role",
      header: t("users:table.role"),
    },
    {
      id: "actions",
      header: t("common:actions"),
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setSelectedUser(row.original);
            setShowDeleteDialog(true);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const handleDelete = async () => {
    try {
      await deleteUser(selectedUser.id);
      setUsers(users.filter((u) => u.id !== selectedUser.id));
      toast.success(t("users:toast.deleteSuccess"));
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error(t("users:toast.deleteFailed"));
    }
  };

  if (users.length === 0) {
    return (
      <EmptyState
        icon={<UserPlus className="h-12 w-12" />}
        title={t("users:empty.title")}
        description={t("users:empty.description")}
        action={{
          label: t("users:empty.action"),
          onClick: () => {
            /* navigate to create */
          },
        }}
      />
    );
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder={t("common:search")}
      />

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users:delete.title")}</DialogTitle>
            <DialogDescription>
              {t("users:delete.description", { name: selectedUser?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              {t("common:cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t("common:delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Translation Files:**

```json
// locales/en/users.json
{
  "table": {
    "name": "Name",
    "email": "Email",
    "role": "Role"
  },
  "empty": {
    "title": "No users yet",
    "description": "Get started by inviting your first team member.",
    "action": "Invite User"
  },
  "delete": {
    "title": "Delete User",
    "description": "Are you sure you want to delete {{name}}? This action cannot be undone."
  },
  "toast": {
    "deleteSuccess": "User deleted successfully",
    "deleteFailed": "Failed to delete user"
  }
}

// locales/en/common.json
{
  "search": "Search...",
  "actions": "Actions",
  "cancel": "Cancel",
  "delete": "Delete",
  "save": "Save",
  "close": "Close"
}
```

---

## Summary

### Key Points

1. **No built-in i18n** - By design, to keep the library flexible and lean
2. **All user-facing text is props** - You control all strings
3. **Works with any i18n solution** - react-i18next, next-intl, formatjs, or custom
4. **Create wrapper components** - Centralize localization logic
5. **Test in multiple locales** - Especially long text and RTL languages

### Components Requiring Localization

| Priority   | Components                                           |
| ---------- | ---------------------------------------------------- |
| **High**   | Combobox, MultiSelect, DataTable, Search, EmptyState |
| **Medium** | DatePicker, Pagination, Dialogs, Alerts              |
| **Low**    | All other components (text via children)             |

### Recommended Next Steps

1. Choose an i18n library (react-i18next recommended)
2. Define common translation keys
3. Create localized wrapper components
4. Test with at least 2-3 languages
5. Set up CI to catch missing translations

---

## Contributing

If you find components that should expose additional props for localization, please open an issue or PR!

Examples of potential improvements:

- MultiSelect "Clear all" button text
- DataTable "Columns" dropdown text
- DatePicker format strings
- Pagination ellipsis text
