import type { Config } from 'tailwindcss'
import base from '../../apps/docs/tailwind.config'

/**
 * The CSS for the web components (scripts/build-web-components.mjs): every class the components
 * use, from the same theme the docs app uses, without Tailwind's page reset, which would restyle
 * the host page's own headings, lists and margins. A reset scoped to the Indas tags stands in.
 */
const config: Config = {
  ...base,
  content: ['./src/**/*.{ts,tsx}'],
  corePlugins: { ...(base.corePlugins as object), preflight: false },
}
export default config
