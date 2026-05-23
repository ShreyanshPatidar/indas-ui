# Dropdown Component System

> **Fully centralized dropdown/select component with single-select, multi-select, and custom input support**

---

## 📁 File Structure

```
dropdown/
├── Dropdown.tsx              # Main component + shared styles + subcomponents
│   ├── dropdownSharedStyles  # Centralized styling constants
│   ├── getDropdownClassName  # Style helper functions
│   ├── DropdownSearch        # Search input component
│   ├── DropdownTrigger       # Trigger button component
│   └── Dropdown              # Main orchestrator component
├── SingleSelect.tsx          # Single-select UI (uses Radix UI)
├── MultiSelect.tsx           # Multi-select UI (custom implementation)
├── types.ts                  # TypeScript interfaces
├── hooks/
│   ├── useDropdownState.ts      # State management logic
│   ├── useDropdownFiltering.ts  # Search filtering logic
│   └── useDropdownCreate.ts     # Custom option creation logic
├── index.ts                  # Barrel export
└── README.md                 # This file
```

**Total: 7 files, ~900 lines**

---

## 🎯 Architecture Philosophy

### Centralized Styling
All dropdown styles live in **ONE place**: `Dropdown.tsx > dropdownSharedStyles`

```typescript
// Single source of truth for ALL dropdown styling
export const dropdownSharedStyles = {
  trigger: { base, focus, error, normal, disabled, autoWidth, fullWidth },
  tag: { base, removeButton },
  clearButton,
  chevron: { base, open },
  content: { base, animations },
  viewport,
  item: { base, states, disabled, colors },
  checkboxItem: { base, states, disabled },
  createButton,
  empty
}
```

**Benefits:**
- ✅ Change styles once, applies everywhere
- ✅ Zero duplication between SingleSelect and MultiSelect
- ✅ Consistent look and feel guaranteed
- ✅ Easy to maintain and update

### Component Hierarchy

```
┌─────────────────────────────────────────────────┐
│            Dropdown.tsx (Main)                  │
│  ┌───────────────────────────────────────────┐  │
│  │  dropdownSharedStyles (Centralized)       │  │
│  │  - trigger, tag, chevron, content styles  │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  DropdownSearch Component                 │  │
│  │  - Search input with icon                 │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  DropdownTrigger Component                │  │
│  │  - Trigger button (multi-select)          │  │
│  │  - Uses dropdownSharedStyles              │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  Dropdown Component (Orchestrator)        │  │
│  │  - Routes to SingleSelect/MultiSelect     │  │
│  │  - Manages state with hooks               │  │
│  └───────────────────────────────────────────┘  │
└──────────────┬──────────────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌──────────────┐  ┌────────────────┐
│ SingleSelect │  │  MultiSelect   │
│  (Radix UI)  │  │   (Custom)     │
│  Uses shared │  │  Uses shared   │
│    styles    │  │    styles      │
└──────────────┘  └────────────────┘
```

---

## 🚀 Quick Start

### Basic Usage

```tsx
import { Dropdown } from '@/components'

// Single select
<Dropdown
  options={[
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
  ]}
  value={selectedValue}
  onValueChange={setSelectedValue}
  placeholder="Select an option..."
/>

// Multi-select with tags
<Dropdown
  options={options}
  value={selectedArray}
  onValueChange={setSelectedArray}
  multiSelect={true}
  showAsTags={true}
/>

// With custom input
<Dropdown
  options={options}
  value={value}
  onValueChange={setValue}
  allowCustomInput={true}
/>
```

---

## 📝 Props Reference

### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `DropdownOption[]` | `[]` | List of selectable options |
| `value` | `string \| number \| string[]` | - | Selected value(s) |
| `onValueChange` | `(value) => void` | - | Callback when selection changes |
| `placeholder` | `string` | `"Select an option"` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable the dropdown |
| `error` | `boolean` | `false` | Show error state (red border) |
| `label` | `string` | - | Label above dropdown |
| `required` | `boolean` | `false` | Show required asterisk |

### Selection Mode

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `multiSelect` | `boolean` | `false` | Enable multi-select mode |
| `showAsTags` | `boolean` | `false` | Show selections as tags (multi-select) |
| `showSelectedCount` | `boolean` | `true` | Show "X selected" text |
| `maxSelections` | `number` | - | Limit number of selections |

### Custom Input

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `allowCustomInput` | `boolean` | `false` | Allow typing custom values |
| `allowTextInput` | `boolean` | `false` | Enable text input mode |
| `onCreateOption` | `(value: string) => DropdownOption` | - | Custom option creation handler |
| `createOptionLabel` | `string` | `"Create"` | Label for create button |
| `allowCustomValues` | `boolean` | `false` | Allow any custom value |

