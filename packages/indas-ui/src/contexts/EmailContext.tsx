'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { createEmailAPI, type EmailAPI, DEFAULT_FOLDERS, DEFAULT_CATEGORIES } from '@/lib/api/activity/email'
import type {
  Email,
  EmailThread,
  EmailFolder,
  EmailCategory,
  EmailTemplate,
  EmailSearchFilters,
  EmailDraft,
  EmailContact,
  EmailSendRequest
} from '@/lib/api/activity/email'

// Folder cache entry for per-folder email caching
interface FolderCacheEntry {
  emails: Email[]
  totalCount: number
  hasMore: boolean
  fetchedAt: number // timestamp in ms
}

const FOLDER_CACHE_MAX_AGE = 5 * 60 * 1000 // 5 minutes

// Email Context State
interface EmailState {
  // Data
  emails: Email[]
  threads: EmailThread[]
  folders: EmailFolder[]
  categories: EmailCategory[]
  templates: EmailTemplate[]
  drafts: EmailDraft[]
  contacts: EmailContact[]
  folderCache: Record<string, FolderCacheEntry>
  folderCounts: Record<string, number>

  // UI State
  selectedEmailId: string | null
  selectedThreadId: string | null
  selectedFolderId: string | null
  selectedCategory: EmailCategory['type'] | null
  currentView: 'inbox' | 'sent' | 'drafts' | 'starred' | 'archive' | 'spam' | 'trash' | 'search'

  // Loading States
  loading: boolean
  loadingMore: boolean
  sendingEmail: boolean
  savingDraft: boolean

  // Pagination
  currentPage: number
  hasMore: boolean
  totalCount: number
  unreadCount: number

  // Search
  searchQuery: string
  searchFilters: EmailSearchFilters

  // Compose
  composeOpen: boolean
  replyToEmail: Email | null
  initialDraftData: Partial<EmailDraft> | null

  // Error Handling
  error: string | null

  // Real-time
  isConnected: boolean
  lastSyncTime: Date | null
}

