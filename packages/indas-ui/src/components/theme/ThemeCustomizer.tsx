'use client'

import React, { useState } from 'react'
import { useTheme, useCustomThemeGenerator } from '@/hooks/useTheme'
import { Button } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Input } from '@/components/ui'
import { Switch } from '@/components/ui'
import { Badge } from '@/components/ui'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui'
import type { ThemeVariant } from '@/lib/theme/types'
import { useTranslation } from '@/hooks/useTranslation'
import {
  Palette,
  Sun,
  Moon,
  Check,
  RefreshCw,
  Layers,
  Sparkles,
  Zap,
  X
} from 'lucide-react'

// Define theme variants outside component to avoid translation issues with t()
const getThemeVariants = (t: (key: string) => string): Array<{
  variant: ThemeVariant
  name: string
  description: string
  color: string
  gradient: string
}> => [
  {
    variant: 'default',
    name: t('Default'),
    description: t('Modern blue tones - Professional and trustworthy'),
    color: '#003366',
    gradient: 'from-blue-900 to-blue-700'
  },
  {
    variant: 'green',
    name: t('Forest'),
    description: t('Nature-inspired greens - Growth and harmony'),
    color: '#047857',
    gradient: 'from-green-700 to-emerald-600'
  },
  {
    variant: 'red',
    name: t('Crimson'),
    description: t('Bold red accents - Energy and passion'),
    color: '#B91C1C',
    gradient: 'from-red-700 to-rose-600'
  },
  {
    variant: 'purple',
    name: t('Royal'),
    description: t('Regal purple hues - Luxury and creativity'),
    color: '#7C3AED',
    gradient: 'from-purple-700 to-violet-600'
  },
  {
    variant: 'orange',
    name: t('Sunset'),
    description: t('Warm sunset palette - Optimism and warmth'),
    color: '#C2410C',
    gradient: 'from-orange-700 to-amber-600'
  },
  {
    variant: 'black',
    name: t('Midnight'),
    description: t('Deep night shades - Sophistication and depth'),
    color: '#000000',
    gradient: 'from-gray-900 to-black'
  },
  {
    variant: 'custom',
    name: t('Custom Color'),
    description: t('AI Generated'),
    color: '#1a365d',
    gradient: 'from-indigo-900 to-blue-800'
  },
]