### UI Customization

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `autoWidth` | `boolean` | `false` | Auto-size based on content |
| `searchable` | `boolean` | `true` | Enable search/filter |
| `clearable` | `boolean` | `false` | Show clear button (X) |
| `className` | `string` | - | Container class |
| `triggerClassName` | `string` | - | Trigger button class |
| `customFooter` | `ReactNode` | - | Custom footer content |

### Advanced

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `loading` | `boolean` | `false` | Show loading state |
| `emptyMessage` | `string` | `"No options found"` | Empty state message |
| `onOpen` | `() => void` | - | Callback when dropdown opens |

---

## 🔧 Component Breakdown

### 1. **Dropdown.tsx** - Main File (500+ lines)

Contains **everything** centralized:

#### `dropdownSharedStyles` (lines 18-78)
```typescript
// Centralized styling object
export const dropdownSharedStyles = {
  trigger: {
    base: "flex items-center justify-between rounded-md border...",
    focus: "focus-within:outline-none focus-within:ring-2...",
    error: "border-red-500 focus-within:border-red-500...",
    normal: "border-border hover:border-gray-400...",
    disabled: "cursor-not-allowed opacity-50",
    autoWidth: "w-fit max-w-[20rem]",
    fullWidth: "w-full"
  },
  tag: {
    base: "inline-flex items-center gap-1 px-2 py-0.5...",
    removeButton: "hover:bg-blue-200 rounded-full p-0.5..."
  },
  // ... all other shared styles
}
```

#### `getDropdownClassName` (lines 83-96)
```typescript
// Helper functions for complex className combinations
export const getDropdownClassName = {
  content: () => `${base} ${animations.open} ${animations.close}...`,
  item: () => `${base} ${states} ${disabled} ${colors}`,
  checkboxItem: () => `${base} ${states} ${disabled}`
}
```

#### `DropdownSearch` Component (lines 107-128)
- Search input with Search icon
- Clear button (X) when search has text
- Used by both SingleSelect and MultiSelect

#### `DropdownTrigger` Component (lines 151-281)
- Trigger button for multi-select
- Shows selected count or tags (1-3 tags, then "X selected")
- Chevron icon with rotation animation
- Clear button overlay
- **Uses `dropdownSharedStyles` for all styling**

#### `Dropdown` Component (lines 283-503)
- Main orchestrator
- Routes to SingleSelect or MultiSelect
- Uses 3 custom hooks for logic separation
- Smart positioning for modals
- Click-outside detection

### 2. **SingleSelect.tsx** (~200 lines)

Single-selection dropdown using **Radix UI**:
- `@radix-ui/react-select` for accessibility
- Portal-based positioning
- Custom trigger with selected value
- Search input integration
- Create option support
- **Imports and uses `dropdownSharedStyles` from Dropdown.tsx**

```typescript
import { getDropdownClassName, dropdownSharedStyles, DropdownSearch } from './Dropdown'

// Uses shared styles
<SelectPrimitive.Content className={getDropdownClassName.content()}>
  <SelectPrimitive.Viewport className={dropdownSharedStyles.viewport}>
    <SelectPrimitive.Item className={getDropdownClassName.item()}>
```

### 3. **MultiSelect.tsx** (~150 lines)

Multi-selection dropdown with **custom implementation**:
- Checkbox-based selection
- Custom positioning logic (top/bottom, left/right)
- Tag display in trigger
- Portal rendering
- Click-outside detection
- **Imports and uses `dropdownSharedStyles` from Dropdown.tsx**

```typescript
import { getDropdownClassName, dropdownSharedStyles, DropdownSearch } from './Dropdown'

// Uses shared styles
<div className={getDropdownClassName.content()}>
  <div className={dropdownSharedStyles.viewport}>
    <button className={getDropdownClassName.checkboxItem()}>
```

### 4. **Custom Hooks** (Separate Files)

#### `useDropdownState.ts` (37 lines)
**Purpose:** State management

```typescript
const {
  allOptions,        // Combined created + provided options
  selectedValues,    // Array of selected values (normalized to strings)
  selectedOptions,   // Array of selected option objects
  selectedOption     // Single selected option (for single-select)
} = useDropdownState(value, multiSelect, options, createdOptions)
```

**What it does:**
- Merges user-created options with provided options
- Normalizes values to string arrays (handles both single and multi-select)
- Computes selected options from values
- All with `useMemo` for performance

#### `useDropdownFiltering.ts` (31 lines)
**Purpose:** Search filtering

```typescript
const {
  filteredOptions,     // Options matching search term
  showCreateOption     // Whether to show "Create X" button
} = useDropdownFiltering(allOptions, searchTerm, enableTextInput)
```

**What it does:**
- Filters options by search term (case-insensitive)
- Determines if create button should show (no exact match)
- Returns empty array if no search term

