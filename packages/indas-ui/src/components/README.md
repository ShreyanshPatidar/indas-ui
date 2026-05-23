# Component Library Documentation

> **Version:** 2.0.0
> **Last Updated:** October 6, 2025
> **Component Count:** 75+ Active Components
> **Framework:** React 18+ with Next.js 15, TypeScript 5+, Tailwind CSS 3
> **Design System:** Custom token-based theming with CSS variables

---

## 🤖 AI Quick Reference

**For AI Assistants:** This component library follows a strict design token system. Always use CSS variables for colors (never hardcoded values). All components are fully typed with TypeScript and exported through centralized index files.

### Component Discovery Matrix

| Need | Component | Import Path | Key Features |
|------|-----------|-------------|--------------|
| Text input | `Input` | `@/components/ui` | Validation, placeholder, disabled states |
| Dropdown select | `Dropdown` | `@/components` | Search, create, multi-select, API integration |
| Data table | `AdvancedDataGrid` | `@/components/datagrid` | 30+ features, virtual scrolling, row reordering |
| Button action | `Button` | `@/components/ui` | 5 variants, loading state, icons |
| Date selection | `DatePicker` | `@/components/ui` | Single, range, validation |
| Modal dialog | `Dialog` | `@/components/ui` | Radix UI, accessible, composable |
| Show/hide content | `Collapsible` | `@/components/ui` | Animated expand/collapse |
| User feedback | `Alert` | `@/components/ui` | 4 variants, icons, dismissible |
| Navigation tabs | `Tabs` | `@/components/ui` | Keyboard nav, controlled/uncontrolled |
| Loading state | `Loading` | `@/components/ui` | 3 sizes, custom text, overlay mode |

### Critical Design Rules

```typescript
// ❌ NEVER: Hardcoded colors
<div className="text-red-600 bg-blue-500">

// ✅ ALWAYS: CSS variables
<div className="text-[rgb(var(--color-error))] bg-[rgb(var(--color-primary))]">

// ❌ NEVER: Direct component imports
import { Button } from '@/components/ui/buttons/button'

// ✅ ALWAYS: Index imports
import { Button } from '@/components/ui'

// ✅ ALWAYS: Provide TypeScript types
import { Button, ButtonProps } from '@/components/ui'
const MyButton: React.FC<ButtonProps> = (props) => <Button {...props} />
```

---

## 📑 Table of Contents

