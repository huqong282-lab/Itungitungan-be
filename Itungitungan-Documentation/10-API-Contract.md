# API Contract v1

## Itungitungan — Configurable Project Estimation & Quotation System

---

## 1. Purpose

Dokumen ini mendefinisikan kontrak komunikasi antara:

```text
estimator-web
      ↓ HTTP/JSON
estimator-api
```

Dokumen ini menjadi referensi bersama untuk:

- Frontend development
- Backend development
- API implementation
- Integration testing
- E2E testing

API Contract menentukan:

```text
Endpoint
HTTP Method
Authentication
Request
Response
Validation
Error
Authorization
Resource Lifecycle
```

---

## 2. Base URL

Development:

```text
/api
```

Contoh:

```text
/api/auth/login
/api/projects
/api/features
```

Base URL frontend dikonfigurasi melalui:

```text
VITE_API_URL
```

Contoh:

```text
VITE_API_URL=http://localhost:3000
```

Final URL:

```text
http://localhost:3000/api/...
```

---

## 3. API Format

### Request

API menerima:

```http
Content-Type: application/json
```

### Response

API mengembalikan:

```http
Content-Type: application/json
```

Semua timestamp menggunakan ISO 8601.

Contoh:

```text
2026-09-28T08:30:00.000Z
```

---

## 4. Success Response Format

### Single Resource

```json
{
  "data": {
    "id": "cuid...",
    "name": "Payment Gateway"
  }
}
```

### Collection

```json
{
  "data": [
    {
      "id": "cuid...",
      "name": "Payment Gateway"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### Action Without Resource

Jika action berhasil tetapi tidak membutuhkan response data:

```http
204 No Content
```

---

## 5. Error Response

Semua API error menggunakan format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [
      {
        "field": "projectName",
        "message": "Project name is required."
      }
    ]
  }
}
```

### Standard Error Codes

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
BUSINESS_RULE_VIOLATION
QUOTATION_FINALIZED
CALCULATION_ERROR
INTERNAL_SERVER_ERROR
```

---

## 6. HTTP Status Codes

```text
200 OK
```

Successful GET, PATCH, or action with response.

```text
201 Created
```

Successful resource creation.

```text
204 No Content
```

Successful action without response body.

```text
400 Bad Request
```

Malformed request or validation error.

```text
401 Unauthorized
```

User belum authenticated atau session tidak valid.

```text
403 Forbidden
```

User authenticated tetapi tidak memiliki akses terhadap resource.

```text
404 Not Found
```

Resource tidak ditemukan.

```text
409 Conflict
```

Conflict dengan state/resource yang sudah ada.

```text
422 Unprocessable Entity
```

Request valid secara struktur tetapi melanggar business rule.

```text
500 Internal Server Error
```

Unexpected server error.

---

## 7. Authentication

Authentication menggunakan session-based authentication.

Session token disimpan melalui:

```text
HTTP-only Cookie
```

Browser tidak mengakses raw session token melalui JavaScript.

---

## 8. Auth Endpoints

### AUTH-001 — Register

```http
POST /api/auth/register
```

#### Request

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure-password"
}
```

#### Backend Actions

```text
Validate request
↓
Check email uniqueness
↓
Create User
↓
Create DeveloperSettings
↓
Initialize Default Catalog
↓
Create Session
↓
Set HTTP-only Cookie
```

#### Response

```http
201 Created
```

