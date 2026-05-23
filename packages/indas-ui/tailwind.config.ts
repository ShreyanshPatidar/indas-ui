import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    './.storybook/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
          foreground: 'rgb(var(--color-primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
          hover: 'rgb(var(--color-secondary-hover) / <alpha-value>)',
          foreground: 'rgb(var(--color-secondary-foreground) / <alpha-value>)',
        },
        tertiary: {
          DEFAULT: 'rgb(var(--color-tertiary) / <alpha-value>)',
          hover: 'rgb(var(--color-tertiary-hover) / <alpha-value>)',
          foreground: 'rgb(var(--color-tertiary-foreground) / <alpha-value>)',
        },
        error: {
          DEFAULT: 'rgb(var(--color-error) / <alpha-value>)',
          hover: 'rgb(var(--color-error-hover) / <alpha-value>)',
        },
        'bg-surface': 'rgb(var(--bg-surface) / <alpha-value>)',
        'bg-hover': 'rgb(var(--bg-hover) / <alpha-value>)',
        'bg-subtle': 'rgb(var(--bg-subtle) / <alpha-value>)',
        'fg-default': 'rgb(var(--fg-default) / <alpha-value>)',
        'fg-muted': 'rgb(var(--fg-muted) / <alpha-value>)',
        'fg-inverse': 'rgb(var(--fg-inverse) / <alpha-value>)',
        'bd-default': 'rgb(var(--bd-default) / <alpha-value>)',
        card: 'rgb(var(--bg-surface) / <alpha-value>)',
        'card-foreground': 'rgb(var(--fg-default) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--fg-muted) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}

export default config