#### `useDropdownCreate.ts` (69 lines)
**Purpose:** Custom option creation

```typescript
const {
  createdOptions,           // Options created by user
  isCreating,               // Loading state during creation
  enableTextInput,          // Whether to show search input
  effectiveCreateOption,    // Function to create new option
  handleCreateOption        // Handler for create button click
} = useDropdownCreate(allowTextInput, allowCustomInput, onCreateOption)
```

**What it does:**
- Manages created options state
- Provides auto-create function for `allowCustomInput` mode
- Handles async option creation
- Auto-selects newly created option
- Closes dropdown after creation (single-select only)

---

## 🎨 Styling System

### Centralized Approach

**All styling lives in `dropdownSharedStyles`:**

```typescript
// ✅ CORRECT - Change once, applies everywhere
// In Dropdown.tsx
export const dropdownSharedStyles = {
  item: {
    base: "py-1.5 pl-8 pr-2 text-sm"
  }
}

// In SingleSelect.tsx
<SelectPrimitive.Item className={getDropdownClassName.item()}>

// In MultiSelect.tsx
<button className={getDropdownClassName.checkboxItem()}>
```

**Benefits:**
- Update `dropdownSharedStyles.item.base` → applies to both SingleSelect and MultiSelect
- No need to remember which files to update
- Impossible to have inconsistent styling

### Width Behavior

**Default (`autoWidth={false}`):**
- Trigger: Full container width (`w-full`)
- Content: Auto-sizes to content, max `20rem` (320px)

**Auto Width (`autoWidth={true}`):**
- Trigger: Auto-sizes to content, max `20rem`
- Content: Auto-sizes to content, max `20rem`

### Responsive Design

All max-widths use **rem units** (not px):
- `max-w-[20rem]` = 320px at default font size
- Scales with user font size settings
- More accessible than hardcoded pixels

### Text Overflow

All text uses `truncate` for clean ellipsis:
- Long labels: `"Very Long Option Name..."` (shows full text on hover via `title`)
- No wrapping in dropdowns
- Consistent across all dropdown types

---

## 🧩 Option Interface

```typescript
interface DropdownOption {
  value: string | number       // Unique identifier
  label: string                // Display text
  description?: string         // Optional subtitle (shown below label)
  disabled?: boolean           // Disable this option
  group?: string              // Group name (for future grouping support)
}
```

### Example with All Properties

```tsx
const options: DropdownOption[] = [
  {
    value: 'machine-1',
    label: 'Heidelberg Speedmaster',
    description: 'Primary production unit - 40" sheet',
  },
  {
    value: 'machine-2',
    label: 'Komori Lithrone',
    description: 'Secondary unit - 28" sheet',
    disabled: true  // Grayed out, not selectable
  }
]
```

---

## 📦 Common Use Cases

### 1. Simple Single Select
```tsx
<Dropdown
  label="Select Machine"
  options={machines}
  value={selectedMachine}
  onValueChange={setSelectedMachine}
  placeholder="Choose a machine..."
/>
```

### 2. Multi-Select with Tags (1-3 shown)
```tsx
<Dropdown
  label="Select Categories"
  options={categories}
  value={selectedCategories}
  onValueChange={setSelectedCategories}
  multiSelect={true}
  showAsTags={true}
  maxSelections={5}
/>
```

**Behavior:**
- 0 selections: Shows placeholder
- 1-3 selections: Shows individual tags with X buttons
- 4+ selections: Shows "4 selected" with single X to clear all

### 3. Searchable with Custom Values
```tsx
<Dropdown
  label="Customer Name"
  options={existingCustomers}
  value={customer}
  onValueChange={setCustomer}
  allowCustomInput={true}
  searchable={true}
  clearable={true}
  placeholder="Type or select customer..."
/>
```

**Flow:**
1. User types "New Customer"
2. If no match → shows "Create New Customer" button
3. Clicks button → creates `{ value: "New Customer", label: "New Customer" }`
4. Auto-selects and closes dropdown

### 4. Compact Width (Auto-size)
```tsx
<Dropdown
  options={statusOptions}
  value={status}
  onValueChange={setStatus}
  autoWidth={true}
  placeholder="Status"
/>
```

**Perfect for:**
- Inline filters
- Toolbar buttons
- Compact forms

### 5. Custom Create Handler
```tsx
<Dropdown
  options={tags}
  value={selectedTags}
  onValueChange={setSelectedTags}
  multiSelect={true}
  allowTextInput={true}
  onCreateOption={async (inputValue) => {
    // Custom logic - e.g., API call
    const newTag = await createTagAPI(inputValue)
    return {
      value: newTag.id,
      label: newTag.name,
      description: 'Newly created tag'
    }
  }}
/>
```

---

## 🔍 Advanced Features

### Smart Positioning (Multi-Select)

Multi-select automatically positions to prevent overflow:

