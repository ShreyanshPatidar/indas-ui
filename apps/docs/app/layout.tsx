import './globals.css'
import type { Metadata, Viewport } from 'next'
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
import { Sidebar } from '../components/sidebar'

export const metadata: Metadata = {
  title: 'indas-ui — Component Library',
  description: 'Indas UI — React component library for business apps. Tailwind + Radix + DataGrid + 130+ components.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

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
                            <Sidebar />
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