interface ThemeCustomizerProps {
  className?: string
  showModeToggle?: boolean
  compact?: boolean
  mode?: 'card' | 'dialog'
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function ThemeCustomizerContent({
  showModeToggle = true,
  compact = false
}: Omit<ThemeCustomizerProps, 'mode' | 'open' | 'onOpenChange' | 'className'>) {
  const { t } = useTranslation()
  const {
    theme,
    setVariant,
    setMode,
    toggleMode,
    isDark,
    customTheme,
    removeCustomTheme
  } = useTheme()

  const { generateFromColor } = useCustomThemeGenerator()
  const [customColor, setCustomColor] = useState('#3B82F6')
  const [customName, setCustomName] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Get translated theme variants
  const THEME_VARIANTS = getThemeVariants(t)

  const handleVariantChange = (variant: ThemeVariant) => {
    setVariant(variant)
  }

  const handleCustomColorGenerate = async () => {
    if (!customColor) return

    setIsGenerating(true)
    try {
      const result = generateFromColor(customColor, customName || t('Custom Color'))
      if (!result.success) {
        console.error('Failed to generate theme:', result.error)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        {/* Quick Theme Selector */}
        <div className="flex gap-1 p-1 bg-[rgb(var(--bg-subtle))] rounded-lg">
          {THEME_VARIANTS.slice(0, 5).map(({ variant, color, name }) => (
            <button
              key={variant}
              onClick={() => handleVariantChange(variant)}
              className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                theme.variant === variant
                  ? 'border-[rgb(var(--bd-accent))] ring-2 ring-[rgb(var(--color-primary))] ring-offset-2'
                  : 'border-[rgb(var(--bd-default))] hover:border-[rgb(var(--bd-strong))]'
              }`}
              style={{ backgroundColor: color }}
              title={name}
            />
          ))}
        </div>

        {/* Mode Toggle */}
        {showModeToggle && (
          <Button
            onClick={toggleMode}
            variant="outline"
            size="sm"
            className="gap-2"
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header + Mode Toggle in One Row */}
      <div className="flex items-center justify-between p-3 bg-[rgb(var(--bg-subtle))] rounded-lg border border-[rgb(var(--bd-default))]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] rounded-lg">
            <Palette className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[rgb(var(--fg-default))]">
              {t('Theme Customizer')}
            </p>
            <p className="text-xs text-[rgb(var(--fg-muted))]">
              {t('Full control over your app appearance')}
            </p>
          </div>
        </div>
        {showModeToggle && (
          <div className="flex items-center gap-2.5">
            <p className="text-sm font-medium text-[rgb(var(--fg-default))] hidden sm:block">
              {isDark ? t('Dark mode') : t('Light mode')}
            </p>
            <Switch checked={isDark} onCheckedChange={toggleMode} />
          </div>
        )}
      </div>

      {/* Theme Variants Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-[rgb(var(--fg-default))]">
            {t('Color Themes')}
          </h4>
          <Badge variant="secondary" className="text-xs gap-1">
            <Zap className="h-3 w-3" />
            {t('Primary/Secondary/Tertiary')}
          </Badge>
        </div>

        {/* Preset Themes - 3 columns x 2 rows */}
        <div className="grid grid-cols-3 gap-2">
          {THEME_VARIANTS.filter(v => v.variant !== 'custom').map(({ variant, name, color }) => (
            <button
              key={variant}
              onClick={() => handleVariantChange(variant)}
              className={`group flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:bg-[rgb(var(--bg-hover))] ${
                theme.variant === variant
                  ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--bg-subtle))] ring-2 ring-[rgb(var(--color-primary))] ring-offset-1'
                  : 'border-[rgb(var(--bd-default))]'
              }`}
              title={THEME_VARIANTS.find(t => t.variant === variant)?.description}
            >
              {/* Color Preview - 3 bars stacked */}
              <div className="flex gap-0.5 w-full h-12">
                <div
                  className="flex-1 rounded-l"
                  style={{ backgroundColor: color }}
                  title={t('Primary')}
                />
                <div
                  className="flex-1"
                  style={{ backgroundColor: color, opacity: 0.7 }}
                  title={t('Secondary')}
                />
                <div
                  className="flex-1 rounded-r"
                  style={{ backgroundColor: color, opacity: 0.4 }}
                  title={t('Tertiary')}
                />
              </div>

              {/* Theme Name */}
              <div className="flex items-center gap-1.5 w-full justify-center">
                <span className="font-medium text-xs text-[rgb(var(--fg-default))] truncate">
                  {name.replace(' Navy', '').replace(' Green', '').replace(' Red', '').replace(' Purple', '').replace(' Orange', '').replace(' Black', '')}
                </span>
                {theme.variant === variant && (
                  <Check className="h-3.5 w-3.5 text-[rgb(var(--color-primary))] flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Color Generator - Always Show */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-[rgb(var(--fg-default))]">
            {t('Custom Color')}
          </h4>
          <Badge variant="secondary" className="text-xs gap-1">
            <Sparkles className="h-3 w-3" />
            {t('AI Generated')}
          </Badge>
        </div>

        <div className="p-3 bg-gradient-to-br from-[rgb(var(--bg-subtle))] to-transparent rounded-lg border-2 border-[rgb(var(--bd-default))]">
          <div className="space-y-3">
            {/* Row 1: Theme Name + Color Picker */}
            <div className="grid grid-cols-2 gap-3">
              {/* Theme Name */}
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--fg-muted))] mb-2">
                  {t('Theme Name')}
                </label>
                <Input
                  value={customName}
                  onChange={(e) => {
                    setCustomName(e.target.value)
                    // Auto-switch to custom theme when typing
                    if (e.target.value && theme.variant !== 'custom') {
                      handleVariantChange('custom')
                    }
                  }}
                  placeholder={t('e.g., Indas Brand Theme')}
                  className="text-sm"
                />
              </div>

              {/* Primary Brand Color */}
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--fg-default))] mb-2">
                  {t('Primary Brand Color')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value)
                      // Auto-switch to custom theme and auto-generate
                      if (theme.variant !== 'custom') {
                        handleVariantChange('custom')
                      }
                      // Auto-generate after color change
                      setTimeout(() => handleCustomColorGenerate(), 300)
                    }}
                    className="w-10 h-10 rounded border-2 border-[rgb(var(--bd-default))] cursor-pointer"
                    title="Pick color"
                  />
                  <Input
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value)
                      // Auto-switch to custom theme when typing
                      if (e.target.value && theme.variant !== 'custom') {
                        handleVariantChange('custom')
                      }
                    }}
                    onBlur={handleCustomColorGenerate}
                    placeholder="#3B82F6"
                    className="text-sm font-mono flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Live Preview + Generate Button */}
            <div className="grid grid-cols-2 gap-3">
              {/* Live Preview */}
              <div className="p-2 bg-[rgb(var(--bg-surface))] rounded border border-[rgb(var(--bd-default))]">
                <p className="text-[10px] font-medium text-[rgb(var(--fg-muted))] mb-1.5">{t('Live Preview')}</p>
                <div className="grid grid-cols-3 gap-1">
                  <div
                    className="h-10 rounded flex items-center justify-center text-white text-[9px] font-semibold"
                    style={{ backgroundColor: customColor }}
                  >
                    {t('Primary')}
                  </div>
                  <div
                    className="h-10 rounded flex items-center justify-center text-white text-[9px] font-semibold"
                    style={{
                      backgroundColor: (() => {
                        const hex = customColor
                        const rgb = parseInt(hex.slice(1), 16)
                        const r = Math.min(255, ((rgb >> 16) & 255) + 25)
                        const g = Math.min(255, ((rgb >> 8) & 255) + 25)
                        const b = Math.min(255, (rgb & 255) + 25)
                        return `rgb(${r}, ${g}, ${b})`
                      })()
                    }}
                  >
                    {t('Secondary')}
                  </div>
                  <div
                    className="h-10 rounded flex items-center justify-center text-white text-[9px] font-semibold"
                    style={{
                      backgroundColor: (() => {
                        const hex = customColor
                        const rgb = parseInt(hex.slice(1), 16)
                        const r = Math.min(255, ((rgb >> 16) & 255) + 50)
                        const g = Math.min(255, ((rgb >> 8) & 255) + 50)
                        const b = Math.min(255, (rgb & 255) + 50)
                        return `rgb(${r}, ${g}, ${b})`
                      })()
                    }}
                  >
                    {t('Tertiary')}
                  </div>
                </div>
              </div>

              {/* Generate Buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleCustomColorGenerate}
                  disabled={isGenerating || !customColor}
                  className="flex-1"
                  size="sm"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                      {t('Loading...')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mr-2" />
                      {t('Apply Theme')}
                    </>
                  )}
                </Button>

                {customTheme && (
                  <Button onClick={removeCustomTheme} variant="outline" size="sm">
                    {t('Reset')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

/**
 * ThemeCustomizer - Universal Theme Component
 *
 * Supports multiple modes:
 * - Card mode (for settings pages)
 * - Dialog mode (for header/floating popup)
 * - Compact mode (for toolbar/quick access)
 */
export function ThemeCustomizer({
  className,
  showModeToggle = true,
  compact = false,
  mode = 'card',
  open,
  onOpenChange
}: ThemeCustomizerProps) {
  const { t } = useTranslation()

  // Dialog Mode
  if (mode === 'dialog') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] rounded-lg">
                <Palette className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg">{t('Theme Customizer')}</DialogTitle>
                <p className="text-xs text-[rgb(var(--fg-muted))] mt-1">
                  {t('Full control over your app appearance')}
                </p>
              </div>
            </div>
          </DialogHeader>
          <ThemeCustomizerContent
            showModeToggle={showModeToggle}
            compact={compact}
          />
        </DialogContent>
      </Dialog>
    )
  }

  // Card Mode (default)
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <ThemeCustomizerContent
          showModeToggle={showModeToggle}
          compact={compact}
        />
      </CardContent>
    </Card>
  )
}

/**
 * Floating Theme Toggle Button - Quick Access
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggleMode } = useTheme()

  return (
    <Button
      onClick={toggleMode}
      variant="outline"
      size="sm"
      className={`fixed bottom-4 left-4 z-50 rounded-full w-12 h-12 p-0 shadow-lg hover:shadow-xl transition-all ${className}`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}

/**
 * Quick Theme Switcher - Compact Inline Version
 */
export function QuickThemeSwitcher({ className }: { className?: string }) {
  return (
    <div className={className}>
      <ThemeCustomizerContent compact={true} />
    </div>
  )
}

/**
 * Theme Variant Selector - Ultra Compact
 */
export function ThemeVariantSelector({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { theme, setVariant } = useTheme()
  const THEME_VARIANTS = getThemeVariants(t)

  return (
    <div className={`flex gap-1 p-1 bg-[rgb(var(--bg-subtle))] rounded-lg ${className}`}>
      {THEME_VARIANTS.slice(0, 5).map(({ variant, color, name }) => (
        <button
          key={variant}
          onClick={() => setVariant(variant)}
          className={`w-6 h-6 rounded border-2 transition-all ${
            theme.variant === variant
              ? 'border-[rgb(var(--bd-accent))] scale-110'
              : 'border-[rgb(var(--bd-default))] hover:border-[rgb(var(--bd-strong))]'
          }`}
          style={{ backgroundColor: color }}
          title={name}
        />
      ))}
    </div>
  )
}
