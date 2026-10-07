// Auth entry: `import { AuthSessionProvider } from 'indas-ui/auth'`
// The one entry that needs next-auth, which the app installs itself (^4.24.7). It is not listed as a
// peer, even an optional one: npm then checks next-auth's own peers (nodemailer ^7) against every
// app and refuses to install beside a newer nodemailer. This entry feeds next-auth's session into
// the library's session adapter, which every other component reads. Apps on another sign-in system
// skip this entry and use SessionAdapterProvider from 'indas-ui/providers' instead.
export { AuthSessionProvider } from './components/providers/session-provider'