```json
{
  "data": {
    "user": {
      "id": "cuid...",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

#### Errors

```text
VALIDATION_ERROR
CONFLICT
```

---

## 9. AUTH-002 — Login

```http
POST /api/auth/login
```

#### Request

```json
{
  "email": "john@example.com",
  "password": "secure-password"
}
```

#### Response

```http
200 OK
```

```json
{
  "data": {
    "user": {
      "id": "cuid...",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

Session cookie diset oleh backend.

#### Errors

```text
VALIDATION_ERROR
UNAUTHORIZED
```

---

## 10. AUTH-003 — Current User

```http
GET /api/auth/me
```

#### Authentication

Required.

#### Response

```json
{
  "data": {
    "id": "cuid...",
    "email": "john@example.com",
    "name": "John Doe",
    "createdAt": "2026-10-06T01:00:00.000Z",
    "updatedAt": "2026-10-06T01:00:00.000Z"
  }
}
```

Returns `401 Unauthorized` when the session is missing, invalid, or expired. Password and session token hashes are never returned.

---

## 11. AUTH-004 — Logout

```http
POST /api/auth/logout
```

#### Authentication

Required.

#### Backend Actions

```text
Find current session
↓
Invalidate session
↓
Clear HTTP-only Cookie
```

#### Response

```http
204 No Content
```

---

## 12. Settings API

### SETTINGS-001 — Get Settings

```http
GET /api/settings
```

#### Authentication

Required.

Settings diambil berdasarkan `userId` dari session. Jika session tidak valid, response `401 UNAUTHORIZED`; jika record settings tidak ditemukan, response `404 SETTINGS_NOT_FOUND`.

#### Response

```json
{
  "data": {
    "developerRate": 75000,
    "workingHoursPerDay": 8,
    "buffer": 20,
    "margin": 30,
    "rush": 30,
    "freeRevisionCount": 2,
    "additionalRevisionPrice": 200000
  }
}
```

---

## 13. SETTINGS-002 — Update Settings

```http
PATCH /api/settings
```

#### Request

```json
{
  "developerRate": 75000,
  "workingHoursPerDay": 8,
  "buffer": 20,
  "margin": 30,
  "rush": 30,
  "freeRevisionCount": 2,
  "additionalRevisionPrice": 200000
}
```

Semua field bersifat optional; update hanya mengubah field yang dikirim. Settings dibatasi pada user yang sedang login.

#### Validation

```text
developerRate >= 0
workingHoursPerDay > 0
buffer >= 0
buffer <= 100
margin >= 0
margin <= 100
rush >= 0
rush <= 100
freeRevisionCount >= 0
additionalRevisionPrice >= 0
```

#### Response

```json
{
  "data": {
    "developerRate": 75000,
    "workingHoursPerDay": 8,
    "buffer": 20,
    "margin": 30,
    "rush": 30,
    "freeRevisionCount": 2,
    "additionalRevisionPrice": 200000
  }
}
```

---

## 14. Feature API

### FEATURE-001 — List Features

```http
GET /api/features
```

#### Authentication

Required. Feature yang dikembalikan selalu dibatasi berdasarkan `userId` pada session.

Query:

```text
page
pageSize
search
category
isActive
```

Default `page=1` dan `pageSize=20`; `pageSize` maksimum `100`. `search` mencari pada name, description, dan category tanpa membedakan kapital. `category` menggunakan exact match dan `isActive` memfilter status secara exact.

Example:

```text
GET /api/features?page=1&pageSize=20&search=payment&isActive=true
```

#### Response

```json
{
  "data": [
    {
      "id": "cuid...",
      "name": "Payment Gateway",
      "description": "Payment integration",
      "category": "Payment",
      "baseEstimatedHours": 0,
      "isActive": true
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Hanya feature milik current user yang dikembalikan.

---

## 15. FEATURE-002 — Get Feature

```http
GET /api/features/:featureId
```

#### Authentication

Required. Feature diambil berdasarkan ID dan `userId` pada session; ID yang tidak ditemukan atau bukan milik user menghasilkan `404 FEATURE_NOT_FOUND`.

#### Response

```json
{
  "data": {
    "id": "cuid...",
    "name": "Payment Gateway",
    "description": "Payment integration",
    "category": "Payment",
    "baseEstimatedHours": 0,
    "isActive": true,
    "options": [
      {
        "id": "cuid...",
        "name": "Provider",
        "selectionType": "SINGLE",
        "values": [
          {
            "id": "cuid...",
            "label": "Midtrans",
            "estimatedHours": 8,
            "isDefault": true,
            "isActive": true
          }
        ]
      }
    ]
  }
}
```

---

## 16. FEATURE-003 — Create Feature

```http
POST /api/features
```

#### Authentication

Required. `userId` selalu berasal dari session dan tidak dapat dikirim melalui request body.

#### Request

```json
{
  "name": "Payment Gateway",
  "description": "Payment integration",
  "category": "Payment",
  "baseEstimatedHours": 0
}
```

#### Response

```http
201 Created
```

---

## 17. FEATURE-004 — Update Feature

```http
PATCH /api/features/:featureId
```

#### Authentication

Required. Hanya feature milik user pada session yang dapat diubah; ID yang tidak ditemukan atau bukan milik user menghasilkan `404 FEATURE_NOT_FOUND`.

#### Request

```json
{
  "name": "Payment Gateway",
  "description": "Payment provider integration",
  "category": "Payment",
  "baseEstimatedHours": 0
}
```

#### Response

```text
200 OK
```

---

## 18. FEATURE-005 — Deactivate Feature

Feature tidak di-hard-delete.

```http
PATCH /api/features/:featureId/status
```

#### Authentication

Required. Status hanya dapat diubah pada feature milik user pada session; ID yang tidak ditemukan atau bukan milik user menghasilkan `404 FEATURE_NOT_FOUND`.

#### Request

```json
{
  "isActive": false
}
```

#### Response

```json
{
  "data": {
    "id": "cuid...",
    "isActive": false
  }
}
```

Feature inactive tidak muncul sebagai pilihan pada project baru.

---

## 19. Feature Option API

### FEATURE-OPTION-001 — Create Option

```http
POST /api/features/:featureId/options
```

#### Request

```json
{
  "name": "Provider",
  "selectionType": "SINGLE"
}
```

#### Response

```http
201 Created
```

---

## 20. FEATURE-OPTION-002 — Update Option

```http
PATCH /api/features/:featureId/options/:optionId
```

#### Request

```json
{
  "name": "Provider",
  "selectionType": "SINGLE"
}
```

---

## 21. FEATURE-OPTION-003 — Create Option Value

```http
POST /api/features/:featureId/options/:optionId/values
```

#### Request

```json
{
  "label": "Xendit",
  "estimatedHours": 10,
  "isDefault": false
}
```

---

## 22. FEATURE-OPTION-004 — Update Option Value

```http
PATCH /api/features/:featureId/options/:optionId/values/:valueId
```

#### Request

```json
{
  "label": "Xendit",
  "estimatedHours": 12,
  "isDefault": false,
  "isActive": true
}
```

---

## 23. Design API

### DESIGN-001 — List

```http
GET /api/designs
```

Query:

```text
page
pageSize
search
isActive
```

---

## 24. DESIGN-002 — Get

```http
GET /api/designs/:designId
```

---

## 25. DESIGN-003 — Create

```http
POST /api/designs
```

#### Request

```json
{
  "name": "Premium UI",
  "description": "Custom premium interface",
  "price": 1500000
}
```

---

## 26. DESIGN-004 — Update

```http
PATCH /api/designs/:designId
```

---

## 27. DESIGN-005 — Deactivate

```http
PATCH /api/designs/:designId/status
```

#### Request

```json
{
  "isActive": false
}
```

---

## 28. Hosting API

### HOSTING-001 — List

```http
GET /api/hosting-plans
```

Query:

```text
page
pageSize
search
isActive
```

---

## 29. HOSTING-002 — Get

```http
GET /api/hosting-plans/:hostingPlanId
```

---

## 30. HOSTING-003 — Create

```http
POST /api/hosting-plans
```

#### Request

```json
{
  "provider": "Railway",
  "name": "Hobby",
  "internalCost": 150000,
  "clientPrice": 200000,
  "billingPeriod": "MONTHLY"
}
```

---

## 31. HOSTING-004 — Update

```http
PATCH /api/hosting-plans/:hostingPlanId
```

---

## 32. HOSTING-005 — Deactivate

```http
PATCH /api/hosting-plans/:hostingPlanId/status
```

#### Request

```json
{
  "isActive": false
}
```

---

## 33. Maintenance API

### MAINTENANCE-001 — List

```http
GET /api/maintenance-plans
```

Query:

```text
page
pageSize
search
isActive
```

---

## 34. MAINTENANCE-002 — Get

```http
GET /api/maintenance-plans/:maintenancePlanId
```

---

## 35. MAINTENANCE-003 — Create

```http
POST /api/maintenance-plans
```

#### Request

```json
{
  "name": "Website Maintenance",
  "price": 500000,
  "billingPeriod": "MONTHLY"
}
```

---

## 36. MAINTENANCE-004 — Update

```http
PATCH /api/maintenance-plans/:maintenancePlanId
```

---

## 37. MAINTENANCE-005 — Deactivate

```http
PATCH /api/maintenance-plans/:maintenancePlanId/status
```

---

## 38. Project API

### PROJECT-001 — List Projects

```http
GET /api/projects
```

Query:

```text
page
pageSize
search
status
sort
order
```

Example:

```text
GET /api/projects?page=1&pageSize=20&status=DRAFT
```

---

## 39. PROJECT-002 — Get Project

```http
GET /api/projects/:projectId
```

#### Response

```json
{
  "data": {
    "id": "cuid...",
    "clientName": "John Doe",
    "projectName": "Company Website",
    "logoUrl": null,
    "deadline": "2026-10-12T00:00:00.000Z",
    "status": "DRAFT",
    "features": [],
    "design": null,
    "hostings": [],
    "maintenances": [],
    "quotations": []
  }
}
```

---

## 40. PROJECT-003 — Create Project

```http
POST /api/projects
```

#### Request

```json
{
  "clientName": "John Doe",
  "projectName": "Company Website",
  "logoUrl": null,
  "deadline": "2026-10-12T00:00:00.000Z"
}
```

#### Response

```http
201 Created
```

---

## 41. PROJECT-004 — Update Project

```http
PATCH /api/projects/:projectId
```

#### Request

```json
{
  "clientName": "John Doe",
  "projectName": "Company Website",
  "logoUrl": null,
  "deadline": "2026-10-12T00:00:00.000Z"
}
```

Project ownership wajib diperiksa.

---

## 42. Project Feature API

### PROJECT-FEATURE-001 — Add Feature

```http
POST /api/projects/:projectId/features
```

#### Request

```json
{
  "featureId": "cuid..."
}
```

#### Response

```http
201 Created
```

Jika feature sudah ada di project:

```text
409 CONFLICT
```

---

## 43. PROJECT-FEATURE-002 — Update Feature

```http
PATCH /api/projects/:projectId/features/:projectFeatureId
```

#### Request

```json
{
  "overrideHours": 16,
  "notes": "Custom implementation"
}
```

`overrideHours` boleh `null` untuk kembali ke calculation normal.

---

## 44. PROJECT-FEATURE-003 — Remove Feature

```http
DELETE /api/projects/:projectId/features/:projectFeatureId
```

Ini hanya menghapus hubungan project-feature.

Catalog feature tetap ada.

#### Response

```http
204 No Content
```

---

## 45. Project Feature Selection API

### PROJECT-SELECTION-001 — Replace Selections

```http
PUT /api/projects/:projectId/features/:projectFeatureId/selections
```

#### Request

```json
{
  "selections": [
    {
      "featureOptionId": "option-provider",
      "featureOptionValueId": "value-xendit"
    },
    {
      "featureOptionId": "option-payment-type",
      "featureOptionValueId": "value-subscription"
    },
    {
      "featureOptionId": "option-refund",
      "featureOptionValueId": "value-yes"
    }
  ]
}
```

#### Backend Validation

```text
Feature belongs to user
Option belongs to feature
Value belongs to option
SINGLE has one selected value
MULTIPLE may have multiple values
No duplicate selection
```

---

## 46. Project Design API

### PROJECT-DESIGN-001 — Set Design

```http
PUT /api/projects/:projectId/design
```

#### Request

```json
{
  "designId": "cuid..."
}
```

Satu project maksimal memiliki satu design.

---

## 47. PROJECT-DESIGN-002 — Remove Design

```http
DELETE /api/projects/:projectId/design
```

#### Response

```http
204 No Content
```

---

## 48. Project Hosting API

### PROJECT-HOSTING-001 — Add Hosting

```http
POST /api/projects/:projectId/hostings
```

#### Request

```json
{
  "label": "Production",
  "hostingPlanId": "cuid...",
  "clientProvided": false
}
```

Untuk client-provided hosting:

```json
{
  "label": "Production",
  "hostingPlanId": null,
  "clientProvided": true
}
```

---

## 49. PROJECT-HOSTING-002 — Update Hosting

```http
PATCH /api/projects/:projectId/hostings/:hostingId
```

#### Request

```json
{
  "label": "Production",
  "hostingPlanId": "cuid...",
  "clientProvided": false
}
```

---

## 50. PROJECT-HOSTING-003 — Remove Hosting

```http
DELETE /api/projects/:projectId/hostings/:hostingId
```

---

## 51. Project Maintenance API

### PROJECT-MAINTENANCE-001 — Add Maintenance

```http
POST /api/projects/:projectId/maintenances
```

#### Request

```json
{
  "maintenancePlanId": "cuid..."
}
```

Plan yang sama tidak dapat ditambahkan dua kali pada project yang sama.

---

## 52. PROJECT-MAINTENANCE-002 — Remove Maintenance

```http
DELETE /api/projects/:projectId/maintenances/:maintenanceId
```

---

## 53. Calculation API

Calculation adalah business logic inti.

### CALC-001 — Calculate Project

```http
POST /api/projects/:projectId/calculate
```

#### Request

Tidak membutuhkan calculation formula dari frontend.

Optional request:

```json
{
  "marginPercentage": 30
}
```

Jika tidak dikirim, gunakan default dari DeveloperSettings.

#### Backend Reads

```text
DeveloperSettings
Project
ProjectFeature
Feature
FeatureOption
FeatureOptionValue
ProjectDesign
ProjectHosting
ProjectMaintenance
Deadline
```

---

## 54. Calculation Response

```json
{
  "data": {
    "estimatedHours": 44,
    "bufferPercentage": 20,
    "bufferedHours": 53,
    "workingHoursPerDay": 8,
    "workingDays": 7,

    "deadline": "2026-10-12T00:00:00.000Z",
    "deadlineStatus": "NORMAL",

    "developmentCost": 4000000,
    "designCost": 1000000,
    "hostingCost": 200000,
    "maintenanceCost": 500000,

    "subtotal": 5700000,

    "marginPercentage": 30,
    "marginAmount": 1710000,

    "rushFeePercentage": 0,
    "rushFeeAmount": 0,

    "finalPrice": 7410000,

    "revisionPolicy": {
      "freeRevisionCount": 2,
      "additionalRevisionPrice": 200000
    }
  }
}
```

---

## 55. Calculation Rules

Backend wajib menggunakan:

```text
Estimated Hours
→ user-defined feature configuration

Buffered Hours
→ CEIL(
    estimatedHours ×
    (1 + bufferPercentage / 100)
  )

Working Days
→ CEIL(
    bufferedHours /
    workingHoursPerDay
  )
```

Contoh:

```text
44h
20% buffer
↓
52.8
↓ CEIL
53h

53 / 8
↓
6.625
↓ CEIL
7 hari
```

Frontend menerima:

```text
bufferedHours = 53
workingDays = 7
```

---

## 56. Rush Calculation

Backend membandingkan estimated completion terhadap deadline.

Jika deadline lebih cepat:

```text
deadlineStatus = RUSH
```

Jika tidak:

```text
deadlineStatus = NORMAL
```

Jika RUSH:

```text
rushFeePercentage
rushFeeAmount
```

diterapkan sesuai DeveloperSettings atau project configuration.

---

## 57. Quotation API

### QUOTATION-001 — Create Draft Quotation

```http
POST /api/projects/:projectId/quotations
```

#### Request

```json
{}
```

Quotation dibuat berdasarkan current project configuration dan current calculation rules.

#### Response

```http
201 Created
```

```json
{
  "data": {
    "id": "cuid...",
    "quotationNumber": "QT-000001",
    "version": 1,
    "status": "DRAFT",
    "finalPrice": 7410000,
    "workingDays": 7,
    "createdAt": "2026-09-28T08:30:00.000Z"
  }
}
```

---

## 58. QUOTATION-002 — List Quotations

```http
GET /api/quotations
```

Query:

```text
page
pageSize
search
status
projectId
sort
order
```

#### Response

```json
{
  "data": [
    {
      "id": "cuid...",
      "quotationNumber": "QT-000001",
      "projectId": "cuid...",
      "version": 1,
      "status": "FINAL",
      "clientName": "John Doe",
      "projectName": "Company Website",
      "finalPrice": 7410000,
      "createdAt": "2026-09-28T08:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## 59. QUOTATION-003 — Get Quotation

```http
GET /api/quotations/:quotationId
```

Response berisi:

```text
Quotation Header
Feature Snapshot
Feature Selection Snapshot
Design Snapshot
Hosting Snapshot
Maintenance Snapshot
Timeline
Pricing
Revision Policy
Status
```

---

## 60. Quotation Draft Recalculation

DRAFT quotation dapat diregenerate berdasarkan current project configuration.

```http
POST /api/quotations/:quotationId/recalculate
```

#### Conditions

```text
quotation.status === DRAFT
```

Jika:

```text
quotation.status === FINAL
```

response:

```text
422 QUOTATION_FINALIZED
```

#### Result

Backend:

```text
Load Project
↓
Run Calculation Engine
↓
Rebuild Draft Snapshot
↓
Update Quotation
```

Version tidak berubah.

---

## 61. Quotation Draft Update

MVP tidak menyediakan arbitrary manual editing terhadap calculated financial fields.

Yang dapat diubah melalui draft:

```text
Project configuration
↓
Recalculate quotation
```

Dengan demikian:

```text
Final Price
Subtotal
Margin Amount
Rush Fee
Timeline
```

tidak dapat diedit langsung dari frontend sebagai angka bebas.

Business calculation tetap berasal dari backend.

---

## 62. QUOTATION-004 — Finalize

```http
POST /api/quotations/:quotationId/finalize
```

#### Preconditions

```text
Quotation exists
User owns quotation
Status = DRAFT
Calculation valid
```

#### Backend Actions

```text
Validate quotation
↓
Set status = FINAL
↓
Set finalizedAt
↓
Persist immutable snapshot
```

#### Response

```json
{
  "data": {
    "id": "cuid...",
    "quotationNumber": "QT-000001",
    "version": 1,
    "status": "FINAL",
    "finalizedAt": "2026-09-28T09:00:00.000Z"
  }
}
```

---

## 63. Final Quotation Mutation Rules

MVP tidak menyediakan endpoint `PATCH /api/quotations/:id` karena quotation tidak diedit secara arbitrary (lihat Section 61). Endpoint berikut harus menolak mutation terhadap FINAL quotation:

```text
POST /api/quotations/:id/recalculate
POST /api/quotations/:id/finalize
```

Response:

```json
{
  "error": {
    "code": "QUOTATION_FINALIZED",
    "message": "Final quotations cannot be modified."
  }
}
```

---

## 64. New Quotation Version

Jika project memiliki quotation FINAL dan user membuat quotation baru:

```http
POST /api/projects/:projectId/quotations
```

Backend menentukan version berikutnya.

Contoh:

```text
v1 FINAL
↓
Create new quotation
↓
v2 DRAFT
```

Version tidak boleh dipilih secara bebas oleh frontend.

---

## 65. Quotation PDF

MVP dapat menyediakan:

```http
GET /api/quotations/:quotationId/pdf
```

#### Response

```text
Content-Type: application/pdf
```

PDF menggunakan snapshot quotation.

PDF untuk quotation FINAL harus tetap sama walaupun catalog berubah.

---

## 66. Pagination Standard

List endpoint menggunakan:

```text
page
pageSize
```

Default:

```text
page = 1
pageSize = 20
```

Maximum:

```text
pageSize = 100
```

Backend harus melakukan validation terhadap pagination input.

---

## 67. Search Standard

Query:

```text
search
```

digunakan untuk field yang relevan.

Contoh:

```text
GET /api/projects?search=company
```

Search tidak boleh membuka data milik user lain.

---

## 68. Sorting Standard

Query:

```text
sort
order
```

Contoh:

```text
GET /api/projects?sort=createdAt&order=desc
```

Backend hanya menerima field sorting yang di-whitelist.

Frontend tidak boleh mengirim nama database column arbitrary untuk dieksekusi.

---

## 69. Authorization Contract

Setiap authenticated endpoint mengikuti:

```text
Request
 ↓
Authentication
 ↓
Resource Lookup
 ↓
Ownership Validation
 ↓
Business Validation
 ↓
Action
```

Contoh:

```text
GET /api/projects/project-A
```

Backend harus memastikan:

```text
project.userId === currentUser.id
```

---

## 70. Nested Resource Authorization

Contoh:

```text
POST /api/projects/project-A/features
```

Backend harus memeriksa:

```text
Project A belongs to current user
Feature belongs to current user
Feature is active
Feature not already attached
```

---

## 71. Error Mapping

Contoh validation:

```http
400 Bad Request
```

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request.",
    "details": [
      {
        "field": "bufferPercentage",
        "message": "Value must be between 0 and 100."
      }
    ]
  }
}
```

Ownership:

```http
403 Forbidden
```

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource."
  }
}
```

Not found:

```http
404 Not Found
```

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found."
  }
}
```

---

## 72. Security Contract

API wajib:

```text
Validate input
Authenticate user
Validate ownership
Whitelist sortable fields
Never expose passwordHash
Never expose raw session token
Avoid exposing internal errors
```

Sensitive internal fields seperti:

```text
passwordHash
tokenHash
```

tidak boleh masuk API response.

---

## 73. Internal vs Client Data

Internal API response dapat mengandung:

```text
internalCost
developerRate
margin
rushFee
```

tetapi endpoint yang menghasilkan client-facing quotation/PDF harus menggunakan projection yang sesuai.

Client-facing output tidak wajib menampilkan:

```text
internalCost
developerRate
internal provider notes
```

---

## 74. API and Calculation Source of Truth

Frontend tidak mengirim:

```text
finalPrice
subtotal
developmentCost
bufferedHours
workingDays
rushFeeAmount
marginAmount
```

sebagai trusted values.

Frontend hanya mengirim konfigurasi yang diperlukan.

Backend menghitung semua nilai tersebut.

---

## 75. Resource Ownership Matrix

| Resource             | Owner                | Ownership Check     |
| -------------------- | -------------------- | ------------------- |
| DeveloperSettings    | User                 | userId              |
| Session              | User                 | userId              |
| Feature              | User                 | userId              |
| FeatureOption        | Feature → User       | feature ownership   |
| FeatureOptionValue   | FeatureOption → User | parent ownership    |
| Design               | User                 | userId              |
| HostingPlan          | User                 | userId              |
| MaintenancePlan      | User                 | userId              |
| Project              | User                 | userId              |
| ProjectFeature       | Project → User       | project ownership   |
| ProjectDesign        | Project → User       | project ownership   |
| ProjectHosting       | Project → User       | project ownership   |
| ProjectMaintenance   | Project → User       | project ownership   |
| Quotation            | Project → User       | project ownership   |
| QuotationFeature     | Quotation → User     | quotation ownership |
| QuotationDesign      | Quotation → User     | quotation ownership |
| QuotationHosting     | Quotation → User     | quotation ownership |
| QuotationMaintenance | Quotation → User     | quotation ownership |

---

## 76. Frontend Query Mapping

| Screen             | API                                 |
| ------------------ | ----------------------------------- |
| Login              | `POST /api/auth/login`              |
| Register           | `POST /api/auth/register`           |
| App initialization | `GET /api/auth/me`                  |
| Dashboard          | Projects + Quotations               |
| Feature List       | `GET /api/features`                 |
| Feature Editor     | `GET /api/features/:id`             |
| Design List        | `GET /api/designs`                  |
| Hosting List       | `GET /api/hosting-plans`            |
| Maintenance List   | `GET /api/maintenance-plans`        |
| Project List       | `GET /api/projects`                 |
| Project Detail     | `GET /api/projects/:id`             |
| Calculation        | `POST /api/projects/:id/calculate`  |
| Quotation List     | `GET /api/quotations`               |
| Quotation Detail   | `GET /api/quotations/:id`           |
| Finalize           | `POST /api/quotations/:id/finalize` |

---

## 77. API Mutation Rules

Mutations harus:

```text
Validate Request
↓
Authenticate
↓
Authorize
↓
Validate Business Rules
↓
Database Transaction if needed
↓
Return Result
```

Quotation creation/finalization menggunakan database transaction ketika beberapa related snapshot records harus berubah bersama.

---

## 78. API Idempotency Considerations

Create endpoints yang berpotensi dipanggil ulang akibat network retry harus dirancang agar tidak menciptakan data ganda.

Contoh penting:

```text
Create Quotation
Finalize Quotation
```

Backend harus memeriksa current state sebelum membuat mutation.

---

## 79. API Contract Ownership

### Backend owns:

```text
Validation
Business Rules
Calculation
Authorization
Database
Lifecycle
Final Price
Quotation State
```

### Frontend owns:

```text
User Interaction
Form State
Visual Validation
Loading State
Error Presentation
Navigation
Display
```

---

## 80. API Contract Completion Criteria

API Contract dianggap cukup untuk MVP apabila:

```text
Authentication
Settings
Feature CRUD
Feature Option CRUD
Design CRUD
Hosting CRUD
Maintenance CRUD
Project CRUD
Project Feature
Project Design
Project Hosting
Project Maintenance
Calculation
Quotation Creation
Quotation Draft Recalculation
Quotation Finalization
Quotation History
Quotation PDF
```

sudah memiliki:

```text
Endpoint
Method
Auth Requirement
Request
Response
Validation
Error
Authorization
Business Rule
```

---

## 81. Final FE ↔ BE Contract

```text
             estimator-web
                  │
                  │
              HTTP/JSON
                  │
                  ▼
             estimator-api
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
    Validation  Business  Calculation
                 Rules      Engine
                    │
                    ▼
                 Prisma
                    │
                    ▼
               PostgreSQL
```

Frontend tidak mem-bypass API untuk mengakses database.

Backend tidak mengandalkan frontend untuk enforcement business rules.

---

## 82. Final Principle

```text
Frontend
"I want to perform this action."

        ↓

API
"Are you authenticated?"

        ↓

Authorization
"Do you own this resource?"

        ↓

Business Logic
"Is this action allowed?"

        ↓

Calculation / Service
"What is the correct result based on user's rules?"

        ↓

Database
"Is the resulting data structurally valid?"

        ↓

Response
"Here is the authoritative result."
```

API Contract ini menjadi **kontrak resmi antara `estimator-web` dan `estimator-api` untuk MVP**.
