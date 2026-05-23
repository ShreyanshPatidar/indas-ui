// UI Components - Centralized exports with organized folder structure

// ============================================================================
// FORMS
// ============================================================================
export { Button, InputButton, CheckboxButton } from './buttons/button'
export type { ButtonProps, InputButtonProps, CheckboxButtonProps } from './buttons/button'

export { Input } from './forms/input'
export type { InputProps } from './forms/input'

export { Checkbox } from './forms/checkbox'
export type { CheckboxProps } from './forms/checkbox'

export { Label } from './forms/label'

export { Textarea } from './forms/textarea'

export { Switch } from './forms/switch'

// ============================================================================
// DROPDOWNS
// ============================================================================
export { Dropdown } from '../forms/dropdown'
export type { DropdownProps, DropdownOption } from '../forms/dropdown'

export { UnifiedCurrencyDropdown } from '../forms/unified-currency-dropdown'
export type { UnifiedCurrencyDropdownProps } from '../forms/unified-currency-dropdown'

// ============================================================================
// DATE & FILE
// ============================================================================
export { DatePicker } from '../forms/date-picker'
export type { DatePickerProps, DateRange } from '../forms/date-picker'

export { FileAttachment } from '../forms/file-attachment'
export type { FileAttachmentProps, AttachedFile } from '../forms/file-attachment'

// ============================================================================
// DISPLAY COMPONENTS
// ============================================================================
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './display/card'
export type { CardProps } from './display/card'

export { StatsCard, StatsGrid } from './display/stats-card'
export type { StatsCardProps, StatsGridProps } from './display/stats-card'

export { Text } from './display/text'
export type { TextProps } from './display/text'

export { Separator } from './display/separator'

export { Collapsible, CollapsibleTrigger, CollapsibleContent } from './display/collapsible'

export { FormToggle } from './form-toggle'
export type { FormToggleProps } from './form-toggle'

// ============================================================================
// FEEDBACK COMPONENTS
// ============================================================================
export { Badge, FilterBadge, FilterBadgeGroup } from './feedback/badge'
export type { BadgeProps, FilterBadgeProps, FilterBadgeVariant, FilterBadgeItem, FilterBadgeGroupProps } from './feedback/badge'

export { BooleanBadge } from './display/boolean-badge'
export type { BooleanBadgeProps } from './display/boolean-badge'

export { Alert, AlertTitle, AlertDescription } from './feedback/alert'

export { Progress } from './feedback/progress'

export { Tooltip, TooltipTrigger, TooltipContent, TooltipDetailed, TooltipProvider } from './feedback/tooltip'

export { Skeleton, SkeletonText, SkeletonFormFields } from './feedback/skeleton'
export { SkeletonTable } from './feedback/skeleton-table'

// ============================================================================
// OVERLAYS & MODALS
// ============================================================================
// Unified Modal component - exports both Modal* and Dialog* (backwards compatibility)
export {
  Modal,
  ModalPortal,
  ModalOverlay,
  ModalClose,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  // Backwards compatibility exports
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
} from '../modals/Modal'

export { useModalAlert, ModalAlert } from '../modals/modal-alert'
export type { AlertAction } from '../modals/modal-alert'

// ============================================================================
// NAVIGATION
// ============================================================================
// Modern pill tabs component
export { Tabs } from './navigation/tabs'
export type { TabsProps, TabItem } from './navigation/tabs'

export { HeaderSteps } from './navigation/header-steps'
export type { HeaderStepItem } from './navigation/header-steps'

// Legacy Radix tabs for backwards compatibility
export { TabsRoot as RadixTabs, TabsList, TabsTrigger, TabsContent } from './navigation/tabs'

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup } from './navigation/dropdown-menu'

// ============================================================================
// LOADING STATES
// ============================================================================
export { Loading, LoadingStates, LoadingOverlay, PageLoading, NavigationProgress } from './overlays/loading'
export type { LoadingProps, PageLoadingProps } from './overlays/loading'
