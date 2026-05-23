/**
 * TypeScript declarations for Credential Management API
 * Enables browser password manager integration
 */

interface PasswordCredential extends Credential {
  readonly password: string
  readonly name?: string
  readonly iconURL?: string
}

interface PasswordCredentialData {
  id: string
  password: string
  name?: string
  iconURL?: string
}

interface PasswordCredentialConstructor {
  new(data: PasswordCredentialData): PasswordCredential
}

declare var PasswordCredential: PasswordCredentialConstructor

interface Window {
  PasswordCredential: PasswordCredentialConstructor
}

interface CredentialRequestOptions {
  password?: boolean
  federated?: {
    providers: string[]
    protocols?: string[]
  }
  mediation?: 'silent' | 'optional' | 'required'
  signal?: AbortSignal
}

interface CredentialsContainer {
  get(options?: CredentialRequestOptions): Promise<Credential | null>
  store(credential: Credential): Promise<Credential>
  create(options?: any): Promise<Credential | null>
  preventSilentAccess(): Promise<void>
}

interface Navigator {
  credentials: CredentialsContainer
}
