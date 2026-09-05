declare module '@/app/(main)/activity/email/components/InboxPanel' {
  export function EmailPanelContent(props: { onClose?: () => void }): JSX.Element
}

declare module '@/app/(main)/costing/estimation/components/keyline3D' {
  export interface KeylineRow {
    AddInX1: string
    AddInY1: string
    AddInX2: string
    AddInY2: string
    Linetype: string
    LineStyles: string
  }
  export interface Dims {
    L: number
    W: number
    H: number
    OF: number
    PF: number
    BF?: number
    FH?: number
    TH?: number
  }
  export interface Segment {
    x1: number; y1: number
    x2: number; y2: number
    isDashed: boolean
    shape: string
  }
  export function rowsToSegments(rows: KeylineRow[], dims: Dims): Segment[]
}

declare module '@/pages/api/auth/[...nextauth]' {
  import type { NextAuthOptions } from 'next-auth'
  export const authOptions: NextAuthOptions
}
