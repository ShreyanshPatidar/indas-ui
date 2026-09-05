'use client'

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X, ChevronLeft } from "@/lib/icons"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

// =============================================================================
// SIZE PRESETS
// On mobile (<md): sm/md/lg/xl go full-screen for better usability
// =============================================================================
const modalSizes = {
  sm: 'max-w-md w-full mx-4 h-auto max-h-[90vh] max-md:max-w-full max-md:h-full max-md:max-h-none max-md:mx-0 max-md:rounded-none',
  md: 'max-w-lg w-full mx-4 h-auto max-h-[90vh] max-md:max-w-full max-md:h-full max-md:max-h-none max-md:mx-0 max-md:rounded-none',
  lg: 'max-w-2xl w-full mx-4 h-auto max-h-[90vh] max-md:max-w-full max-md:h-full max-md:max-h-none max-md:mx-0 max-md:rounded-none',
  xl: 'max-w-4xl w-full mx-4 h-auto max-h-[90vh] max-md:max-w-full max-md:h-full max-md:max-h-none max-md:mx-0 max-md:rounded-none',
  master: 'w-[90vw] h-[90vh] max-w-none max-md:w-full max-md:h-full max-md:rounded-none',
  fullscreen: 'w-[98vw] h-[98vh] max-w-none'
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * SSR-safe mobile detection hook
 * @param breakpoint - Pixel width threshold (default 768)
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}

/**
 * Stable ref wrapper — prevents React 19 infinite update loop caused by
 * @radix-ui/react-presence creating a new callback ref every render.
 */
function useStableRef<T>(forwardedRef: React.ForwardedRef<T>) {
  const forwardedRefRef = React.useRef(forwardedRef)
  React.useEffect(() => { forwardedRefRef.current = forwardedRef })
  const stableCallback = React.useCallback((node: T | null) => {
    const ref = forwardedRefRef.current
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }, [])
  return stableCallback
}

// =============================================================================
// MODAL CONTEXT — lets ModalTitle register its text for the mobile page header
// =============================================================================
const ModalMobileContext = React.createContext<{
  isMobilePage: boolean
  onClose?: () => void
}>({ isMobilePage: false })

// =============================================================================
// CORE COMPONENTS
// =============================================================================

/**
 * Nesting depth of the current modal. A modal rendered inside another modal's
 * React tree reads its parent's depth + 1. Used to stack z-index and to let
 * only the innermost modal own the device back button.
 */
const ModalDepthContext = React.createContext(0)

/** Lets a nested modal tell its parent it is open (+1) or closed (-1). */
const ModalChildRegistryContext = React.createContext<((delta: number) => void) | null>(null)

/** Reads whether THIS modal currently has an open child modal. */
const ModalHasOpenChildContext = React.createContext<{ current: number } | null>(null)

/** Monotonic id so each modal can recognise the history entry it pushed. */
let modalSentinelSeq = 0

export function useModalDepth(): number {
  return React.useContext(ModalDepthContext)
}

/**
 * Modal wrapper — intercepts the device back button in standalone PWA mode.
 * When a modal opens, a history entry is pushed. Pressing the device back
 * button fires `popstate` which closes the modal instead of navigating away.
 */
