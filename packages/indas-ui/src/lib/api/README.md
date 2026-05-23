# API Architecture & Usage Guide

**Version:** 2.0 (Migrated Structure)
**Last Updated:** January 2025

## Table of Contents
- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [API Client Architecture](#api-client-architecture)
- [Migration from Old Structure](#migration-from-old-structure)
- [How to Use APIs](#how-to-use-apis)
- [Common Pitfalls](#common-pitfalls)
- [Best Practices](#best-practices)
- [Adding New APIs](#adding-new-apis)

---

## Overview

This directory contains the **migrated API structure** for the Indusweb Estimation application. All APIs are organized by domain and follow a consistent pattern for authentication, headers, and error handling.

### Key Changes from Old Structure
- **Session parameter is now REQUIRED** for all API calls
- APIs are organized by domain (master, estimation, utility, auth)
- Centralized APIClient handles authentication and headers
- Type-safe responses with `APIResponse<T>` interface

---

## Directory Structure

```
src/lib/api/
├── README.md                   # This file
├── index.ts                    # Main export file
├── core/                       # Core API infrastructure
│   ├── client.ts              # APIClient - handles all HTTP requests
│   ├── config.ts              # API configuration
│   ├── types.ts               # TypeScript interfaces
│   └── auth-helpers.ts        # Authentication utilities
├── master/                     # Master data APIs
│   ├── process.ts             # ProcessMasterAPI
│   ├── machine.ts             # MachineMasterAPI
│   ├── item.ts                # ItemMasterAPI
│   ├── hsn.ts                 # HSNAPI
│   └── index.ts
├── estimation/                 # Estimation/Planning APIs
│   ├── planning.ts            # PlanWindowAPI, LoadOperationsAPI
│   ├── content.ts             # ContentAPI
│   ├── categories.ts          # CategoriesAPI
│   └── index.ts
├── utility/                    # Utility APIs
│   ├── currency.ts            # CurrencyAPI
│   ├── menu.ts                # MenuAPI
│   └── index.ts
└── auth/                       # Authentication APIs
    ├── auth.ts                # AuthAPI
    └── index.ts
```

---

## API Client Architecture

### Core Components

#### 1. APIClient (`core/client.ts`)
The central HTTP client that handles all API requests.

**Key Features:**
- Automatic authentication header injection
- Session data extraction (CompanyID, UserId)
- Error handling and response transformation
- Support for GET, POST, PUT, DELETE methods

#### 2. APIResponse Type (`core/types.ts`)
Standard response structure for all APIs:

```typescript
interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  status?: number
}
```

#### 3. Session Data Structure
Every API call requires session data containing:

```typescript
interface SessionData {
  user: {
    CompanyID: string | number
    UserId: string | number
    // ... other user properties
  }
}
```

---

## Migration from Old Structure

### Old API Pattern (❌ DEPRECATED)
```typescript
// src/lib/api-examples.ts
export class ProcessMasterAPI {
  static async getAllocatedMachinesList(processId: number): Promise<APIResponse> {
    return APIClient.get(`api/processmaster/getallocatedmachineslist/${processId}`)
    // ❌ No session parameter - old client handled it automatically
  }
}

// Usage (OLD)
const response = await ProcessMasterAPI.getAllocatedMachinesList(processId)
```

### New API Pattern (✅ REQUIRED)
```typescript
// src/lib/api/master/process.ts
export class ProcessMasterAPI {
  static async getAllocatedMachinesList(
    processId: number,
    sessionData?: any  // ✅ Session parameter added
  ): Promise<APIResponse> {
    return APIClient.get(
      `api/processmaster/getallocatedmachineslist/${processId}`,
      sessionData  // ✅ Passed to APIClient
    )
  }
}

// Usage (NEW)
import { useSession } from 'next-auth/react'

const { data: session } = useSession()
const response = await ProcessMasterAPI.getAllocatedMachinesList(processId, session)
//                                                                          ^^^^^^^^
//                                                                    MUST PASS SESSION
```

### Why This Change?
The new structure makes session dependency **explicit and traceable**, preventing the common error:
```
❌ Error: "CompanyID not found in session. Please login again."
```

---

## How to Use APIs

### Step 1: Import the API Class
```typescript
import { ProcessMasterAPI, HSNAPI, PlanWindowAPI } from '@/lib/api'
```

### Step 2: Get Session Data
```typescript
import { useSession } from 'next-auth/react'

function MyComponent() {
  const { data: session } = useSession()

  // Always check session exists before API calls
  if (!session) {
    return <div>Please log in</div>
  }

  // ... API calls
}
```

### Step 3: Call the API with Session
```typescript
const fetchData = async () => {
  try {
    // ✅ ALWAYS pass session as the last parameter
    const response = await ProcessMasterAPI.getProcesses(session)

    if (response.success && response.data) {
      console.log('Data:', response.data)
    } else {
      console.error('Error:', response.error)
    }
  } catch (error) {
    console.error('Exception:', error)
  }
}
```

### Step 4: Handle Response
```typescript
// Pattern 1: Manual handling
if (response.success && response.data) {
  setData(response.data)
} else {
  setError(response.error || 'Unknown error')
}

// Pattern 2: Using handleAPIResponse helper
import { handleAPIResponse } from '@/lib/api/estimation/planning'

handleAPIResponse(
  response,
  (data) => setData(data),           // Success callback
  (error) => setError(error)         // Error callback
)
```

---

## Common Pitfalls

### ❌ Pitfall 1: Forgetting to Pass Session
```typescript
// ❌ WRONG - Will cause "CompanyID not found" error
const response = await ProcessMasterAPI.getAllocatedMachinesList(processId)

// ✅ CORRECT
const response = await ProcessMasterAPI.getAllocatedMachinesList(processId, session)
```

### ❌ Pitfall 2: Calling API Before Session is Ready
```typescript
// ❌ WRONG - session might be undefined
useEffect(() => {
  fetchData()  // session not checked!
}, [])

// ✅ CORRECT - wait for session
useEffect(() => {
  if (session) {
    fetchData()
  }
}, [session])
```

### ❌ Pitfall 3: Not Handling Session in Callbacks
```typescript
// ❌ WRONG
const handleAddMaterials = useCallback(async () => {
  const promises = selectedIds.map(id =>
    PlanWindowAPI.getMaterialGroupCostFormulaSetting(parseInt(id))
    // Missing session parameter!
  )
}, [selectedIds])  // Missing session in dependency array

// ✅ CORRECT
const handleAddMaterials = useCallback(async () => {
  const promises = selectedIds.map(id =>
    PlanWindowAPI.getMaterialGroupCostFormulaSetting(parseInt(id), session)
  )
}, [selectedIds, session])  // Include session in dependencies
```

### ❌ Pitfall 4: Mixing Old and New API Patterns
```typescript
// ❌ WRONG - mixing old imports
import { ProcessMasterAPI } from '@/lib/api-examples'  // Old structure

// ✅ CORRECT - use new imports
import { ProcessMasterAPI } from '@/lib/api'  // New structure
```

---

## Best Practices

### 1. Always Check Session Before API Calls
```typescript
const fetchAllocatedMachines = async () => {
  // Guard clause
  if (!selectedProcess || !session) {
    console.log('Missing process or session')
    return
  }

  // Safe to call API
  const response = await ProcessMasterAPI.getAllocatedMachinesList(
    selectedProcess,
    session
  )
}
```

### 2. Include Session in useEffect Dependencies
```typescript
useEffect(() => {
  const fetchData = async () => {
    if (!session) return

    const response = await SomeAPI.getData(session)
    // ...
  }

  fetchData()
}, [session])  // ✅ Include session in dependency array
```

### 3. Use React.useCallback with Session
```typescript
const fetchData = React.useCallback(async () => {
  if (!session) return

  const response = await SomeAPI.getData(session)
  // ...
}, [session])  // ✅ Include session
```

### 4. Centralize Error Handling
```typescript
const handleAPIError = (error: string) => {
  if (error.includes('CompanyID not found')) {
    // Session expired - redirect to login
    router.push('/auth/signin')
  } else {
    // Show error to user
    alerts.showError('Error', error)
  }
}
```

### 5. Type-Safe API Responses
```typescript
// Define response type
interface MachineData {
  MachineID: number
  MachineName: string
  MachineSpeed: number
}

// Use typed response
const response = await ProcessMasterAPI.getAllocatedMachinesList(
  processId,
  session
) as APIResponse<MachineData[]>

if (response.success && response.data) {
  // TypeScript knows response.data is MachineData[]
  response.data.forEach(machine => {
    console.log(machine.MachineName)  // ✅ Type-safe
  })
}
```

---

## Adding New APIs

### Step 1: Choose the Right Domain
- **master/** - Master data (processes, machines, items, etc.)
- **estimation/** - Estimation and planning operations
- **utility/** - Utility functions (currency, menu, etc.)
- **auth/** - Authentication and authorization

### Step 2: Create API Class
```typescript
// src/lib/api/master/your-new-api.ts
import APIClient from '../core/client'
import type { APIResponse } from '../core/types'

/**
 * Your New API
 * Description of what this API does
 */
export class YourNewAPI {
  /**
   * Get all items
   * @param sessionData - Session data (REQUIRED)
   */
  static async getItems(sessionData?: any): Promise<APIResponse> {
    return APIClient.get('api/your-endpoint/items', sessionData)
  }

  /**
   * Get item by ID
   * @param itemId - The item ID
   * @param sessionData - Session data (REQUIRED)
   */
  static async getItem(itemId: number, sessionData?: any): Promise<APIResponse> {
    return APIClient.get(`api/your-endpoint/items/${itemId}`, sessionData)
  }

  /**
   * Create new item
   * @param itemData - Item data to create
   * @param sessionData - Session data (REQUIRED)
   */
  static async createItem(itemData: any, sessionData?: any): Promise<APIResponse> {
    return APIClient.post('api/your-endpoint/items', itemData, sessionData)
  }

  /**
   * Update existing item
   * @param itemId - The item ID
   * @param itemData - Updated item data
   * @param sessionData - Session data (REQUIRED)
   */
  static async updateItem(
    itemId: number,
    itemData: any,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.put(`api/your-endpoint/items/${itemId}`, itemData, sessionData)
  }

  /**
   * Delete item
   * @param itemId - The item ID
   * @param sessionData - Session data (REQUIRED)
   */
  static async deleteItem(itemId: number, sessionData?: any): Promise<APIResponse> {
    return APIClient.delete(`api/your-endpoint/items/${itemId}`, sessionData)
  }
}
```

### Step 3: Export from index.ts
```typescript
// src/lib/api/master/index.ts
export * from './your-new-api'

// src/lib/api/index.ts
export * from './master/your-new-api'
```

### Step 4: Use in Component
```typescript
import { YourNewAPI } from '@/lib/api'
import { useSession } from 'next-auth/react'

function MyComponent() {
  const { data: session } = useSession()

  const fetchItems = async () => {
    if (!session) return

    const response = await YourNewAPI.getItems(session)

    if (response.success && response.data) {
      console.log('Items:', response.data)
    } else {
      console.error('Error:', response.error)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [session])
}
```

---

## Checklist for API Implementation

When implementing a new API or updating existing code, use this checklist:

- [ ] API method has `sessionData?: any` parameter
- [ ] sessionData is passed to APIClient method (get/post/put/delete)
- [ ] Component gets session using `useSession()` hook
- [ ] Session is checked before API call (guard clause)
- [ ] Session is passed when calling API method
- [ ] Session is included in useEffect/useCallback dependencies
- [ ] Error handling includes session-expired case
- [ ] JSDoc comments explain parameters and return types
- [ ] TypeScript types are defined for request/response data
- [ ] API is exported from index.ts files

---

## Testing APIs

### Manual Testing
1. Open browser DevTools → Network tab
2. Trigger API call in the UI
3. Check request headers:
   - ✅ `CompanyId` header present
   - ✅ `UserId` header present
   - ✅ `Authorization` header present
4. Check response for errors

### Console Logging
```typescript
const response = await ProcessMasterAPI.getProcesses(session)
console.log('📡 API Response:', response)

if (response.success) {
  console.log('✅ Success:', response.data)
} else {
  console.log('❌ Error:', response.error)
}
```

---

## Troubleshooting

### Error: "CompanyID not found in session. Please login again."

**Cause:** API called without session parameter

**Solution:**
1. Check if session is passed to API call
2. Verify session exists before calling API
3. Check session is in useEffect/useCallback dependencies

```typescript
// ❌ WRONG
const response = await SomeAPI.getData()

// ✅ CORRECT
if (!session) return
const response = await SomeAPI.getData(session)
```

### Error: "UserId not found in session"

Same as above - missing or invalid session parameter.

### Error: "Cannot read property 'user' of undefined"

**Cause:** Session is undefined when accessing session.user

**Solution:** Add guard clause
```typescript
if (!session || !session.user) {
  console.log('No session available')
  return
}

// Safe to use session.user
const response = await SomeAPI.getData(session)
```

---

## Migration Checklist

If you're migrating code from the old API structure (`api-examples.ts`):

1. [ ] Find all API calls in your component
2. [ ] Check if session is available via `useSession()`
3. [ ] Add session parameter to each API call
4. [ ] Add session to useEffect/useCallback dependencies
5. [ ] Add guard clauses to check session before API calls
6. [ ] Update imports from `@/lib/api-examples` to `@/lib/api`
7. [ ] Test all API calls work correctly
8. [ ] Check browser console for errors
9. [ ] Verify network headers include CompanyID and UserId

---

## Contact & Support

If you encounter issues with the API structure or need help:

1. Check this README first
2. Search codebase for similar API usage patterns
3. Check browser DevTools → Network tab for request/response details
4. Review `src/lib/api/core/client.ts` for APIClient implementation
5. Consult with the development team

---

## Version History

- **v2.0** (January 2025): Migrated structure with explicit session parameters
- **v1.0** (Previous): Legacy structure in `api-examples.ts` (DEPRECATED)

---

**Remember: ALWAYS pass session data to API calls!** 🔑
