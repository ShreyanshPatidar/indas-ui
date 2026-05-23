# Draft System API Mapping

Complete mapping between Postman collection and frontend implementation.

**Base URL**: `https://api.indusanalytics.co.in/api/draftsystem`

---

## 1. POST /save

**Postman Collection**: Line 168-212

### Request Headers
```
CompanyID: 2
UserID: 2
ProductionUnitID: 1
FYear: 2025-2026
Authorization: Basic <base64(username:password)>
```

### Request Body (Postman Example)
```json
{
  "UserID": "2",
  "CompanyID": "2",
  "Module": "Quotation",
  "DraftName": "Quotation_Draft_07",
  "DraftData": {
    "CustomerID": 10023,
    "JobName": "Mono Carton J3",
    "Qty": 15000,
    "Size": "200x100x50",
    "Colors": {
      "Front": 4,
      "Back": 1
    }
  },
  "DocumentID": "192",
  "DocumentName": "Mono Carton J3",
  "IsAutoSave": false,
  "RetentionDays": 30
}
```

### Frontend Implementation
**File**: `src/lib/api/draft/drafts.ts:25-65`

**Method**: `DraftAPI.saveDraft(draftName, draftData, module, documentId, documentName, session)`

**Request Body Mapping**:
```typescript
{
  UserID: session?.user?.UserID || 0,
  CompanyID: session?.user?.CompanyID || session?.user?.companyID || 0,
  Module: module,                    // Dynamic: "Quotation" for /estimation
  DraftName: draftName,              // Auto-generated: "Quick Draft (steps...)"
  DraftData: draftData,              // Full estimation state object
  DocumentID: documentId,            // Quote number (e.g., "192")
  DocumentName: documentName,        // Job name (e.g., "Asus Laptop")
  IsAutoSave: false,                 // Milestone-based (not auto-save)
  RetentionDays: 30
}
```

**Response**:
```typescript
{
  success: boolean
  data: {
    draftId: number
    lastSaved: string
  }
}
```

---

## 2. GET /load/{draftId}

**Postman Collection**: Line 86-122

### Request Headers
```
CompanyID: 2
UserID: 2
ProductionUnitID: 1
FYear: 2025-2026
Authorization: Basic <base64(username:password)>
```

### URL Parameters
- `{draftId}`: Draft ID to load (e.g., 123)

### Frontend Implementation
**File**: `src/lib/api/draft/drafts.ts:71-99`

**Method**: `DraftAPI.loadDraft(draftId, session)`

**Endpoint**: `GET /api/draftsystem/load/${draftId}`

**Response**:
```typescript
{
  success: boolean
  data: {
    draftId: number
    userId: number
    companyId: number
    module: string
    draftName: string
    draftData: any              // Full estimation state
    createdAt: string
    lastSaved: string
    retentionDays: number
  }
}
```

---

## 3. GET /list

**Postman Collection**: Line 48-83

### Request Headers
```
CompanyID: 2
UserID: 2
ProductionUnitID: 1
FYear: 2025-2026
Authorization: Basic <base64(username:password)>
```

### Frontend Implementation
**File**: `src/lib/api/draft/drafts.ts:105-132`

**Method**: `DraftAPI.listDrafts(module, session)`

**Endpoint**: `GET /api/draftsystem/list`

**Note**: Module filtering happens backend-side based on session headers

**Response**:
```typescript
{
  success: boolean
  data: DraftMetadata[] = [
    {
      draftId: number
      draftName: string
      module: string
      lastSaved: string
      createdAt: string
      previewData?: {
        quoteNumber?: string
        jobName?: string
        clientName?: string
        category?: string
        totalCost?: number
      }
    }
  ]
}
```

---

## 4. DELETE /{draftId}

**Postman Collection**: Line 10-45

### Request Headers
```
CompanyID: 2
UserID: 2
ProductionUnitID: 1
FYear: 2025-2026
Authorization: Basic <base64(username:password)>
```

### URL Parameters
- `{draftId}`: Draft ID to delete (e.g., 123)

### Frontend Implementation
**File**: `src/lib/api/draft/drafts.ts:138-166`

**Method**: `DraftAPI.deleteDraft(draftId, session)`

**Endpoint**: `DELETE /api/draftsystem/${draftId}`

**Response**:
```typescript
{
  success: boolean
  message: string
}
```

---

## 5. PUT /rename/{draftId}

**Postman Collection**: Line 125-165

### Request Headers
```
CompanyID: 2
UserID: 2
ProductionUnitID: 1
FYear: 2025-2026
Authorization: Basic <base64(username:password)>
```

### URL Parameters
- `{draftId}`: Draft ID to rename (e.g., 123)

### Request Body (Postman Example)
```json
{
  "sampleKey": "sampleValue"
}
```

**Note**: Postman body is a placeholder. Actual implementation:

### Frontend Implementation
**File**: `src/lib/api/draft/drafts.ts:172-206`

**Method**: `DraftAPI.renameDraft(draftId, newName, session)`

**Request Body**:
```typescript
{
  DraftName: newName
}
```

**Response**:
```typescript
{
  success: boolean
  message?: string
}
```

---

## Module Name Mapping

**Dynamic module names based on route**:

| Route Path | Module Name |
|------------|-------------|
| `/estimation` | `Quotation` |
| `/quote-panel` | `Quote Panel` |
| `/enquiry` | `Enquiry` |
| `/job-card` | `Job Card` |
| `/production` | `Production` |
| `/purchase-order` | `Purchase Order` |
| `/invoice` | `Invoice` |
| `/delivery` | `Delivery` |
| Other | `General` |

**Implementation**: `src/lib/utils/getModuleName.ts`

---

## Session Headers

All API calls automatically include these headers via `APIClient`:

```typescript
{
  Authorization: `Basic ${base64(username:password)}`,
  CompanyID: session.user.CompanyID,
  UserID: session.user.UserID,
  ProductionUnitID: session.user.ProductionUnitID,
  FYear: session.user.FYear,
  'Content-Type': 'application/json',
  Accept: 'application/json'
}
```

---

## Usage Example

```typescript
import { useDraft } from '@/hooks/useDraft'
import { usePathname } from 'next/navigation'
import { getModuleName } from '@/lib/utils/getModuleName'

export default function MyPage() {
  const pathname = usePathname()
  const moduleName = getModuleName(pathname) // "Quotation" for /estimation

  const {
    saveDraft,
    loadDraft,
    deleteDraft,
    renameDraft,
    listDrafts,
    drafts,
    isLoadingDrafts,
    lastSaved,
    isSaving
  } = useDraft(moduleName, currentState)

  // Auto-save at milestone (with DocumentID and DocumentName)
  await saveDraft('Draft Name', quoteNumber, jobName)

  // Load specific draft
  const data = await loadDraft(123)

  // Delete draft
  await deleteDraft(123)

  // Rename draft
  await renameDraft(123, 'New Name')

  // Refresh list
  await listDrafts()
}
```

---

## API Client Integration

All draft APIs use the centralized `APIClient` from `src/lib/api/core/client.ts`:

- ✅ Automatic session header injection
- ✅ Error handling with structured responses
- ✅ Type-safe request/response
- ✅ Consistent error format

---

## Status

✅ All 5 endpoints mapped and implemented
✅ Dynamic module name support
✅ Session headers auto-injected
✅ Type-safe TypeScript implementation
✅ Matches Postman collection structure