function Modal({ open, onOpenChange, ...props }: DialogPrimitive.DialogProps) {
  const parentDepth = React.useContext(ModalDepthContext)
  const depth = parentDepth + 1

  // Most controlled call sites pass `onOpenChange={onClose}` — a 0-arg handler
  // that ignores the boolean, so a Radix-fired onOpenChange(true) would read as
  // "close". For controlled modals the parent already owns `open`, so only the
  // close transition needs forwarding. Uncontrolled (trigger-driven) modals must
  // still receive `true` or they never open.
  const isControlled = open !== undefined
  const handleOpenChange = React.useCallback((next: boolean) => {
    if (isControlled && next) return
    onOpenChange?.(next)
  }, [isControlled, onOpenChange])

  const openRef = React.useRef(open)
  const onOpenChangeRef = React.useRef(handleOpenChange)
  openRef.current = open
  onOpenChangeRef.current = handleOpenChange

  // Tracks how many child modals are open beneath this one, so Escape and
  // outside-clicks are handled by the innermost modal only. (The back button is
  // handled separately, by sentinel id — a counter is cleared too early to be
  // reliable there.)
  const childOpenCountRef = React.useRef(0)
  const registerChild = React.useContext(ModalChildRegistryContext)

  React.useEffect(() => {
    if (!open) return
    registerChild?.(1)
    return () => { registerChild?.(-1) }
  }, [open, registerChild])

  const childRegistry = React.useCallback((delta: number) => {
    childOpenCountRef.current += delta
  }, [])

  React.useEffect(() => {
    if (!open) return

    // Only manage history on mobile — desktop doesn't need back-button interception
    const isMobileDevice = window.matchMedia('(max-width: 768px)').matches
    if (!isMobileDevice) return

    // Push a sentinel tagged with THIS modal's identity, so we can tell our own
    // dismissal apart from a nested child retracting its entry. Without the id
    // the parent closes too when a child modal applies or cancels.
    const id = ++modalSentinelSeq
    window.history.pushState({ __modal: true, __modalId: id }, '')
    let selfPopped = false

    const onPopState = () => {
      // React only when OUR sentinel is the one that just left the stack.
      // After a child pops its own entry ours becomes top-of-stack again —
      // that means we survived, not that we were dismissed.
      const state = window.history.state
      if (state && state.__modal && state.__modalId === id) return
      // Our entry is gone and no deeper modal owns the new top: this is a real
      // back-button press aimed at us.
      if (childOpenCountRef.current > 0) return
      selfPopped = true
      if (openRef.current) {
        onOpenChangeRef.current?.(false)
      }
    }

    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('popstate', onPopState)
      // Closing normally (Apply / Cancel / X) — retract our own sentinel so the
      // history stack doesn't grow. If the back button already popped it,
      // calling back() again would navigate the real page away.
      if (selfPopped) return
      const state = window.history.state
      if (state && state.__modal && state.__modalId === id) {
        window.history.back()
      }
    }
  }, [open])

  return (
    <ModalHasOpenChildContext.Provider value={childOpenCountRef}>
      <ModalDepthContext.Provider value={depth}>
        <ModalChildRegistryContext.Provider value={childRegistry}>
          <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange} {...props} />
        </ModalChildRegistryContext.Provider>
      </ModalDepthContext.Provider>
    </ModalHasOpenChildContext.Provider>
  )
}

/**
 * ADAPTIVE TRIGGER
 *
 * On desktop: opens the modal dialog as normal.
 * On mobile + mobilePageUrl: navigates to a dedicated page instead,
 * so users get native back-button support and full-screen real estate.
 */
const ModalTrigger = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger> & {
    mobilePageUrl?: string
    onMobileNavigate?: (url: string) => void
    mobileBreakpoint?: number
  }
>(({ className, mobilePageUrl, onMobileNavigate, mobileBreakpoint = 768, onClick, ...props }, ref) => {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (mobilePageUrl && typeof window !== 'undefined') {
      const isMobile = window.matchMedia(`(max-width: ${mobileBreakpoint}px)`).matches
      if (isMobile) {
        e.preventDefault()
        e.stopPropagation()
        onMobileNavigate?.(mobilePageUrl)
        router.push(mobilePageUrl)
        return
      }
    }
    onClick?.(e)
  }

  return (
    <DialogPrimitive.Trigger
      ref={ref}
      className={className}
      onClick={handleClick}
      {...props}
    />
  )
})
ModalTrigger.displayName = "ModalTrigger"

const ModalPortal = DialogPrimitive.Portal
const ModalClose = DialogPrimitive.Close

// Overlay with backdrop blur
const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px]",
      // z-index may be overridden inline by ModalContent for nested modals
      className
    )}
    {...props}
  />
))
ModalOverlay.displayName = DialogPrimitive.Overlay.displayName

/**
 * ADAPTIVE MODAL CONTENT
 *
 * Desktop: standard Radix dialog overlay (unchanged)
 * Mobile: renders as a full-screen page with a back-arrow header.
 *         No Radix overlay/portal — just a fixed div on top of everything.
 *         ModalHeader/ModalTitle inside become the page header automatically.
 */
const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    hideCloseButton?: boolean
    disableOutsideClick?: boolean
    size?: keyof typeof modalSizes
  }
