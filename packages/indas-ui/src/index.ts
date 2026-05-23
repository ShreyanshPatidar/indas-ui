// Components
export * from './components'

// Contexts / Providers — needed by consumers to mount the app shell
export { ThemeProvider, ThemeScript, ThemeContext } from './contexts/ThemeContext'
export { GlobalAlertProvider, useGlobalAlert, useQuickAlert } from './contexts/GlobalAlertContext'
export { AppConfigProvider, useAppConfig } from './contexts/AppConfigContext'
export { LanguageProvider, useLanguage } from './contexts/LanguageContext'
export { DeviceProvider, useDevice } from './contexts/DeviceContext'
export { SearchPreferencesProvider, useSearchPreferences } from './contexts/SearchPreferencesContext'
export { PageTitleProvider, usePageTitle } from './contexts/PageTitleContext'
export { CurrencyProvider, useCurrency } from './contexts/CurrencyContext'

// Provider wrappers
export { AuthSessionProvider } from './components/providers/session-provider'
export { APIProvider, useAPI } from './components/providers/api-provider'
export { QueryProvider } from './components/providers/query-provider'

// Utils
export { cn } from './lib/utils'
