'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MoreHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FABAction {
  label: string
  onClick: () => void
}

interface FloatingActionButtonProps {
  actions: FABAction[]
  className?: string
}

export function FloatingActionButton({ actions, className }: FloatingActionButtonProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const dragging = useRef(false)
  const hasMoved = useRef(false)
  const startPointer = useRef({ x: 0, y: 0 })
  const startPos = useRef({ x: 0, y: 0 })
  const fabRef = useRef<HTMLDivElement>(null)

  // Initialise position from saved value or default bottom-right
  useEffect(() => {
    const saved = localStorage.getItem('fabPos')
    if (saved) {
      try { setPos(JSON.parse(saved)) } catch { /* ignore */ }
    } else {
      setPos({ x: window.innerWidth - 64, y: window.innerHeight - 100 })
    }
  }, [])

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!fabRef.current) return
    dragging.current = true
    hasMoved.current = false
    startPointer.current = { x: e.clientX, y: e.clientY }
    const rect = fabRef.current.getBoundingClientRect()
    startPos.current = { x: rect.left, y: rect.top }
    fabRef.current.setPointerCapture(e.pointerId)
    e.preventDefault()
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !fabRef.current) return
    const dx = e.clientX - startPointer.current.x
    const dy = e.clientY - startPointer.current.y
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasMoved.current = true
    const size = 48
    const newX = clamp(startPos.current.x + dx, 0, window.innerWidth - size)
    const newY = clamp(startPos.current.y + dy, 0, window.innerHeight - size)
    setPos({ x: newX, y: newY })
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    dragging.current = false
    if (pos) localStorage.setItem('fabPos', JSON.stringify(pos))
    // Only toggle open if it was a tap, not a drag
    if (!hasMoved.current) setOpen(prev => !prev)
    e.preventDefault()
  }, [pos])

  const handleAction = (action: FABAction) => {
    setOpen(false)
    action.onClick()
  }

  if (!pos) return null

  const actionsAbove = pos.y > window.innerHeight / 2

  return (
    <div
      ref={fabRef}
      style={{ left: pos.x, top: pos.y, touchAction: 'none' }}
      className={cn('fixed z-50 lg:hidden', className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Action items */}
      {open && (
        <div
          className={cn(
            'absolute right-0 flex flex-col gap-2 w-48 animate-in fade-in duration-200',
            actionsAbove
              ? 'bottom-full mb-4 slide-in-from-bottom-4'
              : 'top-full mt-4 slide-in-from-top-4'
          )}
          onPointerDown={e => e.stopPropagation()}
        >
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => handleAction(action)}
              className={cn(
                'w-full justify-start px-4 py-2.5 rounded-xl text-sm font-semibold text-left',
                'bg-[rgb(var(--bg-surface))]/95 hover:bg-[rgb(var(--bg-surface))]',
                'text-[rgb(var(--color-primary))]',
                'border-2 border-[rgb(var(--color-success))]/60 hover:border-[rgb(var(--color-success))]',
                'shadow-md hover:shadow-lg backdrop-blur-sm',
                'transition-all duration-200 hover:scale-105 active:scale-95',
                'whitespace-nowrap'
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Main FAB button */}
      <button
        className={cn(
          'h-12 w-12 rounded-xl flex items-center justify-center',
          'bg-[rgb(var(--color-primary))]/50 hover:bg-[rgb(var(--color-primary))]/65',
          'border-2 border-[rgb(var(--color-primary))]/60 hover:border-[rgb(var(--color-primary))]/75',
          'shadow-lg',
          'transition-all duration-300 ease-out',
          'hover:scale-110 active:scale-95',
          open && 'rotate-45'
        )}
        aria-label={open ? 'Close actions' : 'Open actions'}
        aria-expanded={open}
        onPointerDown={e => e.stopPropagation()}
        onClick={() => !hasMoved.current && setOpen(prev => !prev)}
      >
        {open
          ? <X className="h-8 w-8 text-[rgb(var(--color-primary-foreground))] stroke-[3] transition-transform duration-300" />
          : <MoreHorizontal className="h-8 w-8 text-[rgb(var(--color-primary-foreground))] stroke-[3] transition-transform duration-300" />
        }
      </button>
    </div>
  )
}