>(({ className, children, hideCloseButton, disableOutsideClick, size, style, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
  const stableRef = useStableRef(ref)
  const isMobile = useIsMobile()
  // Nested modals must paint above their parent. Radix portals every modal to
  // <body>, so equal z-index makes stacking fall back to DOM order and the
  // child renders behind / overlapping the parent.
  const depth = useModalDepth()
  const zIndex = 100 + (depth - 1) * 10

  // Radix delivers Escape to every open Dialog. Without this, closing a nested
  // modal with Escape also closes its parent.
  const hasOpenChild = React.useContext(ModalHasOpenChildContext)
  const handleEscapeKeyDown = React.useCallback((e: KeyboardEvent) => {
    if (hasOpenChild && hasOpenChild.current > 0) e.preventDefault()
  }, [hasOpenChild])

  // On mobile: render as a full-screen page
  if (isMobile) {
    return (
      <DialogPrimitive.Portal>
        {/* No overlay on mobile — the page IS the modal */}
        <DialogPrimitive.Content
          ref={stableRef}
          aria-describedby={ariaDescribedBy}
          style={{ zIndex, ...style }}
          className={cn(
            "fixed inset-0 flex flex-col",
            "bg-[rgb(var(--bg-surface))]",
            className
          )}
          // Always block outside click on mobile — there's nothing "outside"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={handleEscapeKeyDown}
          {...props}
        >
          <ModalMobileContext.Provider value={{ isMobilePage: true, onClose: undefined }}>
            {children}
          </ModalMobileContext.Provider>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    )
  }

  // Desktop: unchanged Radix dialog
  return (
    <ModalPortal>
      <ModalOverlay style={{ zIndex: zIndex - 1 }} />
      <DialogPrimitive.Content
        ref={stableRef}
        aria-describedby={ariaDescribedBy}
        style={{ zIndex, ...style }}
        className={cn(
          "fixed left-[50%] top-[50%] grid translate-x-[-50%] translate-y-[-50%]",
          "border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] shadow-lg",
          "rounded-lg sm:rounded-lg",
          size ? modalSizes[size] : "max-w-lg w-full mx-4 h-auto max-h-[85vh]",
          // Gap + padding only for standard modals — fullscreen/master/p-0 modals
          // run their own flush header/body/footer layout, so the gap shows as bands.
          size !== 'master' && size !== 'fullscreen' && !className?.includes('p-0') && "gap-3 sm:gap-4 p-4 sm:p-6",
          className
        )}
        onInteractOutside={(e) => {
          // A nested modal is open — clicks belong to it, not the parent.
          if (disableOutsideClick || (hasOpenChild && hasOpenChild.current > 0)) {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={handleEscapeKeyDown}
        {...props}
      >
        {children}
        {!hideCloseButton && (
          <DialogPrimitive.Close className="absolute right-2 top-2 sm:right-4 sm:top-4 rounded-sm opacity-70 ring-offset-[rgb(var(--bg-surface))] transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-[rgb(var(--bg-hover))] data-[state=open]:text-[rgb(var(--fg-muted))]">
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-[rgb(var(--color-icon))]" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </ModalPortal>
  )
})
ModalContent.displayName = DialogPrimitive.Content.displayName

/**
 * ADAPTIVE HEADER
 *
 * Desktop: renders as normal header div
 * Mobile page mode: renders as a sticky top bar with a back arrow (ChevronLeft)
 *                   that closes the modal, plus the title inline
 */
const ModalHeader = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { isMobilePage } = React.useContext(ModalMobileContext)

  if (isMobilePage) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-3 border-b border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] shrink-0",
          className
        )}
        {...props}
      >
        <DialogPrimitive.Close className="p-1.5 -ml-1 rounded-lg text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-hover))] transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </DialogPrimitive.Close>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props}>
      {children}
    </div>
  )
}
ModalHeader.displayName = "ModalHeader"

const ModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)
ModalFooter.displayName = "ModalFooter"

const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight text-[rgb(var(--fg-default))]", className)}
    {...props}
  />
))
ModalTitle.displayName = DialogPrimitive.Title.displayName

const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-[rgb(var(--fg-muted))]", className)}
    {...props}
  />
))
ModalDescription.displayName = DialogPrimitive.Description.displayName

// Backwards compatibility aliases
export const Dialog = Modal
export const DialogTrigger = ModalTrigger
export const DialogPortal = ModalPortal
export const DialogClose = ModalClose
export const DialogOverlay = ModalOverlay
export const DialogContent = ModalContent
export const DialogHeader = ModalHeader
export const DialogFooter = ModalFooter
export const DialogTitle = ModalTitle
export const DialogDescription = ModalDescription

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
}