1. [Component Organization](#-component-organization)
2. [Quick Start Guide](#-quick-start-guide)
3. [UI Components](#-ui-components)
4. [Form Components](#-form-components)
5. [DataGrid Components](#-datagrid-components)
6. [Layout Components](#-layout-components)
7. [Master Data Components](#-master-data-components)
8. [Modal Components](#-modal-components)
9. [Provider Components](#-provider-components)
10. [Theme Components](#-theme-components)
11. [Chart Components](#-chart-components)
12. [Design System](#-design-system)
13. [Import Patterns](#-import-patterns)
14. [Common Patterns](#-common-patterns)
15. [Troubleshooting](#-troubleshooting)

---

## 📁 Component Organization

### Folder Structure

```
src/components/
├── ui/                          # Organized UI primitives by category
│   ├── forms/                   # Form controls (input, checkbox, textarea, label, switch)
│   ├── buttons/                 # Button components (button, toggle)
│   ├── feedback/                # User feedback (alert, progress, badge, tooltip)
│   ├── overlays/                # Modals/Dialogs (modal, dialog, modal-alert)
│   ├── navigation/              # Navigation (tabs, dropdown-menu, navigation-progress)
│   ├── display/                 # Display components (card, text, separator, collapsible, stats-card)
│   ├── loading.tsx, newtons-cradle.tsx, combobox.tsx, close-button.tsx
│   └── index.ts                 # ⚠️ Centralized exports - import from here!
│
├── forms/                       # Complex form components
│   ├── dropdown.tsx             # Advanced dropdown with search/create/multi-select
│   ├── unified-currency-dropdown.tsx  # Currency selector with exchange rates
│   ├── date-picker/             # Date and date range picker
│   ├── file-attachment/         # File upload with preview
│   └── quantity-input-popup.tsx # Inline quantity input
│
├── datagrid/                    # Advanced data grid (30+ features)
│   ├── AdvancedDataGrid.tsx     # Main grid component
│   ├── features/                # Column mgmt, filtering, search, selection, export
│   ├── controls/                # Pagination, checkbox, resize
│   ├── hooks/                   # Keyboard nav, clipboard, cell selection
│   ├── views/                   # Card view, data visualization
│   ├── README.md                # 📖 Complete DataGrid documentation
│   └── index.ts                 # DataGrid exports
│
├── layout/                      # Application shell components
│   ├── app-shell.tsx            # Main app layout
│   ├── header.tsx, footer.tsx   # Header/footer
│   ├── dynamic-sidebar.tsx      # API-driven navigation
│   ├── theme-customizer.tsx     # Theme settings panel
│   ├── top-header.tsx           # Top navigation bar
│   └── user-dropdown.tsx        # User menu
│
├── master/                      # Master data management
│   ├── MasterDataGrid.tsx       # Specialized grid for master data
│   ├── MasterModal.tsx          # Generic master modal
│   ├── columns/                 # Column definitions
│   ├── editable-cells/          # Inline editing cells
│   └── modals/                  # Item, Machine, Process master modals
│
├── modals/                      # Application-specific modals
│   ├── enquiry-modal.tsx        # Customer enquiry form
│   ├── api-config-modal.tsx     # API configuration
│   ├── global-api-config-modal.tsx  # Global API settings
│   ├── ImageModal.tsx           # Image viewer
│   └── signout-confirmation-modal.tsx  # Sign out confirm
│
├── providers/                   # React context providers
│   ├── session-provider.tsx     # NextAuth session wrapper
│   └── api-provider.tsx         # API configuration provider
│
├── theme/                       # Theme customization
│   ├── ThemeCustomizer.tsx      # Full theme panel
│   └── SimpleThemeCustomizer.tsx  # Simple theme selector
│
├── charts/                      # Chart components
│   └── chart-container.tsx      # Recharts wrapper with theming
│
├── [re-export files]            # ⚠️ Backward compatibility - re-exports from organized folders
│   ├── button.tsx → ui/buttons/button.tsx
│   ├── input.tsx → ui/forms/input.tsx
│   ├── dropdown.tsx → forms/dropdown.tsx
│   └── ... (20+ re-export files)
│
├── index.ts                     # 🎯 MAIN ENTRY POINT - exports all components
└── README.md                    # 📖 This file

**Import Strategy:**
- ✅ **Recommended:** `import { Button, Input } from '@/components/ui'`
- ✅ **Alternative:** `import { Button } from '@/components/button'` (backward compat)
- ❌ **Avoid:** `import { Button } from '@/components/ui/buttons/button'` (implementation detail)
```

---

## 🚀 Quick Start Guide

### 1. Basic Form

```tsx
import { Input, Button, Label } from '@/components/ui'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <form>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit">Sign In</Button>
    </form>
  )
}
```

### 2. Data Table

```tsx
import { AdvancedDataGrid } from '@/components/datagrid'
import type { ColumnDef } from '@tanstack/react-table'

interface User {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive'
}

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'status', header: 'Status' }
]

function UserTable({ users }: { users: User[] }) {
  return (
    <AdvancedDataGrid
      data={users}
      columns={columns}
      enableRowSelection
      enableSorting
      enableFiltering
      enablePagination
    />
  )
}
```

### 3. Dropdown with API

```tsx
import { Dropdown } from '@/components'

function CustomerSelector() {
  const [customer, setCustomer] = useState('')

  return (
    <Dropdown
      apiEndpoint="/api/customers"
      apiField="CustomerName"
      value={customer}
      onValueChange={setCustomer}
      allowTextInput
      placeholder="Search customers..."
    />
  )
}
```

---

## 🎨 UI Components

### Form Controls

#### Button
Multi-variant button with loading states.

```tsx
import { Button } from '@/components/ui'

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// States
<Button loading>Processing...</Button>
<Button disabled>Disabled</Button>

// With icons (use lucide-react)
import { Save } from 'lucide-react'
<Button>
  <Save className="mr-2 h-4 w-4" />
  Save Changes
</Button>
```

**Props:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}
```

**File:** `src/components/ui/buttons/button.tsx`

---

#### Input
Text input with full HTML input support.

```tsx
import { Input } from '@/components/ui'

// Basic
<Input
  placeholder="Enter text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>

// Types
<Input type="email" placeholder="Email" />
<Input type="password" placeholder="Password" />
<Input type="number" min={0} max={100} />
<Input type="tel" placeholder="Phone" />

// With validation
<Input
  required
  pattern="[A-Za-z]{3,}"
  title="At least 3 letters"
/>

// Disabled/readonly
<Input disabled value="Cannot edit" />
<Input readOnly value="Read only" />
```

**Props:** All standard HTML input attributes

**File:** `src/components/ui/forms/input.tsx`

---

#### Checkbox
Checkbox with indeterminate state.

```tsx
import { Checkbox } from '@/components/ui'

// Basic
<Checkbox
  checked={agreed}
  onCheckedChange={setAgreed}
/>

// With label
<div className="flex items-center space-x-2">
  <Checkbox id="terms" checked={agreed} onCheckedChange={setAgreed} />
  <Label htmlFor="terms">I agree to terms</Label>
</div>

// Indeterminate (for "select all" scenarios)
<Checkbox
  checked={someSelected}
  onCheckedChange={handleChange}
  indeterminate={!allSelected && someSelected}
/>
```

**File:** `src/components/ui/forms/checkbox.tsx`

---

#### Textarea
Multi-line text input.

```tsx
import { Textarea } from '@/components/ui'

<Textarea
  placeholder="Enter description..."
  rows={4}
  value={text}
  onChange={(e) => setText(e.target.value)}
/>

// With character limit
<div>
  <Textarea
    placeholder="Max 500 characters"
    maxLength={500}
    value={text}
    onChange={(e) => setText(e.target.value)}
  />
  <p className="text-sm text-[rgb(var(--fg-muted))]">
    {text.length}/500 characters
  </p>
</div>
```

**File:** `src/components/ui/forms/textarea.tsx`

---

#### Switch
Toggle switch.

```tsx
import { Switch } from '@/components/ui'

<div className="flex items-center space-x-2">
  <Switch
    id="notifications"
    checked={enabled}
    onCheckedChange={setEnabled}
  />
  <Label htmlFor="notifications">Enable notifications</Label>
</div>
```

**File:** `src/components/ui/forms/switch.tsx`

---

#### Toggle
Toggle button.

```tsx
import { Toggle } from '@/components/ui'
import { Bold } from 'lucide-react'

<Toggle
  pressed={isBold}
  onPressedChange={setIsBold}
  aria-label="Toggle bold"
>
  <Bold className="h-4 w-4" />
</Toggle>
```

**File:** `src/components/ui/buttons/toggle.tsx`

---

### Display Components

#### Card
Flexible container with header and footer.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui'

<Card>
  <CardHeader>
    <CardTitle>Revenue Overview</CardTitle>
    <CardDescription>Monthly revenue breakdown</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Card body content */}
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

**File:** `src/components/ui/display/card.tsx`

---

#### StatsCard
Statistics display with trend indicators.

```tsx
import { StatsCard, StatsGrid } from '@/components/ui'
import { DollarSign, Users } from 'lucide-react'

// Single stat
<StatsCard
  title="Total Revenue"
  value="$45,231.89"
  icon={DollarSign}
  trend={{ value: 20.1, direction: 'up' }}
  description="+20.1% from last month"
/>

// Grid of stats
<StatsGrid>
  <StatsCard title="Revenue" value="$45,231" icon={DollarSign} />
  <StatsCard title="Users" value="2,350" icon={Users} />
</StatsGrid>
```

**File:** `src/components/ui/display/stats-card.tsx`

---

#### Badge
Small status indicator.

```tsx
import { Badge } from '@/components/ui'

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>

// Custom colors with CSS variables
<Badge className="bg-[rgb(var(--color-success-subtle))] text-[rgb(var(--color-success))]">
  Active
</Badge>
```

**File:** `src/components/ui/feedback/badge.tsx`

---

#### Text
Typography component.

```tsx
import { Text } from '@/components/ui'

<Text variant="h1">Heading 1</Text>
<Text variant="h2">Heading 2</Text>
<Text variant="h3">Heading 3</Text>
<Text variant="body">Body text</Text>
<Text variant="caption">Caption text</Text>
<Text variant="muted">Muted text</Text>
```

**File:** `src/components/ui/display/text.tsx`

---

#### Separator
Horizontal or vertical divider.

```tsx
import { Separator } from '@/components/ui'

{/* Horizontal */}
<Separator />

{/* Vertical */}
<div className="flex h-5 items-center space-x-4">
  <div>Item 1</div>
  <Separator orientation="vertical" />
  <div>Item 2</div>
</div>
```

**File:** `src/components/ui/display/separator.tsx`

---

#### Collapsible
Expandable content.

```tsx
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui'

<Collapsible>
  <CollapsibleTrigger asChild>
    <Button variant="ghost">
      Toggle Details
      <ChevronDown className="ml-2 h-4 w-4" />
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div className="p-4">
      Hidden content revealed!
    </div>
  </CollapsibleContent>
</Collapsible>
```

**File:** `src/components/ui/display/collapsible.tsx`

---

### Feedback Components

#### Alert
Notification/alert message.

```tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui'
import { AlertCircle } from 'lucide-react'

<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Attention</AlertTitle>
  <AlertDescription>
    This action cannot be undone.
  </AlertDescription>
</Alert>

{/* Destructive variant */}
<Alert variant="destructive">
  <AlertDescription>Error occurred!</AlertDescription>
</Alert>
```

**File:** `src/components/ui/feedback/alert.tsx`

---

#### Progress
Progress bar.

```tsx
import { Progress } from '@/components/ui'

<Progress value={60} />
<Progress value={100} className="bg-[rgb(var(--color-success))]" />
```

**File:** `src/components/ui/feedback/progress.tsx`

---

#### Tooltip
Hover tooltip.

```tsx
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui'

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>Hover me</TooltipTrigger>
    <TooltipContent>
      <p>Helpful tooltip text</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

**File:** `src/components/ui/feedback/tooltip.tsx`

---

### Overlay Components

#### Modal
Basic modal dialog.

```tsx
import { Modal, ConfirmModal } from '@/components/ui'

// Standard modal
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Edit Profile"
>
  <div>Modal content here</div>
</Modal>

// Confirmation modal
<ConfirmModal
  isOpen={isConfirmOpen}
  onClose={() => setIsConfirmOpen(false)}
  onConfirm={handleDelete}
  title="Delete Item"
  message="Are you sure? This cannot be undone."
  confirmText="Yes, delete"
  cancelText="Cancel"
/>
```

**File:** `src/components/ui/overlays/modal.tsx`

---

#### Dialog
Radix UI dialog (more advanced).

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui'

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogDescription>
        Make changes to your profile here.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4 py-4">
      {/* Form fields */}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSave}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**File:** `src/components/ui/overlays/dialog.tsx`

---

### Navigation Components

#### Tabs
Tabbed interface.

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
    <TabsTrigger value="reports">Reports</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    Overview content
  </TabsContent>
  <TabsContent value="analytics">
    Analytics content
  </TabsContent>
  <TabsContent value="reports">
    Reports content
  </TabsContent>
</Tabs>
```

**File:** `src/components/ui/navigation/tabs.tsx`

---

#### DropdownMenu
Context/dropdown menu.

```tsx
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui'

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onSelect={() => handleEdit()}>
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={() => handleDuplicate()}>
      Duplicate
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onSelect={() => handleDelete()}>
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**File:** `src/components/ui/navigation/dropdown-menu.tsx`

---

### Loading Components

#### Loading
Spinner with text.

```tsx
import { Loading } from '@/components/ui'

<Loading size="sm" />
<Loading size="md" text="Loading data..." />
<Loading size="lg" />

// Full page overlay
<Loading text="Processing..." overlay />
```

**File:** `src/components/ui/loading.tsx`

---

#### NewtonsCradleLoader
Animated physics loader.

```tsx
import { NewtonsCradleLoader } from '@/components/ui'

<NewtonsCradleLoader />
```

**File:** `src/components/ui/newtons-cradle.tsx`

---

## 📋 Form Components

### Dropdown
Advanced dropdown with search, create, multi-select.

```tsx
import { Dropdown } from '@/components'

// Basic dropdown
<Dropdown
  options={[
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' }
  ]}
  value={value}
  onValueChange={setValue}
  placeholder="Select option"
/>

// Searchable
<Dropdown
  options={options}
  value={value}
  onValueChange={setValue}
  allowTextInput
  placeholder="Search..."
/>

// Create new option
<Dropdown
  options={options}
  value={value}
  onValueChange={setValue}
  allowTextInput
  onCreateOption={async (text) => {
    const newItem = await createAPI(text)
    return { value: newItem.id, label: newItem.name }
  }}
/>

// Multi-select with tags
<Dropdown
  options={options}
  value={selectedIds}
  onValueChange={setSelectedIds}
  multiSelect
  showAsTags
/>

// API-driven
<Dropdown
  apiEndpoint="/api/customers"
  apiField="CustomerName"
  value={value}
  onValueChange={setValue}
  allowTextInput
/>
```

**Key Features:**
- ✅ Single & multi-select
- ✅ Searchable/filterable
- ✅ Create new options inline
- ✅ API integration with caching
- ✅ Tag display
- ✅ Keyboard navigation
- ✅ Custom option rendering

**Props:**
```typescript
interface DropdownProps {
  options?: DropdownOption[]
  value: string | number | string[]
  onValueChange: (value: string | number | string[]) => void
  placeholder?: string
  disabled?: boolean
  multiSelect?: boolean
  showAsTags?: boolean
  allowTextInput?: boolean
  onCreateOption?: (text: string) => Promise<DropdownOption>
  apiEndpoint?: string
  apiField?: string
}
```

**File:** `src/components/forms/dropdown.tsx`

---

### DatePicker
Date and date range picker.

```tsx
import { DatePicker } from '@/components/ui'

// Single date
<DatePicker
  value={date}
  onChange={setDate}
  placeholder="Select date"
/>

// Date range
<DatePicker
  mode="range"
  value={dateRange}
  onChange={setDateRange}
  placeholder="Select date range"
/>

// With min/max
<DatePicker
  value={date}
  onChange={setDate}
  minDate={new Date()}
  maxDate={new Date(2025, 11, 31)}
/>
```

**File:** `src/components/forms/date-picker/DatePicker.tsx`

---

### FileAttachment
File upload with preview and validation.

```tsx
import { FileAttachment } from '@/components/ui'

<FileAttachment
  value={files}
  onChange={setFiles}
  maxFiles={5}
  maxSize={10 * 1024 * 1024} // 10MB
  accept={{
    'image/*': ['.png', '.jpg', '.jpeg'],
    'application/pdf': ['.pdf']
  }}
/>
```

**File:** `src/components/forms/file-attachment/FileAttachment.tsx`

---

### UnifiedCurrencyDropdown
Currency selector with exchange rates.

```tsx
import { UnifiedCurrencyDropdown } from '@/components/ui'

<UnifiedCurrencyDropdown
  value={currency}
  onValueChange={setCurrency}
  showExchangeRate
  baseCurrency="USD"
/>
```

**File:** `src/components/forms/unified-currency-dropdown.tsx`

---

## 📊 DataGrid Components

### AdvancedDataGrid
Feature-rich data grid with 30+ capabilities.

```tsx
import { AdvancedDataGrid } from '@/components/datagrid'
import type { ColumnDef } from '@tanstack/react-table'

interface Product {
  id: string
  name: string
  price: number
  status: 'active' | 'inactive'
}

const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'name',
    header: 'Product Name',
    enableSorting: true,
    enableFiltering: true
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ getValue }) => `$${getValue<number>().toFixed(2)}`
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => (
      <Badge variant={getValue() === 'active' ? 'default' : 'secondary'}>
        {getValue()}
      </Badge>
    )
  }
]

<AdvancedDataGrid
  data={products}
  columns={columns}

  // Selection
  enableRowSelection
  rowSelectionMode="multi"  // or "single"
  onRowSelect={(rows) => console.log(rows)}

  // Sorting & Filtering
  enableSorting
  enableFiltering
  enableColumnSearch  // Baccha Search™

  // Pagination
  enablePagination
  pageSize={25}

  // Row Actions
  enableRowActions
  onRowEdit={(row) => handleEdit(row)}
  onRowDelete={(row) => handleDelete(row)}

  // Export/Import
  enableExport
  enableImport

  // Advanced Features
  enableRowReordering  // Drag & drop
  enableViewToggle     // All/Selected views
  enableVirtualization // Large datasets

  // Column Management
  enableColumnReordering
  enableColumnResizing
  enableColumnHiding
/>
```

**30+ Features:**
1. Row selection (single/multi, circular checkboxes)
2. Sorting (single/multi-column)
3. Filtering (advanced conditions)
4. Baccha Search™ (fuzzy search across all columns)
5. Pagination (client/server-side)
6. Row actions (edit, delete, custom)
7. Export (Excel, CSV, JSON)
8. Import (Excel, CSV, JSON with validation)
9. Row reordering (drag & drop in Selected view)
10. Column reordering (drag headers)
11. Column resizing (drag borders)
12. Column hiding/showing (column chooser)
13. Column freezing (pin left columns)
14. Inline editing (click to edit cells)
15. Keyboard navigation (arrows, Enter, Tab)
16. Cell range selection (Shift+Click)
17. Copy/paste (Ctrl+C/V)
18. Virtual scrolling (handle 100k+ rows)
19. Card view (alternative layout)
20. Data visualization (charts from grid data)
21. Custom cell renderers
22. Conditional formatting
23. Sticky headers
24. Loading states
25. Empty states
26. Error handling
27. Search highlighting
28. Filter badges
29. Selection summary
30. Auto-resize columns
31. Theme variants (5 themes)
32. Responsive design
33. Accessibility (ARIA labels, keyboard nav)

**View Modes:**
- **All View:** Shows all data with selection enabled
- **Selected View:** Shows only selected rows, enables row reordering, disables row click selection

**See:** `src/components/datagrid/README.md` for complete documentation

**File:** `src/components/datagrid/AdvancedDataGrid.tsx`

---

### SelectionCheckbox
Circular checkbox for grid selection (AG Grid style).

```tsx
import { SelectionCheckbox } from '@/components/datagrid'

// Checkbox mode (multi-select)
<SelectionCheckbox
  checked={isChecked}
  onChange={setChecked}
  circular
  mode="checkbox"
/>

// Radio mode (single-select)
<SelectionCheckbox
  checked={isSelected}
  onChange={setSelected}
  circular
  mode="radio"
/>

// Indeterminate
<SelectionCheckbox
  checked={someSelected}
  onChange={handleChange}
  indeterminate={!allSelected && someSelected}
/>
```

**File:** `src/components/datagrid/controls/SelectionCheckbox.tsx`

---

## 🏗️ Layout Components

### AppShell
Main application layout wrapper.

```tsx
import { AppShell } from '@/components/layout'

function App() {
  return (
    <AppShell>
      {children}
    </AppShell>
  )
}
```

Includes: Header, Dynamic Sidebar, Footer, Theme Customizer

**File:** `src/components/layout/app-shell.tsx`

---

### Header / Footer / DynamicSidebar

These are used internally by `AppShell`. See files for customization:
- `src/components/layout/header.tsx`
- `src/components/layout/footer.tsx`
- `src/components/layout/dynamic-sidebar.tsx` (API-driven menu)

---

## 🗂️ Master Data Components

Specialized components for managing master data (Items, Machines, Processes).

### MasterDataGrid

```tsx
import { MasterDataGrid } from '@/components/master'

<MasterDataGrid
  data={items}
  columns={columns}
  onAdd={handleAdd}
  onEdit={handleEdit}
  onDelete={handleDelete}
  title="Item Master"
/>
```

**File:** `src/components/master/MasterDataGrid.tsx`

### Master Modals

```tsx
import { ItemMasterModal, MachineMasterModal, ProcessMasterModal } from '@/components/master'

<ItemMasterModal
  isOpen={isOpen}
  onClose={onClose}
  onSave={handleSave}
  item={selectedItem}
/>
```

**Files:**
- `src/components/master/modals/ItemMasterModal.tsx`
- `src/components/master/modals/MachineMasterModal.tsx`
- `src/components/master/modals/ProcessMasterModal.tsx`

---

## 🪟 Modal Components

Application-specific modals for enquiries, API config, etc.

```tsx
import { EnquiryModal, ApiConfigModal, GlobalApiConfigModal } from '@/components/modals'

<EnquiryModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} />
<ApiConfigModal isOpen={isOpen} onClose={onClose} onSave={handleSave} />
<GlobalApiConfigModal isOpen={isOpen} onClose={onClose} />
```

**Files:**
- `src/components/modals/enquiry-modal.tsx`
- `src/components/modals/api-config-modal.tsx`
- `src/components/modals/global-api-config-modal.tsx`

---

## 🎭 Provider Components

### SessionProvider
NextAuth session wrapper.

```tsx
import { SessionProvider } from '@/components/providers'

export default function RootLayout({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}
```

**File:** `src/components/providers/session-provider.tsx`

---

### ApiProvider
API configuration context.

```tsx
import { ApiProvider } from '@/components/providers'

<ApiProvider>
  {children}
</ApiProvider>
```

**File:** `src/components/providers/api-provider.tsx`

---

## 🎨 Theme Components

### ThemeCustomizer / SimpleThemeCustomizer

```tsx
import { ThemeCustomizer } from '@/components/theme'

// Full customizer
<ThemeCustomizer />

// Simple theme selector
import { SimpleThemeCustomizer } from '@/components/theme'
<SimpleThemeCustomizer />
```

**Features:**
- 5 theme variants (Default Navy, Red, Green, Purple, Orange)
- Dark mode toggle
- Primary color customization
- Border radius adjustment
- Font size scaling
- Per-company theme persistence

**Files:**
- `src/components/theme/ThemeCustomizer.tsx`
- `src/components/theme/SimpleThemeCustomizer.tsx`

---

## 📈 Chart Components

### ChartContainer
Recharts wrapper with theme support.

```tsx
import { ChartContainer } from '@/components/charts'
import { LineChart, Line, XAxis, YAxis } from 'recharts'

<ChartContainer config={chartConfig}>
  <LineChart data={data}>
    <XAxis dataKey="month" />
    <YAxis />
    <Line dataKey="revenue" stroke="var(--color-primary)" />
  </LineChart>
</ChartContainer>
```

**File:** `src/components/charts/chart-container.tsx`

---

## 🎨 Design System

### CSS Variables (Design Tokens)

**Location:** `src/styles/tokens.css`

All components use CSS variables for theming. **Never use hardcoded colors.**

#### Background Colors
```css
--bg-app                /* Main app background */
--bg-surface            /* Card/surface background */
--bg-subtle             /* Subtle background */
--bg-hover              /* Hover background */
--bg-selected           /* Selected background */
```

#### Foreground Colors
```css
--fg-default            /* Default text color */
--fg-muted              /* Muted text */
--fg-subtle             /* Subtle text */
--fg-inverse            /* Inverse text (on dark) */
--fg-accent             /* Accent text */
```

#### Primary Brand Colors
```css
--color-primary         /* Primary brand color (#003366 Navy) */
--color-primary-hover   /* Primary hover state */
--color-primary-subtle  /* Primary subtle variant */
--color-primary-muted   /* Primary muted variant */
--color-primary-foreground  /* Text on primary */
```

#### Status Colors
```css
--color-success         /* Success/positive */
--color-success-hover   /* Success hover */
--color-success-subtle  /* Success subtle bg */

--color-warning         /* Warning/caution */
--color-warning-hover
--color-warning-subtle

--color-error           /* Error/danger */
--color-error-hover
--color-error-subtle

--color-info            /* Informational */
--color-info-hover
--color-info-subtle
```

#### Icon Colors
```css
--color-icon            /* Default icon color */
--color-icon-hover      /* Icon hover state */
--color-icon-accent     /* Accent icons */
```

#### Border Colors
```css
--bd-default            /* Default border */
--bd-strong             /* Strong border */
--bd-accent             /* Accent border */
```

### Usage in Tailwind

```tsx
// ❌ NEVER: Hardcoded colors
<div className="text-red-600 bg-blue-500 border-gray-300">

// ✅ ALWAYS: CSS variables
<div className="text-[rgb(var(--color-error))] bg-[rgb(var(--color-primary))] border-[rgb(var(--bd-default))]">

// ✅ ALWAYS: Use status color tokens
<div className="text-[rgb(var(--color-success))]">Success message</div>
<div className="text-[rgb(var(--color-warning))]">Warning message</div>
<div className="text-[rgb(var(--color-error))]">Error message</div>

// ✅ ALWAYS: Use icon color tokens
<Search className="h-4 w-4 text-[rgb(var(--color-icon))] hover:text-[rgb(var(--color-icon-hover))]" />
```

---

## 📦 Import Patterns

### Recommended Imports

```typescript
// ✅ UI Components (from centralized index)
import { Button, Input, Checkbox, Card, Badge, Alert } from '@/components/ui'

// ✅ DataGrid
import { AdvancedDataGrid, SelectionCheckbox } from '@/components/datagrid'

// ✅ Forms
import { Dropdown, DatePicker, FileAttachment } from '@/components'

// ✅ Layout
import { AppShell, Header, DynamicSidebar } from '@/components/layout'

// ✅ Master
import { MasterDataGrid, ItemMasterModal } from '@/components/master'

// ✅ Modals
import { EnquiryModal, ApiConfigModal } from '@/components/modals'

// ✅ Types
import type { ButtonProps, DropdownOption, AdvancedDataGridProps } from '@/components'
import type { ColumnDef } from '@tanstack/react-table'
```

### Backward Compatible Imports (Still Work)

```typescript
// ✅ Individual imports (re-exported for backward compatibility)
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { Dropdown } from '@/components/dropdown'
```

### ❌ Avoid

```typescript
// ❌ Don't import from implementation files
import { Button } from '@/components/ui/buttons/button'
import { Input } from '@/components/ui/forms/input'
```

---

## 🔧 Common Patterns

### Form with Validation

```tsx
import { Input, Button, Label, Alert } from '@/components/ui'
import { useState } from 'react'

function ValidatedForm() {
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name) newErrors.name = 'Name is required'
    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validate()

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await submitAPI(formData)
      // Success
    } catch (error) {
      setErrors({ submit: 'Failed to submit form' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.submit && (
        <Alert variant="destructive">
          <AlertDescription>{errors.submit}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className={errors.name ? 'border-[rgb(var(--color-error))]' : ''}
        />
        {errors.name && (
          <p className="text-sm text-[rgb(var(--color-error))] mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className={errors.email ? 'border-[rgb(var(--color-error))]' : ''}
        />
        {errors.email && (
          <p className="text-sm text-[rgb(var(--color-error))] mt-1">{errors.email}</p>
        )}
      </div>

      <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  )
}
```

### Data Grid with Actions

```tsx
import { AdvancedDataGrid } from '@/components/datagrid'
import { Button, Badge } from '@/components/ui'
import { Edit, Trash2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive'
}

function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedRows, setSelectedRows] = useState<User[]>([])

  const columns: ColumnDef<User>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ getValue }) => (
        <Badge variant={getValue() === 'admin' ? 'default' : 'secondary'}>
          {getValue() as string}
        </Badge>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue() as string
        return (
          <Badge
            className={
              status === 'active'
                ? 'bg-[rgb(var(--color-success-subtle))] text-[rgb(var(--color-success))]'
                : 'bg-[rgb(var(--color-error-subtle))] text-[rgb(var(--color-error))]'
            }
          >
            {status}
          </Badge>
        )
      }
    }
  ]

  const handleEdit = (user: User) => {
    // Open edit modal
  }

  const handleDelete = async (user: User) => {
    if (confirm(`Delete ${user.name}?`)) {
      await deleteUserAPI(user.id)
      setUsers(prev => prev.filter(u => u.id !== user.id))
    }
  }

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedRows.length} users?`)) {
      await Promise.all(selectedRows.map(u => deleteUserAPI(u.id)))
      setUsers(prev => prev.filter(u => !selectedRows.find(s => s.id === u.id)))
      setSelectedRows([])
    }
  }

  return (
    <div className="space-y-4">
      {selectedRows.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-[rgb(var(--bg-subtle))] rounded">
          <span>{selectedRows.length} users selected</span>
          <Button variant="destructive" onClick={handleBulkDelete}>
            Delete Selected
          </Button>
        </div>
      )}

      <AdvancedDataGrid
        data={users}
        columns={columns}
        enableRowSelection
        rowSelectionMode="multi"
        onRowSelect={setSelectedRows}
        enableRowActions
        onRowEdit={handleEdit}
        onRowDelete={handleDelete}
        enableSorting
        enableFiltering
        enablePagination
        pageSize={25}
      />
    </div>
  )
}
```

### Master-Detail View

```tsx
import { AdvancedDataGrid } from '@/components/datagrid'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'
import { useState } from 'react'

interface Order {
  id: string
  orderNumber: string
  customer: string
  total: number
}

interface OrderDetail {
  id: string
  product: string
  quantity: number
  price: number
}

function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([])

  const orderColumns = [...]
  const detailColumns = [...]

  const handleRowClick = async (order: Order) => {
    setSelectedOrder(order)
    const details = await fetchOrderDetails(order.id)
    setOrderDetails(details)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Master */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid
            data={orders}
            columns={orderColumns}
            onRowClick={handleRowClick}
            enableSorting
            enableFiltering
          />
        </CardContent>
      </Card>

      {/* Detail */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedOrder ? `Order ${selectedOrder.orderNumber}` : 'Select an order'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedOrder ? (
            <AdvancedDataGrid
              data={orderDetails}
              columns={detailColumns}
            />
          ) : (
            <p className="text-[rgb(var(--fg-muted))]">
              Click an order to view details
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

### Conditional Dropdown Options

```tsx
import { Dropdown } from '@/components'
import { useState, useMemo } from 'react'

function ConditionalDropdowns() {
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')

  const categories = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'clothing', label: 'Clothing' }
  ]

  // Subcategories depend on selected category
  const subcategories = useMemo(() => {
    const subcategoryMap = {
      electronics: [
        { value: 'laptops', label: 'Laptops' },
        { value: 'phones', label: 'Phones' }
      ],
      furniture: [
        { value: 'chairs', label: 'Chairs' },
        { value: 'desks', label: 'Desks' }
      ],
      clothing: [
        { value: 'shirts', label: 'Shirts' },
        { value: 'pants', label: 'Pants' }
      ]
    }
    return category ? subcategoryMap[category as keyof typeof subcategoryMap] || [] : []
  }, [category])

  return (
    <div className="space-y-4">
      <Dropdown
        options={categories}
        value={category}
        onValueChange={(val) => {
          setCategory(val as string)
          setSubcategory('') // Reset subcategory when category changes
        }}
        placeholder="Select category"
      />

      <Dropdown
        options={subcategories}
        value={subcategory}
        onValueChange={setSubcategory}
        placeholder="Select subcategory"
        disabled={!category}
      />
    </div>
  )
}
```

---

## 🔍 Troubleshooting

### Component Not Found Error

```
Error: Cannot find module '@/components/button'
```

**Solution:** Import from `@/components/ui` instead:
```typescript
// ❌ Wrong
import { Button } from '@/components/ui/buttons/button'

// ✅ Correct
import { Button } from '@/components/ui'
```

### Type Errors with Dropdown

```
Type 'string | number | string[]' is not assignable to type 'string'
```

**Solution:** Dropdown's `onValueChange` returns different types based on `multiSelect`:
```typescript
// Single select
<Dropdown
  value={value as string}
  onValueChange={(val) => setValue(val as string)}
/>

// Multi-select
<Dropdown
  multiSelect
  value={values as string[]}
  onValueChange={(val) => setValues(val as string[])}
/>
```

### DataGrid Not Showing Data

**Common Causes:**
1. **Missing `getRowId`:** If your data doesn't have an `id` field, provide `getRowId`:
```typescript
<AdvancedDataGrid
  data={data}
  columns={columns}
  getRowId={(row) => row.customId}
/>
```

2. **Column accessorKey mismatch:** Ensure `accessorKey` matches your data structure:
```typescript
// Data: { firstName: 'John' }
// ❌ Wrong
{ accessorKey: 'name', header: 'Name' }

// ✅ Correct
{ accessorKey: 'firstName', header: 'Name' }
```

3. **Empty data array:** Check if your data is actually populated

### CSS Variables Not Working

**Problem:** Colors appear as literal text `rgb(var(--color-primary))`

**Solution:** Ensure you've imported the global styles in your root layout:
```typescript
// app/layout.tsx
import '@/styles/globals.css'
import '@/styles/tokens.css'
```

### Selected View Shows "No Data"

**Problem:** Clicking rows in "Selected" view deselects them, causing "No data available"

**Solution:** This has been fixed in `AdvancedDataGrid.tsx:661`. If you're still experiencing this, ensure you're on the latest version.

**Behavior:** In Selected view, row click selection is disabled to prevent accidental deselection. Use the All view to select/deselect rows.

---

## 📚 Additional Resources

- **DataGrid Complete Guide:** `src/components/datagrid/README.md`
- **Design Tokens:** `src/styles/tokens.css`
- **Main README:** `README.md` (project root)
- **Example Implementations:** `src/app/(main)/dashboard/dashboard-content.tsx`

---

## 🤝 Contributing

When adding new components:

1. ✅ Place in appropriate category folder (`ui/forms/`, `ui/feedback/`, etc.)
2. ✅ Use TypeScript with proper types and interfaces
3. ✅ Export from category `index.ts` and main `ui/index.ts`
4. ✅ Use CSS variables for ALL colors (never hardcoded)
5. ✅ Follow existing component patterns and naming
6. ✅ Add JSDoc documentation for props
7. ✅ Include usage examples in this README
8. ✅ Test accessibility (ARIA labels, keyboard navigation)
9. ✅ Test with all theme variants
10. ✅ Create backward compatibility re-export in component root if needed

---

## 📊 Component Inventory

**Total Components:** 75+

### By Category
- **UI Components:** 40+
  - Forms: 6 (Input, Checkbox, Textarea, Label, Switch, Toggle)
  - Buttons: 2 (Button, Toggle)
  - Feedback: 4 (Alert, Progress, Badge, Tooltip)
  - Overlays: 3 (Modal, Dialog, ModalAlert)
  - Navigation: 3 (Tabs, DropdownMenu, NavigationProgress)
  - Display: 5 (Card, Text, Separator, Collapsible, StatsCard)
  - Loading: 2 (Loading, NewtonsCradle)
  - Other: 2 (ComboBox, CloseButton)

- **Form Components:** 5
  - Dropdown, DatePicker, FileAttachment, UnifiedCurrencyDropdown, QuantityInputPopup

- **DataGrid:** 1 main component + 30+ features

- **Layout:** 6 components

- **Master:** 4+ components

- **Modals:** 5+ components

- **Providers:** 2 components

- **Theme:** 2 components

- **Charts:** 1 component

---

**Version:** 2.0.0
**Last Updated:** October 6, 2025
**Maintained By:** Indusweb Development Team

---

**For AI Assistants:** This component library is production-ready and actively maintained. All components follow strict design token usage and are fully typed. When suggesting components to users, always verify the component exists in this README and use the correct import path. Prefer components from this library over creating new ones.
