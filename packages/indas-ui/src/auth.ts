// Auth entry: `import { AuthSessionProvider } from 'indas-ui/auth'`
// The one entry that needs next-auth (an optional peer dependency): it feeds next-auth's session into
// the library's session adapter, which every other component reads. Apps on another sign-in system
// skip this entry and use SessionAdapterProvider from 'indas-ui/providers' instead.
export { AuthSessionProvider } from './components/providers/session-provider'
