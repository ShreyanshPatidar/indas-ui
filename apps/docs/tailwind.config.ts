import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/indas-ui/src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/indas-ui/dist/**/*.{js,cjs}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ===== SEMANTIC COLOR SYSTEM =====
        // Background tokens
        'bg-app': 'rgb(var(--bg-app) / <alpha-value>)',
        'bg-surface': 'rgb(var(--bg-surface) / <alpha-value>)',
        'bg-header': 'rgb(var(--bg-header) / <alpha-value>)',
        'bg-sidebar': 'rgb(var(--bg-sidebar) / <alpha-value>)',
        'bg-subtle': 'rgb(var(--bg-subtle) / <alpha-value>)',
        'bg-hover': 'rgb(var(--bg-hover) / <alpha-value>)',
        'bg-selected': 'rgb(var(--bg-selected) / <alpha-value>)',
        'bg-overlay': 'rgb(var(--bg-overlay) / <alpha-value>)',

        // Foreground tokens
        'fg-default': 'rgb(var(--fg-default) / <alpha-value>)',
        'fg-muted': 'rgb(var(--fg-muted) / <alpha-value>)',
        'fg-subtle': 'rgb(var(--fg-subtle) / <alpha-value>)',
        'fg-inverse': 'rgb(var(--fg-inverse) / <alpha-value>)',
        'fg-accent': 'rgb(var(--fg-accent) / <alpha-value>)',

        // Primary color system
        'primary': 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-hover': 'rgb(var(--color-primary-hover) / <alpha-value>)',
        'primary-subtle': 'rgb(var(--color-primary-subtle) / <alpha-value>)',
        'primary-muted': 'rgb(var(--color-primary-muted) / <alpha-value>)',
        'primary-foreground': 'rgb(var(--color-primary-foreground) / <alpha-value>)',

        // Secondary color system
        'secondary': 'rgb(var(--color-secondary) / <alpha-value>)',
        'secondary-hover': 'rgb(var(--color-secondary-hover) / <alpha-value>)',
        'secondary-subtle': 'rgb(var(--color-secondary-subtle) / <alpha-value>)',
        'secondary-muted': 'rgb(var(--color-secondary-muted) / <alpha-value>)',
        'secondary-foreground': 'rgb(var(--color-secondary-foreground) / <alpha-value>)',

        // Tertiary color system
        'tertiary': 'rgb(var(--color-tertiary) / <alpha-value>)',
        'tertiary-hover': 'rgb(var(--color-tertiary-hover) / <alpha-value>)',
        'tertiary-subtle': 'rgb(var(--color-tertiary-subtle) / <alpha-value>)',
        'tertiary-muted': 'rgb(var(--color-tertiary-muted) / <alpha-value>)',
        'tertiary-foreground': 'rgb(var(--color-tertiary-foreground) / <alpha-value>)',

        // Legacy accent colors (compatibility)
        'accent': 'rgb(var(--color-accent) / <alpha-value>)',
        'accent-hover': 'rgb(var(--color-accent-hover) / <alpha-value>)',
        'accent-subtle': 'rgb(var(--color-accent-subtle) / <alpha-value>)',
        'accent-muted': 'rgb(var(--color-accent-muted) / <alpha-value>)',

        // Border tokens
        'bd-default': 'rgb(var(--bd-default) / <alpha-value>)',
        'bd-strong': 'rgb(var(--bd-strong) / <alpha-value>)',
        'bd-subtle': 'rgb(var(--bd-subtle) / <alpha-value>)',
        'bd-accent': 'rgb(var(--bd-accent) / <alpha-value>)',

        // Status colors
        'success': 'rgb(var(--color-success) / <alpha-value>)',
        'success-hover': 'rgb(var(--color-success-hover) / <alpha-value>)',
        'success-subtle': 'rgb(var(--color-success-subtle) / <alpha-value>)',
        'success-muted': 'rgb(var(--color-success-muted) / <alpha-value>)',

        'warning': 'rgb(var(--color-warning) / <alpha-value>)',
        'warning-hover': 'rgb(var(--color-warning-hover) / <alpha-value>)',
        'warning-subtle': 'rgb(var(--color-warning-subtle) / <alpha-value>)',
        'warning-muted': 'rgb(var(--color-warning-muted) / <alpha-value>)',

        'error': 'rgb(var(--color-error) / <alpha-value>)',
        'error-hover': 'rgb(var(--color-error-hover) / <alpha-value>)',
        'error-subtle': 'rgb(var(--color-error-subtle) / <alpha-value>)',
        'error-muted': 'rgb(var(--color-error-muted) / <alpha-value>)',

        // Icon colors
        'icon': 'rgb(var(--color-icon) / <alpha-value>)',
        'icon-hover': 'rgb(var(--color-icon-hover) / <alpha-value>)',
        'icon-accent': 'rgb(var(--color-icon-accent) / <alpha-value>)',

        // Shadcn/UI compatibility aliases (keeping for component library compatibility)
        'shadcn-primary': 'rgb(var(--color-primary) / <alpha-value>)',
        'shadcn-primary-foreground': 'rgb(var(--color-primary-foreground) / <alpha-value>)',
        'shadcn-secondary': 'rgb(var(--color-secondary-subtle) / <alpha-value>)',
        'shadcn-secondary-foreground': 'rgb(var(--color-secondary-foreground) / <alpha-value>)',
        'muted': 'rgb(var(--bg-subtle) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--fg-muted) / <alpha-value>)',
        'card': 'rgb(var(--bg-surface) / <alpha-value>)',
        'card-foreground': 'rgb(var(--fg-default) / <alpha-value>)',
        'border': 'rgb(var(--bd-default) / <alpha-value>)',
        'input': 'rgb(var(--bg-surface) / <alpha-value>)',
        'ring': 'rgb(var(--bd-accent) / <alpha-value>)',
        'background': 'rgb(var(--bg-app) / <alpha-value>)',
        'foreground': 'rgb(var(--fg-default) / <alpha-value>)',
        'destructive': 'rgb(var(--color-error) / <alpha-value>)',
        'destructive-foreground': 'rgb(var(--fg-inverse) / <alpha-value>)',
      },
      fontSize: {
        // Semantic font size tokens
        xs: ['var(--font-size-xs)', { lineHeight: 'var(--line-height-xs)' }],
        sm: ['var(--font-size-sm)', { lineHeight: 'var(--line-height-sm)' }],
        base: ['var(--font-size-md)', { lineHeight: 'var(--line-height-md)' }],
        lg: ['var(--font-size-lg)', { lineHeight: 'var(--line-height-lg)' }],
        xl: ['var(--font-size-xl)', { lineHeight: 'var(--line-height-xl)' }],
        '2xl': ['var(--font-size-2xl)', { lineHeight: 'var(--line-height-2xl)' }],
        '3xl': ['var(--font-size-3xl)', { lineHeight: 'var(--line-height-3xl)' }],
        '4xl': ['var(--font-size-4xl)', { lineHeight: 'var(--line-height-4xl)' }],
      },
      fontWeight: {
        normal: 'var(--font-weight-normal)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
      },
      spacing: {
        // Semantic spacing tokens
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
      },
      borderRadius: {
        // Semantic radius tokens
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        // Semantic shadow tokens
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      // Component-specific utilities
      maxWidth: {
        'screen-2xl': '1536px',
      },
      // Focus ring configuration
      ringColor: {
        DEFAULT: 'rgb(var(--color-accent) / 0.5)',
      },
      ringOffsetColor: {
        DEFAULT: 'rgb(var(--bg-app))',
      },
      // Animation configuration
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-out': 'fadeOut 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'attention-pulse': 'attention-pulse 2.5s ease-in-out infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        // Chat message animations
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.98) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        sendBubble: {
          '0%': { transform: 'translateY(10px) scale(0.96)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'attention-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(var(--color-warning) / 0)' },
          '50%': { boxShadow: '0 0 0 4px rgb(var(--color-warning) / 0.15)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-8deg)' },
          '75%': { transform: 'rotate(8deg)' },
        },
      },
      // Transition configuration
      transitionDuration: {
        DEFAULT: '150ms',
        fast: '100ms',
        slow: '300ms',
      },
    },
  },
  plugins: [
    // Custom plugin for semantic utilities
    function ({ addUtilities, addComponents }: any) {
      // Focus ring utilities
      addUtilities({
        '.focus-ring': {
          '@apply focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-bg-app': {},
        },
        '.focus-ring-error': {
          '@apply focus:outline-none focus:ring-2 focus:ring-error/50 focus:ring-offset-2 focus:ring-offset-bg-app': {},
        },
        '.focus-ring-success': {
          '@apply focus:outline-none focus:ring-2 focus:ring-success/50 focus:ring-offset-2 focus:ring-offset-bg-app': {},
        },
      })

      // Component base classes
      addComponents({
        // Button semantic styles
        '.btn-primary': {
          '@apply bg-accent text-fg-inverse hover:bg-accent-hover focus-ring disabled:opacity-50 disabled:cursor-not-allowed': {},
        },
        '.btn-secondary': {
          '@apply bg-bg-subtle text-fg-default border border-bd-default hover:bg-bg-hover focus-ring': {},
        },
        '.btn-ghost': {
          '@apply text-fg-default hover:bg-bg-hover focus-ring': {},
        },
        '.btn-destructive': {
          '@apply bg-error text-fg-inverse hover:bg-error-hover focus-ring-error': {},
        },

        // Input semantic styles
        '.input-base': {
          '@apply bg-bg-surface text-fg-default border border-bd-default rounded-md px-3 py-2 placeholder:text-fg-subtle focus-ring disabled:opacity-50 disabled:cursor-not-allowed': {},
        },
        '.input-error': {
          '@apply border-error focus-ring-error': {},
        },

        // Card semantic styles
        '.card-base': {
          '@apply bg-bg-surface border border-bd-default rounded-lg shadow-sm': {},
        },

        // Text semantic styles
        '.text-default': {
          '@apply text-fg-default': {},
        },
        '.text-muted': {
          '@apply text-fg-muted': {},
        },
        '.text-subtle': {
          '@apply text-fg-subtle': {},
        },
        '.text-accent': {
          '@apply text-fg-accent': {},
        },

        // Layout semantic styles
        '.bg-app': {
          '@apply bg-bg-app': {},
        },
        '.bg-surface': {
          '@apply bg-bg-surface': {},
        },
        '.bg-header': {
          '@apply bg-bg-header': {},
        },
        '.bg-sidebar': {
          '@apply bg-bg-sidebar': {},
        },
      })
    },

    // Line clamp utilities
    function ({ addUtilities }: any) {
      const newUtilities = {
        '.line-clamp-1': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '1',
        },
        '.line-clamp-2': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '2',
        },
        '.line-clamp-3': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '3',
        },
        '.line-clamp-none': {
          overflow: 'visible',
          display: 'block',
          '-webkit-box-orient': 'horizontal',
          '-webkit-line-clamp': 'none',
        },
      }
      addUtilities(newUtilities)
    },
  ],
}

export default config