// Email Actions
type EmailAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_MORE'; payload: boolean }
  | { type: 'SET_SENDING_EMAIL'; payload: boolean }
  | { type: 'SET_SAVING_DRAFT'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EMAILS'; payload: { emails: Email[]; totalCount: number; hasMore: boolean; page?: number } }
  | { type: 'SET_THREADS'; payload: EmailThread[] }
  | { type: 'SET_FOLDERS'; payload: EmailFolder[] }
  | { type: 'SET_CATEGORIES'; payload: EmailCategory[] }
  | { type: 'SET_TEMPLATES'; payload: EmailTemplate[] }
  | { type: 'SET_DRAFTS'; payload: EmailDraft[] }
  | { type: 'SET_CONTACTS'; payload: EmailContact[] }
  | { type: 'SET_SELECTED_EMAIL'; payload: string | null }
  | { type: 'SET_SELECTED_THREAD'; payload: string | null }
  | { type: 'SET_SELECTED_FOLDER'; payload: string | null }
  | { type: 'SET_SELECTED_CATEGORY'; payload: EmailCategory['type'] | null }
  | { type: 'SET_CURRENT_VIEW'; payload: EmailState['currentView'] }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCH_FILTERS'; payload: EmailSearchFilters }
  | { type: 'SET_COMPOSE_OPEN'; payload: boolean }
  | { type: 'SET_REPLY_TO_EMAIL'; payload: Email | null }
  | { type: 'SET_INITIAL_DRAFT_DATA'; payload: Partial<EmailDraft> | null }
  | { type: 'UPDATE_EMAIL'; payload: { emailId: string; updates: Partial<Email> } }
  | { type: 'DELETE_EMAIL'; payload: string }
  | { type: 'ADD_DRAFT'; payload: EmailDraft }
  | { type: 'UPDATE_DRAFT'; payload: { draftId: string; updates: Partial<EmailDraft> } }
  | { type: 'DELETE_DRAFT'; payload: string }
  | { type: 'SET_UNREAD_COUNT'; payload: number }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_LAST_SYNC_TIME'; payload: Date }
  | { type: 'SET_FOLDER_CACHE'; payload: { folderId: string; data: FolderCacheEntry } }
  | { type: 'SET_FOLDER_COUNTS'; payload: Record<string, number> }
  | { type: 'RESET_STATE' }

// Initial State
const initialState: EmailState = {
  emails: [],
  threads: [],
  folders: [],
  categories: [],
  templates: [],
  drafts: [],
  contacts: [],
  folderCache: {},
  folderCounts: {},

  selectedEmailId: null,
  selectedThreadId: null,
  selectedFolderId: 'inbox',
  selectedCategory: null,
  currentView: 'inbox',

  loading: false,
  loadingMore: false,
  sendingEmail: false,
  savingDraft: false,

  currentPage: 1,
  hasMore: true,
  totalCount: 0,
  unreadCount: 0,

  searchQuery: '',
  searchFilters: {},

  composeOpen: false,
  replyToEmail: null,
  initialDraftData: null,

  error: null,

  isConnected: false,
  lastSyncTime: null
}

// Email Reducer
function emailReducer(state: EmailState, action: EmailAction): EmailState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_LOADING_MORE':
      return { ...state, loadingMore: action.payload }

    case 'SET_SENDING_EMAIL':
      return { ...state, sendingEmail: action.payload }

    case 'SET_SAVING_DRAFT':
      return { ...state, savingDraft: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'SET_EMAILS':
      return {
        ...state,
        emails: action.payload.emails,
        totalCount: action.payload.totalCount,
        hasMore: action.payload.hasMore,
        currentPage: action.payload.page || 1
      }

    case 'SET_THREADS':
      return { ...state, threads: action.payload }

    case 'SET_FOLDERS':
      return { ...state, folders: action.payload }

    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload }

    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload }

    case 'SET_DRAFTS':
      return { ...state, drafts: action.payload }

    case 'SET_CONTACTS':
      return { ...state, contacts: action.payload }

    case 'SET_SELECTED_EMAIL':
      return { ...state, selectedEmailId: action.payload }

    case 'SET_SELECTED_THREAD':
      return { ...state, selectedThreadId: action.payload }

    case 'SET_SELECTED_FOLDER':
      return { ...state, selectedFolderId: action.payload }

    case 'SET_SELECTED_CATEGORY':
      return { ...state, selectedCategory: action.payload }

    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload }

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload }

    case 'SET_SEARCH_FILTERS':
      return { ...state, searchFilters: action.payload }

    case 'SET_COMPOSE_OPEN':
      return { ...state, composeOpen: action.payload }

    case 'SET_REPLY_TO_EMAIL':
      return { ...state, replyToEmail: action.payload }

    case 'SET_INITIAL_DRAFT_DATA':
      return { ...state, initialDraftData: action.payload }

    case 'UPDATE_EMAIL':
      return {
        ...state,
        emails: state.emails.map(email =>
          email.id === action.payload.emailId
            ? { ...email, ...action.payload.updates }
            : email
        )
      }

    case 'DELETE_EMAIL':
      return {
        ...state,
        emails: state.emails.filter(email => email.id !== action.payload),
        totalCount: Math.max(0, state.totalCount - 1)
      }

    case 'ADD_DRAFT':
      return {
        ...state,
        drafts: [action.payload, ...state.drafts]
      }

    case 'UPDATE_DRAFT':
      return {
        ...state,
        drafts: state.drafts.map(draft =>
          draft.id === action.payload.draftId
            ? { ...draft, ...action.payload.updates }
            : draft
        )
      }

    case 'DELETE_DRAFT':
      return {
        ...state,
        drafts: state.drafts.filter(draft => draft.id !== action.payload)
      }

    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload }

    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload }

    case 'SET_LAST_SYNC_TIME':
      return { ...state, lastSyncTime: action.payload }

    case 'SET_FOLDER_CACHE':
      return {
        ...state,
        folderCache: {
          ...state.folderCache,
          [action.payload.folderId]: action.payload.data
        }
      }

    case 'SET_FOLDER_COUNTS':
      return { ...state, folderCounts: { ...state.folderCounts, ...action.payload } }

    case 'RESET_STATE':
      return { ...initialState }

    default:
      return state
  }
}