```typescript
// Vertical positioning
const viewport = { height: window.innerHeight }
const spaceBelow = viewport.height - rect.bottom

setDropdownPosition(spaceBelow >= 300 ? 'bottom' : 'top')

// Horizontal alignment (in modals)
const spaceRight = viewport.width - rect.left
setDropdownAlign(spaceRight >= dropdownWidth ? 'left' : 'right')
```

**Result:**
- Always visible, never cut off
- Works in modals and scrollable containers
- Flips position automatically

### Click Outside Detection

```typescript
React.useEffect(() => {
  if (!open || !multiSelect) return

  const handleClickOutside = (event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target)) {
      setOpen(false)
      setSearchTerm('')
    }
  }

  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [open, multiSelect])
```

**Result:**
- Click outside closes multi-select dropdown
- Clears search term on close
- Single-select uses Radix's built-in handling

---

## 🛠️ Maintenance Guide

### How to Change Dropdown Styling

**✅ CORRECT - Change in ONE place:**

```typescript
// Edit: Dropdown.tsx
export const dropdownSharedStyles = {
  item: {
    base: "py-2 pl-10 pr-3 text-base"  // Changed padding and text size
  }
}
```

**Result:** Applies to **both** SingleSelect and MultiSelect automatically

**❌ WRONG - Don't edit individual files:**
```typescript
// Don't edit SingleSelect.tsx or MultiSelect.tsx directly
// They import and use dropdownSharedStyles
```

### Adding New Shared Styles

1. Add to `dropdownSharedStyles` in `Dropdown.tsx`:
```typescript
export const dropdownSharedStyles = {
  // ... existing styles
  newStyle: "your-tailwind-classes-here"
}
```

2. Use in SingleSelect/MultiSelect:
```typescript
<div className={dropdownSharedStyles.newStyle}>
```

### File Organization Rules

**Keep Separate:**
- `Dropdown.tsx` - Main component + shared styles + subcomponents
- `SingleSelect.tsx` - Single-select UI (Radix UI)
- `MultiSelect.tsx` - Multi-select UI (custom)
- `hooks/*.ts` - Business logic separated from UI

**Why?**
- **Dropdown.tsx** = Single source of truth for styles
- **SingleSelect/MultiSelect** = Different UI libraries, can't merge
- **Hooks** = Testable, reusable logic

**Don't merge:**
- SingleSelect and MultiSelect (different libraries and approaches)
- Hooks into main files (separates logic from UI)

---

## 🐛 Known Issues

**None currently.** All dropdown types have consistent:
- ✅ Styling (centralized in `dropdownSharedStyles`)
- ✅ Width behavior (`w-auto max-w-[20rem]`)
- ✅ Text overflow (truncate with ellipsis)
- ✅ Positioning (smart auto-positioning)
- ✅ Accessibility (Radix for single, custom ARIA for multi)

---

## 📚 Related Components

- **Input** - Used by DropdownSearch for text input
- **Checkbox** - Used by MultiSelect for selection
- **Button** - Used for create/clear actions
- **Badge** - Could be used for tag display (future)

---

## 🔗 References

- [Radix UI Select](https://www.radix-ui.com/primitives/docs/components/select) - Used by SingleSelect
- [Tailwind CSS](https://tailwindcss.com) - Styling framework
- [Lucide Icons](https://lucide.dev) - Icons (Search, ChevronDown, X, Check, Plus)

---

## 📊 Migration History

### January 2025 - Full Centralization

**Before:**
```
dropdown/
├── Dropdown.tsx (main)
├── DropdownTrigger.tsx (188 lines - duplicated styles)
├── DropdownSearch.tsx (34 lines - separate file)
├── SingleSelectContent.tsx (duplicated styles)
├── MultiSelectContent.tsx (duplicated styles)
└── types.ts
```

**After:**
```
dropdown/
├── Dropdown.tsx (centralized - all shared code)
├── SingleSelect.tsx (uses shared styles)
├── MultiSelect.tsx (uses shared styles)
└── types.ts
```

**Changes:**
1. Merged `DropdownTrigger.tsx` into `Dropdown.tsx`
2. Merged `DropdownSearch.tsx` into `Dropdown.tsx`
3. Created `dropdownSharedStyles` for centralized styling
4. Renamed `SingleSelectContent` → `SingleSelect`
5. Renamed `MultiSelectContent` → `MultiSelect`
6. Updated all components to use shared styles

**Benefits:**
- ✅ Reduced from 6 files to 4 files
- ✅ Zero code duplication
- ✅ Single source of truth for styling
- ✅ Easier to maintain and update
- ✅ Cleaner naming (removed "Content" suffix)

---

**Last Updated:** January 2025 (Centralization Refactor)
**Maintained by:** Development Team
**Status:** ✅ Production Ready
