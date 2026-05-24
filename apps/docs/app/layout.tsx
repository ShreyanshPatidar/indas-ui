import './globals.css'
import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import {
  ThemeProvider,
  ThemeScript,
  GlobalAlertProvider,
  AppConfigProvider,
  APIProvider,
  QueryProvider,
  SearchPreferencesProvider,
  PageTitleProvider,
  LanguageProvider,
  DeviceProvider,
} from 'indas-ui'

export const metadata: Metadata = {
  title: 'indas-ui — Component Library',
  description: 'React components extracted from Indas Estimo ERP.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

const NAV = [
  { slug: '', label: 'Introduction' },
  { slug: 'button', label: 'Button' },
  { slug: 'input', label: 'Input' },
  { slug: 'card', label: 'Card' },
  { slug: 'checkbox', label: 'Checkbox' },
  { slug: 'switch', label: 'Switch' },
  { slug: 'textarea', label: 'Textarea' },
  { slug: 'label', label: 'Label' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="theme-default light" data-scroll-behavior="smooth">
      <head>
        <ThemeScript defaultTheme="default" defaultMode="light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider defaultTheme={{ variant: 'default', mode: 'light' }} enableSystem={false}>
          <GlobalAlertProvider>
            <AppConfigProvider>
              <APIProvider>
                <QueryProvider>
                    <SearchPreferencesProvider>
                      <PageTitleProvider>
                        <LanguageProvider>
                          <DeviceProvider>
                            <div className="min-h-screen flex">
                              <aside className="w-64 border-r border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] p-6 sticky top-0 h-screen overflow-y-auto">
                                <Link href="/" className="block mb-8">
                                  <div className="font-bold text-lg text-[rgb(var(--color-primary))]">indas-ui</div>
                                  <div className="text-xs text-[rgb(var(--fg-muted))]">v0.0.1</div>
                                </Link>
                                <nav className="space-y-1">
                                  <div className="text-xs uppercase tracking-wide text-[rgb(var(--fg-muted))] mb-2">Components</div>
                                  {NAV.map((item) => (
                                    <Link
                                      key={item.slug}
                                      href={item.slug ? `/components/${item.slug}` : '/'}
                                      className="block px-3 py-1.5 rounded-md text-sm text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-hover))] transition"
                                    >
                                      {item.label}
                                    </Link>
                                  ))}
                                </nav>
                                <div className="mt-8 pt-6 border-t border-[rgb(var(--bd-default))] space-y-2">
                                  <a href="https://github.com/ShreyanshPatidar/indas-ui" className="block text-xs text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--color-primary))]">GitHub →</a>
                                  <a href="https://www.npmjs.com/package/indas-ui" className="block text-xs text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--color-primary))]">npm →</a>
                                </div>
                              </aside>
                              <main className="flex-1 max-w-5xl mx-auto px-8 py-12">{children}</main>
                            </div>
                          </DeviceProvider>
                        </LanguageProvider>
                      </PageTitleProvider>
                    </SearchPreferencesProvider>
                  </QueryProvider>
              </APIProvider>
            </AppConfigProvider>
          </GlobalAlertProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