// Email Context
interface EmailContextValue {
  state: EmailState
  api: EmailAPI
  actions: {
    // Data fetching
    fetchAllFolders: () => Promise<void>
    fetchEmails: (filters?: EmailSearchFilters, page?: number) => Promise<void>
    fetchPage: (page: number) => Promise<void>
    fetchMoreEmails: () => Promise<void>
    fetchEmailById: (emailId: string) => Promise<Email | null>
    fetchThread: (threadId: string) => Promise<EmailThread | null>
    fetchFolders: () => Promise<void>
    fetchCategories: () => Promise<void>
    fetchTemplates: () => Promise<void>
    fetchDrafts: () => Promise<void>
    fetchContacts: (search?: string) => Promise<void>
    fetchUnreadCount: () => Promise<void>

    // Email operations
    sendEmail: (emailData: EmailSendRequest) => Promise<void>
    saveDraft: (draft: EmailDraft) => Promise<void>
    updateEmailStatus: (emailId: string, updates: Partial<Email>) => Promise<void>
    deleteEmail: (emailId: string) => Promise<void>

    // Compose operations
    openCompose: (replyToEmail?: Email, initialData?: Partial<EmailDraft>) => void
    closeCompose: () => void

    // Navigation
    selectEmail: (emailId: string) => void
    selectFolder: (folderId: string) => void
    selectCategory: (category: EmailCategory['type']) => void
    setCurrentView: (view: EmailState['currentView']) => void

    // Search
    setSearchQuery: (query: string) => void
    setSearchFilters: (filters: EmailSearchFilters) => void
    performSearch: (query: string, filters?: EmailSearchFilters) => Promise<void>

    // Utility
    refreshEmails: () => Promise<void>
    clearError: () => void
    resetState: () => void
  }
}

const EmailContext = createContext<EmailContextValue | undefined>(undefined)

