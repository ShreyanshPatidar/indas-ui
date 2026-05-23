# Modal Components

This directory contains reusable modal components for the application.

## StandardModal

A flexible, reusable modal component that follows the project's design system with CSS variable colors.

### Features

✅ **Consistent Design**: Matches all modals in the application (gradient header, proper footer)
✅ **CSS Variables**: Uses `rgb(var(--color-name))` for theming support
✅ **Flexible Sizing**: 5 predefined sizes (sm, md, lg, xl, full)
✅ **Built-in Footer**: Automatic Save/Cancel buttons or custom actions
✅ **Accessibility**: Proper ARIA labels and descriptions
✅ **Optional Badge**: Show status/type in header
✅ **Subtitle Support**: Additional context in header

### Usage

#### Basic Example

```tsx
import { StandardModal } from '@/components/modals'

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)

  const handleSave = () => {
    // Save logic
    console.log('Saving...')
    setIsOpen(false)
  }

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Edit User"
      onSave={handleSave}
      saveLabel="Update User"
    >
      <div className="space-y-4">
        <Input label="Name" />
        <Input label="Email" />
      </div>
    </StandardModal>
  )
}
```

#### With Badge and Subtitle

```tsx
<StandardModal
  isOpen={isOpen}
  onClose={onClose}
  title="Add Content Details"
  subtitle="Configure dimensions, materials, and other details"
  badge={{
    label: 'Type: Box',
    variant: 'outline'
  }}
  size="xl"
  onSave={handleSave}
>
  {/* Your form content */}
</StandardModal>
```

#### Custom Footer Actions

```tsx
<StandardModal
  isOpen={isOpen}
  onClose={onClose}
  title="Advanced Settings"
  footerActions={
    <>
      <Button variant="outline" onClick={onReset}>Reset</Button>
      <Button variant="secondary" onClick={onPreview}>Preview</Button>
      <Button variant="primary" onClick={onSave}>Apply</Button>
    </>
  }
>
  {/* Your content */}
</StandardModal>
```

#### No Footer

```tsx
<StandardModal
  isOpen={isOpen}
  onClose={onClose}
  title="Information"
  showFooter={false}
>
  <p>This is a read-only modal.</p>
</StandardModal>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen`* | `boolean` | - | Controls modal visibility |
| `onClose`* | `() => void` | - | Called when modal should close |
| `title`* | `string` | - | Modal title in header |
| `children`* | `ReactNode` | - | Modal body content |
| `subtitle` | `string` | - | Optional subtitle below title |
| `badge` | `{ label: string, variant?: string }` | - | Optional badge in header |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'lg'` | Modal size |
| `className` | `string` | - | Additional CSS classes |
| `hideCloseButton` | `boolean` | `false` | Hide X button in header |
| `showFooter` | `boolean` | `true` | Show/hide footer |
| `footerActions` | `ReactNode` | - | Custom footer buttons |
| `onSave` | `() => void` | - | Save button handler |
| `onCancel` | `() => void` | - | Cancel button handler (defaults to onClose) |
| `saveLabel` | `string` | `'Save'` | Save button text |
| `cancelLabel` | `string` | `'Cancel'` | Cancel button text |
| `saveIcon` | `LucideIcon` | `Save` | Save button icon |
| `cancelIcon` | `LucideIcon` | `XCircle` | Cancel button icon |
| `saving` | `boolean` | `false` | Show loading state on save button |
| `ariaDescribedBy` | `string` | `'modal-description'` | ARIA described-by ID |
| `ariaDescription` | `string` | - | Accessibility description |

\* Required props

### Size Reference

- **sm**: `500px × 400px` - Small modals (confirmations, simple forms)
- **md**: `700px × 600px` - Medium modals (standard forms)
- **lg**: `90vw × 80vh` - Large modals (complex forms)
- **xl**: `95vw × 90vh` - Extra large (multi-section forms)
- **full**: `98vw × 98vh` - Full screen (planning, estimation)

### CSS Variables Used

The component uses the following CSS variables for consistent theming:

- `--bg-surface` - Modal background
- `--bg-subtle` - Subtle background (unused in base component)
- `--fg-default` - Default text color
- `--fg-muted` - Muted text color
- `--bd-default` - Border color

All colors are applied using the `rgb(var(--variable-name))` pattern to support alpha channels.

### Migration Guide

#### Before (Custom Modal)

```tsx
import { Dialog, DialogContent, DialogHeader } from '@/components/ui'
import { Footer } from '@/components/layout'

return (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="w-[90vw] h-[90vh] p-0 flex flex-col">
      <DialogHeader className="px-6 pt-3 pb-2 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <DialogTitle>My Modal</DialogTitle>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Content */}
      </div>

      <Footer variant="modal" gradient={true} actions={...} />
    </DialogContent>
  </Dialog>
)
```

#### After (StandardModal)

```tsx
import { StandardModal } from '@/components/modals'

return (
  <StandardModal
    isOpen={isOpen}
    onClose={onClose}
    title="My Modal"
    size="xl"
    onSave={handleSave}
  >
    {/* Content */}
  </StandardModal>
)
```

### Examples in Codebase

See these files for real-world usage:

- `src/app/(main)/enquiry/ContentModal.tsx` - Content details modal with grid selection
- `src/app/(main)/master/machine/MachineMasterModal.tsx` - Complex multi-tab modal
- `src/app/(main)/estimation/modals/planning-modal.tsx` - Full-screen planning modal

---

## Other Modal Components

### ImageModal

Modal for displaying and exporting images/diagrams with export options (PNG, SVG, PDF).

**Usage:**
```tsx
import { ImageModal } from '@/components/modals'

<ImageModal
  title="Sheet Layout"
  preview={<SheetPreview />}
>
  <SheetLayoutDiagram />
</ImageModal>
```

### SignOutConfirmationModal

Specialized modal for sign-out confirmation with session info, task warnings, and device management.

**Usage:**
```tsx
import { SignOutConfirmationModal } from '@/components/modals'

<SignOutConfirmationModal
  isOpen={isOpen}
  onClose={onClose}
  onSignOut={handleSignOut}
  onSignOutEverywhere={handleSignOutEverywhere}
  sessionData={{
    duration: '2h 30m',
    startTime: new Date(),
    tasks: { overdue: 2, dueSoon: 5, total: 15 },
    activeDevices: devices
  }}
/>
```

### APIConfigModal & GlobalAPIConfigModal

Internal modals for API configuration and testing.

---

## Best Practices

1. **Always use CSS variables** for colors - never hardcode colors
2. **Use StandardModal** for new modals unless you need specialized behavior
3. **Provide aria-description** for accessibility
4. **Use appropriate size** - don't default to 'full' unless needed
5. **Keep modal content simple** - complex layouts should be componentized
6. **Handle loading states** - use `saving` prop when performing async operations
7. **Test keyboard navigation** - ESC should close, Enter should save (if applicable)

---

**Last Updated:** 2025-01-28
**Maintained by:** Development Team