// Email Provider Component
export function EmailProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [state, dispatch] = useReducer(emailReducer, initialState)
  const api = createEmailAPI(session)

  // Initialize email system when session is available
  // NOTE: Initialization is now manual - call actions.fetchEmails() when needed
  // This prevents unnecessary API calls on non-email pages
  // useEffect(() => {
  //   if (session) {
  //     initializeEmailSystem()
  //   }
  // }, [session])

  const initializeEmailSystem = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })

      // Initialize with default folders and categories
      dispatch({ type: 'SET_FOLDERS', payload: DEFAULT_FOLDERS })
      dispatch({ type: 'SET_CATEGORIES', payload: DEFAULT_CATEGORIES })

      // Fetch initial data in parallel
      await Promise.all([
        fetchFolders(),
        fetchCategories(),
        fetchUnreadCount()
      ])

      // Fetch initial emails
      await fetchEmails()

      dispatch({ type: 'SET_CONNECTED', payload: true })
      dispatch({ type: 'SET_LAST_SYNC_TIME', payload: new Date() })
    } catch (error) {
      console.error('Error initializing email system:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize email system' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // Fetch all folders in parallel (inbox, sent, starred, archive, trash)
  // Called once on mount — populates folderCache + folderCounts for instant switching
  const fetchAllFolders = useCallback(async () => {
    const folderIds = ['inbox', 'sent', 'starred', 'archive', 'trash']
    try {
      dispatch({ type: 'SET_LOADING', payload: true })

      // Initialize default folders/categories
      dispatch({ type: 'SET_FOLDERS', payload: DEFAULT_FOLDERS })
      dispatch({ type: 'SET_CATEGORIES', payload: DEFAULT_CATEGORIES })

      const results = await Promise.allSettled(
        folderIds.map(folderId => {
          const filters: EmailSearchFilters = folderId === 'starred'
            ? { isStarred: true }
            : { folder: folderId }
          return api.getEmails(filters, 1, 50)
        })
      )

      const counts: Record<string, number> = {}

      results.forEach((result, index) => {
        const folderId = folderIds[index]
        if (result.status === 'fulfilled' && result.value.success && result.value.data) {
          const data = result.value.data
          dispatch({
            type: 'SET_FOLDER_CACHE',
            payload: {
              folderId,
              data: {
                emails: data.emails,
                totalCount: data.totalCount,
                hasMore: data.hasMore,
                fetchedAt: Date.now()
              }
            }
          })
          // Inbox: show unread count, other folders: show total count
          counts[folderId] = folderId === 'inbox' ? data.unreadCount : data.totalCount
        } else {
          counts[folderId] = 0
        }
      })

      dispatch({ type: 'SET_FOLDER_COUNTS', payload: counts })

      // Set current view emails from the selected folder (default: inbox)
      const currentFolder = state.selectedFolderId || 'inbox'
      const currentIdx = folderIds.indexOf(currentFolder)
      if (currentIdx >= 0) {
        const currentResult = results[currentIdx]
        if (currentResult.status === 'fulfilled' && currentResult.value.success && currentResult.value.data) {
          dispatch({
            type: 'SET_EMAILS',
            payload: {
              emails: currentResult.value.data.emails,
              totalCount: currentResult.value.data.totalCount,
              hasMore: currentResult.value.data.hasMore
            }
          })
          dispatch({ type: 'SET_UNREAD_COUNT', payload: currentResult.value.data.unreadCount })
        }
      }

      dispatch({ type: 'SET_CONNECTED', payload: true })
      dispatch({ type: 'SET_LAST_SYNC_TIME', payload: new Date() })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch emails' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [api, state.selectedFolderId])

  // Fetch emails for a specific page (always replaces, never appends)
  const fetchEmails = useCallback(async (filters?: EmailSearchFilters, page = 1) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })

      const response = await api.getEmails(filters, page, 50)

      if (response.success && response.data) {
        dispatch({
          type: 'SET_EMAILS',
          payload: {
            emails: response.data.emails,
            totalCount: response.data.totalCount,
            hasMore: response.data.hasMore,
            page
          }
        })
        dispatch({ type: 'SET_UNREAD_COUNT', payload: response.data.unreadCount })

        // Write to folder cache + update count (only for page 1 / initial loads)
        if (page === 1) {
          const folderId = filters?.isStarred ? 'starred' : (filters?.folder || 'inbox')
          dispatch({
            type: 'SET_FOLDER_CACHE',
            payload: {
              folderId,
              data: {
                emails: response.data.emails,
                totalCount: response.data.totalCount,
                hasMore: response.data.hasMore,
                fetchedAt: Date.now()
              }
            }
          })
          // Inbox: show unread count, other folders: show total count
          const countValue = folderId === 'inbox' ? response.data.unreadCount : response.data.totalCount
          dispatch({ type: 'SET_FOLDER_COUNTS', payload: { [folderId]: countValue } })
        }
      } else {
        dispatch({
          type: 'SET_EMAILS',
          payload: { emails: [], totalCount: 0, hasMore: false, page: 1 }
        })
        dispatch({ type: 'SET_UNREAD_COUNT', payload: 0 })
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to fetch emails. Please check your email settings.' })
      }
    } catch (error) {
      dispatch({
        type: 'SET_EMAILS',
        payload: { emails: [], totalCount: 0, hasMore: false, page: 1 }
      })
      dispatch({ type: 'SET_UNREAD_COUNT', payload: 0 })
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch emails' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [api])

  // Navigate to a specific page
  const fetchPage = useCallback(async (page: number) => {
    if (state.loading || page < 1) return
    await fetchEmails(state.searchFilters, page)
  }, [state.loading, state.searchFilters, fetchEmails])

  // Fetch more emails — kept for backward compat, navigates to next page
  const fetchMoreEmails = useCallback(async () => {
    if (state.loading || !state.hasMore) return
    await fetchEmails(state.searchFilters, state.currentPage + 1)
  }, [state.loading, state.hasMore, state.currentPage, state.searchFilters, fetchEmails])

  // Fetch email by ID
  const fetchEmailById = useCallback(async (emailId: string): Promise<Email | null> => {
    try {
      const response = await api.getEmailById(emailId)
      if (response.success && response.data) {
        // Update email in state
        dispatch({
          type: 'UPDATE_EMAIL',
          payload: { emailId, updates: response.data }
        })
        return response.data
      }
      return null
    } catch (error) {
      console.error('Error fetching email:', error)
      return null
    }
  }, [api])

  // Fetch thread
  const fetchThread = useCallback(async (threadId: string): Promise<EmailThread | null> => {
    try {
      const response = await api.getThread(threadId)
      if (response.success && response.data) {
        dispatch({ type: 'SET_THREADS', payload: [...state.threads, response.data] })
        return response.data
      }
      return null
    } catch (error) {
      console.error('Error fetching thread:', error)
      return null
    }
  }, [api, state.threads])

  // Fetch folders
  const fetchFolders = useCallback(async () => {
    try {
      const response = await api.getFolders()
      if (response.success && response.data) {
        dispatch({ type: 'SET_FOLDERS', payload: response.data })
      }
    } catch (error) {
      console.error('Error fetching folders:', error)
    }
  }, [api])

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.getCategories()
      if (response.success && response.data) {
        dispatch({ type: 'SET_CATEGORIES', payload: response.data })
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [api])

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      const response = await api.getTemplates()
      if (response.success && response.data) {
        dispatch({ type: 'SET_TEMPLATES', payload: response.data })
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }, [api])

  // Fetch drafts
  const fetchDrafts = useCallback(async () => {
    try {
      const response = await api.getDrafts()
      if (response.success && response.data) {
        dispatch({ type: 'SET_DRAFTS', payload: response.data })
      }
    } catch (error) {
      console.error('Error fetching drafts:', error)
    }
  }, [api])

  // Fetch contacts
  const fetchContacts = useCallback(async (search?: string) => {
    try {
      const response = await api.getContacts(search)
      if (response.success && response.data) {
        dispatch({ type: 'SET_CONTACTS', payload: response.data })
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    }
  }, [api])

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.getUnreadCount()
      if (response.success && response.data !== undefined) {
        dispatch({ type: 'SET_UNREAD_COUNT', payload: response.data })
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }, [api])

  // Send email
  const sendEmail = useCallback(async (emailData: EmailSendRequest) => {
    try {
      dispatch({ type: 'SET_SENDING_EMAIL', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const response = await api.sendEmail(emailData)

      if (response.success) {
        // Close compose and refresh emails
        dispatch({ type: 'SET_COMPOSE_OPEN', payload: false })
        dispatch({ type: 'SET_REPLY_TO_EMAIL', payload: null })
        dispatch({ type: 'SET_INITIAL_DRAFT_DATA', payload: null })

        // Refresh emails from current view
        await fetchEmails(state.searchFilters)
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || null })
      }
    } catch (error) {
      console.error('Error sending email:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to send email' })
    } finally {
      dispatch({ type: 'SET_SENDING_EMAIL', payload: false })
    }
  }, [api, state.searchFilters, fetchEmails])

  // Save draft
  const saveDraft = useCallback(async (draft: EmailDraft) => {
    try {
      dispatch({ type: 'SET_SAVING_DRAFT', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const response = await api.saveDraft(draft)

      if (response.success && response.data) {
        if (draft.id) {
          // Update existing draft
          dispatch({
            type: 'UPDATE_DRAFT',
            payload: { draftId: draft.id, updates: response.data }
          })
        } else {
          // Add new draft
          dispatch({ type: 'ADD_DRAFT', payload: response.data })
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || null })
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save draft' })
    } finally {
      dispatch({ type: 'SET_SAVING_DRAFT', payload: false })
    }
  }, [api])

  // Update email status - optimistic update
  const updateEmailStatus = useCallback(async (emailId: string, updates: Partial<Email>) => {
    // Optimistic update - update local state immediately
    dispatch({
      type: 'UPDATE_EMAIL',
      payload: { emailId, updates }
    })

    // Update unread count if read status changed
    if (updates.isRead !== undefined) {
      const currentEmail = state.emails.find(e => e.id === emailId)
      if (currentEmail && currentEmail.isRead !== updates.isRead) {
        const unreadCountChange = updates.isRead ? -1 : 1
        dispatch({ type: 'SET_UNREAD_COUNT', payload: Math.max(0, state.unreadCount + unreadCountChange) })
      }
    }

    // Then call API in background (don't wait)
    try {
      await api.updateEmailStatus(emailId, updates)
    } catch (error) {
      console.error('Error updating email status on server:', error)
      // Keep local state as-is for offline mode
    }
  }, [api, state.emails, state.unreadCount])

  // Delete email - optimistic update
  const deleteEmail = useCallback(async (emailId: string) => {
    // Get email info before deleting for unread count
    const deletedEmail = state.emails.find(e => e.id === emailId)

    // Optimistic update - remove from local state immediately
    dispatch({ type: 'DELETE_EMAIL', payload: emailId })

    // Update unread count if email was unread
    if (deletedEmail && !deletedEmail.isRead) {
      dispatch({ type: 'SET_UNREAD_COUNT', payload: Math.max(0, state.unreadCount - 1) })
    }

    // Then call API in background
    try {
      await api.deleteEmail(emailId)
    } catch (error) {
      console.error('Error deleting email on server:', error)
      // Keep local state as-is for offline mode
    }
  }, [api, state.emails, state.unreadCount])

  // Compose operations
  const openCompose = useCallback((replyToEmail?: Email, initialData?: Partial<EmailDraft>) => {
    dispatch({ type: 'SET_COMPOSE_OPEN', payload: true })
    dispatch({ type: 'SET_REPLY_TO_EMAIL', payload: replyToEmail || null })
    dispatch({ type: 'SET_INITIAL_DRAFT_DATA', payload: initialData || null })
  }, [])

  const closeCompose = useCallback(() => {
    dispatch({ type: 'SET_COMPOSE_OPEN', payload: false })
    dispatch({ type: 'SET_REPLY_TO_EMAIL', payload: null })
    dispatch({ type: 'SET_INITIAL_DRAFT_DATA', payload: null })
  }, [])

  // Navigation operations
  const selectEmail = useCallback((emailId: string) => {
    dispatch({ type: 'SET_SELECTED_EMAIL', payload: emailId })

    // Mark as read if unread
    const email = state.emails.find(e => e.id === emailId)
    if (email && !email.isRead) {
      updateEmailStatus(emailId, { isRead: true })
    }
  }, [state.emails, updateEmailStatus])

  const selectFolder = useCallback((folderId: string) => {
    dispatch({ type: 'SET_SELECTED_FOLDER', payload: folderId })
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: null })
    dispatch({ type: 'SET_CURRENT_VIEW', payload: folderId as EmailState['currentView'] })
    dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })

    const filters: EmailSearchFilters = folderId === 'starred'
      ? { isStarred: true }
      : { folder: folderId }
    dispatch({ type: 'SET_SEARCH_FILTERS', payload: filters })

    // Check folder cache first
    const cached = state.folderCache[folderId]
    if (cached) {
      // Immediately show cached data (no loading spinner)
      dispatch({
        type: 'SET_EMAILS',
        payload: {
          emails: cached.emails,
          totalCount: cached.totalCount,
          hasMore: cached.hasMore
        }
      })

      // If cache is stale (>5min), background refresh without spinner
      const isStale = Date.now() - cached.fetchedAt > FOLDER_CACHE_MAX_AGE
      if (isStale) {
        fetchEmails(filters)
      }
    } else {
      // No cache — fetch with loading spinner
      fetchEmails(filters)
    }
  }, [fetchEmails, state.folderCache])

  const selectCategory = useCallback((category: EmailCategory['type']) => {
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: category })
    dispatch({ type: 'SET_SELECTED_FOLDER', payload: null })
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'inbox' })
    dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })
    dispatch({ type: 'SET_SEARCH_FILTERS', payload: {} })

    // Fetch emails for selected category
    fetchEmails({ category })
  }, [fetchEmails])

  const setCurrentView = useCallback((view: EmailState['currentView']) => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: view })
    dispatch({ type: 'SET_SELECTED_FOLDER', payload: null })
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: null })
    dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })
    dispatch({ type: 'SET_SEARCH_FILTERS', payload: {} })

    // Fetch emails for selected view
    const filters: EmailSearchFilters = {}

    switch (view) {
      case 'sent':
        filters.folder = 'sent'
        break
      case 'drafts':
        filters.folder = 'drafts'
        break
      case 'starred':
        filters.isStarred = true
        break
      case 'archive':
        filters.folder = 'archive'
        break
      case 'spam':
        filters.folder = 'spam'
        break
      case 'trash':
        filters.folder = 'trash'
        break
      default:
        filters.folder = 'inbox'
    }

    fetchEmails(filters)
  }, [fetchEmails])

  // Search operations
  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query })
  }, [])

  const setSearchFilters = useCallback((filters: EmailSearchFilters) => {
    dispatch({ type: 'SET_SEARCH_FILTERS', payload: filters })
  }, [])

  const performSearch = useCallback(async (query: string, filters?: EmailSearchFilters) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query })
    dispatch({ type: 'SET_SEARCH_FILTERS', payload: filters || {} })
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'search' })

    await fetchEmails({ ...filters, query })
  }, [fetchEmails])

  // Utility operations — force refresh always fetches from API (updates cache via fetchEmails)
  const refreshEmails = useCallback(async () => {
    dispatch({ type: 'SET_LAST_SYNC_TIME', payload: new Date() })
    const folder = state.selectedFolderId || 'inbox'
    const filters: EmailSearchFilters = folder === 'starred'
      ? { isStarred: true }
      : { folder }
    await fetchEmails(filters)
  }, [fetchEmails, state.selectedFolderId])

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null })
  }, [])

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' })
  }, [])

  // Context value
  const value: EmailContextValue = {
    state,
    api,
    actions: {
      fetchAllFolders,
      fetchEmails,
      fetchPage,
      fetchMoreEmails,
      fetchEmailById,
      fetchThread,
      fetchFolders,
      fetchCategories,
      fetchTemplates,
      fetchDrafts,
      fetchContacts,
      fetchUnreadCount,
      sendEmail,
      saveDraft,
      updateEmailStatus,
      deleteEmail,
      openCompose,
      closeCompose,
      selectEmail,
      selectFolder,
      selectCategory,
      setCurrentView,
      setSearchQuery,
      setSearchFilters,
      performSearch,
      refreshEmails,
      clearError,
      resetState
    }
  }

  // Auto-fetch ALL folders on mount — populates cache + counts for instant switching
  useEffect(() => {
    if (!state.loading && state.emails.length === 0) {
      // Fetch in background without blocking UI
      setTimeout(() => {
        fetchAllFolders().catch(() => {})
      }, 1000) // 1 second delay after login to not disturb user experience
    }
  }, []) // Only run once on mount

  return (
    <EmailContext.Provider value={value}>
      {children}
    </EmailContext.Provider>
  )
}

// Hook to use email context
export function useEmail() {
  const context = useContext(EmailContext)
  if (context === undefined) {
    throw new Error('useEmail must be used within an EmailProvider')
  }
  return context
}

// Export hook for specific email data
export function useEmailState() {
  const { state } = useEmail()
  return state
}

// Export hook for email actions
export function useEmailActions() {
  const { actions } = useEmail()
  return actions
}

// Export hook for email API
export function useEmailAPI() {
  const { api } = useEmail()
  return api
}