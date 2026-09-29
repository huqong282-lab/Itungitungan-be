# Frontend Tasks

## Itungitungan — Configurable Project Estimation & Quotation System

---

## 1. Purpose

Dokumen ini berisi seluruh task frontend untuk membangun MVP dari repository kosong sampai production-ready.

Repository:

```text
estimator-web
```

Frontend stack:

```text
React
TypeScript
Vite
React Router
TanStack Query
Zustand
React Hook Form
Zod
Tailwind CSS
Lucide React
Vitest
Testing Library
```

React Router saat ini menyediakan setup langsung dengan Vite dan paket `react-router`. Tailwind CSS menyediakan integrasi Vite melalui `tailwindcss` dan `@tailwindcss/vite`.

---

## 2. Standard Ticket Format

Setiap task memiliki:

```text
ID
Title
Goal
Scope
Dependencies
Requirements
API / DB Dependency
Acceptance Criteria
Testing
Definition of Done
```

---

## 3. Phase 0 — Environment Setup

### FE-001 — Prepare Development Environment

#### Goal

Menyiapkan tools frontend.

#### Requirements

Gunakan:

```text
Git
Node.js 24
npm
VS Code / IDE
Browser modern
```

Verify:

```bash
git --version
node --version
npm --version
```

#### Dependencies

None.

#### Acceptance Criteria

Node 24 dan npm dapat digunakan.

#### Definition of Done

Developer dapat menjalankan project React lokal.

---

## 4. Phase 1 — Repository Setup

### FE-002 — Initialize React Repository

#### Goal

Membuat repository frontend.

#### Setup

```bash
mkdir estimator-web
cd estimator-web
git init
npm create vite@latest . -- --template react-ts
npm install
```

#### Acceptance Criteria

```bash
npm run dev
```

membuka aplikasi Vite.

#### Definition of Done

Initial React application committed.

---

## 5. Phase 2 — Frontend Dependencies

### FE-003 — Install Frontend Runtime Dependencies

#### Install

```bash
npm install react-router
npm install @tanstack/react-query
npm install zustand
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react
```

#### Purpose

```text
react-router
→ routing

@tanstack/react-query
→ server state

zustand
→ client/UI state

react-hook-form
→ forms

zod
→ client validation

@hookform/resolvers
→ RHF + Zod

lucide-react
→ icons
```

React Router's current installation docs use the `react-router` package.

#### Testing

Application masih harus dapat berjalan:

```bash
npm run dev
```

---

### FE-004 — Install Testing Dependencies

#### Install

```bash
npm install -D vitest jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

#### Acceptance Criteria

Vitest dapat menjalankan satu sample test.

---

## 6. Phase 3 — Tailwind & Design System Foundation

### FE-005 — Configure Tailwind

#### Install

```bash
npm install tailwindcss @tailwindcss/vite
```

Tailwind saat ini menyediakan integrasi Vite resmi melalui `@tailwindcss/vite`.

#### Scope

Configure:

```text
vite.config.ts
src/index.css
```

Gunakan:

```css
@import "tailwindcss";
```

#### Acceptance Criteria

Utility class Tailwind berhasil digunakan pada React component.

---

### FE-006 — Implement Design Tokens

#### Goal

Menerjemahkan `DESIGN-SYSTEM.md` ke frontend.

#### Scope

Implement tokens untuk:

```text
colors
spacing
radius
typography
borders
shadows
semantic states
```

#### Acceptance Criteria

Tidak ada arbitrary visual style pada core components jika token sudah tersedia.

---

## 7. Phase 4 — Application Foundation

### FE-007 — Create Application Structure

#### Structure

```text
src/
├── app/
├── pages/
├── components/
├── features/
├── lib/
├── stores/
└── types/
```

#### Acceptance Criteria

Feature-oriented structure tersedia.

---

### FE-008 — Configure React Router

#### Routes

```text
/login
/register

/app
/app/projects
/app/projects/new
/app/projects/:projectId

/app/features
/app/features/new
/app/features/:featureId

/app/designs
/app/designs/new
/app/designs/:designId

/app/hosting
/app/hosting/new
/app/hosting/:hostingId

/app/maintenance
/app/maintenance/new
/app/maintenance/:maintenanceId

/app/quotations
/app/quotations/:quotationId

/app/settings
```

#### Acceptance Criteria

Routes dapat dibuka tanpa runtime error.

---

### FE-009 — Configure TanStack Query

#### Goal

Membuat QueryClient global.

#### Scope

```text
QueryClient
Provider
Default configuration
Error handling
```

#### Acceptance Criteria

Component dapat melakukan query menggunakan TanStack Query.

---

### FE-010 — Create API Client

#### Goal

Membuat satu HTTP client wrapper.

#### Scope

```text
src/lib/api/
├── client.ts
├── auth.ts
├── features.ts
├── designs.ts
├── hosting.ts
├── maintenance.ts
├── projects.ts
└── quotations.ts
```

Gunakan native `fetch`.

#### Requirements

API client menangani:

```text
base URL
credentials: include
JSON headers
error parsing
response parsing
```

Session cookie dikirim otomatis melalui browser.

#### Acceptance Criteria

Tidak ada page yang membuat `fetch()` langsung secara random.

---

## 8. FE-011 — Application Error Handling

#### Goal

Membuat standard API error mapping.

Handle:

```text
400
401
403
404
409
422
500
Network Error
```

#### Acceptance Criteria

Backend error code dapat diterjemahkan menjadi UI message.

---

## 9. FE-012 — Reusable UI Components

#### Scope

Implement:

```text
Button
Input
Textarea
Select
MultiSelect
DatePicker
Checkbox
Radio
Switch
Card
Table
Badge
Alert
Toast
Modal
Drawer
Dropdown
Tabs
Skeleton
EmptyState
ErrorState
SearchInput
Pagination
FormField
FormSection
```

#### Acceptance Criteria

Domain pages menggunakan reusable components.

---

## 10. Phase 5 — Application Shell

### FE-013 — Build App Shell

#### Scope

```text
Topbar
Sidebar
Main Content
User Menu
```

#### Navigation

```text
Dashboard
Projects
Features
Designs
Hosting
Maintenance
Quotations
Settings
```

#### Acceptance Criteria

Authenticated pages menggunakan shell yang sama.

---

### FE-014 — Responsive Navigation

Desktop:

```text
Sidebar
```

Tablet/mobile:

```text
Drawer
```

#### Acceptance Criteria

Navigation tetap usable pada mobile.

---

## 11. Phase 6 — Authentication UI

### FE-015 — Login Page

#### Route

```text
/login
```

#### Fields

```text
Email
Password
```

#### API

```text
POST /api/auth/login
```

#### States

```text
Loading
Validation
Invalid Credential
Server Error
Success
```

#### Acceptance Criteria

Login berhasil membawa user ke `/app`.

---

### FE-016 — Register Page

#### Route

```text
/register
```

#### Fields

```text
Name
Email
Password
Confirm Password
```

#### API

```text
POST /api/auth/register
```

#### Acceptance Criteria

Setelah register:

```text
Dashboard
```

dapat dibuka tanpa login ulang jika session berhasil dibuat backend.

---

### FE-017 — Auth Guard

#### Scope

Saat membuka `/app/*`:

```text
GET /api/auth/me
```

Jika:

```text
401
```

redirect:

```text
/login
```

#### Acceptance Criteria

Unauthenticated user tidak dapat menggunakan authenticated app.

---

### FE-018 — Logout

#### API

```text
POST /api/auth/logout
```

#### Acceptance Criteria

Setelah logout:

```text
session invalid
redirect /login
```

---

## 12. Phase 7 — Settings

### FE-019 — Settings Page

#### Route

```text
/app/settings
```

#### Fields

```text
Developer Rate
Working Hours / Day
Buffer
Default Margin
Default Rush
Free Revision Count
Additional Revision Price
Currency
```

#### API

```text
GET /api/settings
PATCH /api/settings
```

#### Validation

```text
rate >= 0
workingHours > 0
percentage 0..100
revision >= 0
price >= 0
```

#### Acceptance Criteria

Settings tersimpan dan ditampilkan kembali.

---

## 13. Phase 8 — Feature Catalog

### FE-020 — Feature List

#### Route

```text
/app/features
```

#### API

```text
GET /api/features
```

#### Scope

```text
Search
Filter
Pagination
Active/Inactive
Create
Edit
Deactivate
```

---

### FE-021 — Feature Editor

#### Routes

```text
/app/features/new
/app/features/:featureId
```

#### Fields

```text
Name
Description
Category
Base Estimated Hours
```

#### API

```text
POST /api/features
PATCH /api/features/:id
```

---

### FE-022 — Feature Option Editor

#### Scope

Modal/Drawer:

```text
Create Option
Edit Option
Selection Type
```

Selection:

```text
SINGLE
MULTIPLE
```

---

### FE-023 — Feature Value Editor

#### Fields

```text
Label
Estimated Hours
Default
Active
```

#### API

```text
POST ...
PATCH ...
```

#### Acceptance Criteria

User dapat membangun feature seperti:

```text
Payment Gateway
├── Provider
│   ├── Midtrans
│   ├── Xendit
│   └── Stripe
├── Payment Type
├── Refund
└── Webhook
```

---

## 14. Phase 9 — Design Catalog

### FE-024 — Design List

#### Route

```text
/app/designs
```

#### API

```text
GET /api/designs
```

---

### FE-025 — Design Editor

#### Fields

```text
Name
Description
Price
```

#### API

```text
POST /api/designs
PATCH /api/designs/:id
PATCH /api/designs/:id/status
```

---

## 15. Phase 10 — Hosting Catalog

### FE-026 — Hosting List

#### Route

```text
/app/hosting
```

#### Columns

```text
Provider
Plan
Internal Cost
Client Price
Billing Period
Status
```

---

### FE-027 — Hosting Editor

#### Fields

```text
Provider
Plan Name
Internal Cost
Client Price
Billing Period
```

#### API

```text
POST /api/hosting-plans
PATCH /api/hosting-plans/:id
PATCH /api/hosting-plans/:id/status
```

---

## 16. Phase 11 — Maintenance Catalog

### FE-028 — Maintenance List

#### Route

```text
/app/maintenance
```

#### API

```text
GET /api/maintenance-plans
```

---

### FE-029 — Maintenance Editor

#### Fields

```text
Name
Price
Billing Period
```

#### API

```text
POST /api/maintenance-plans
PATCH /api/maintenance-plans/:id
PATCH /api/maintenance-plans/:id/status
```

---

## 17. Phase 12 — Projects

### FE-030 — Project List

#### Route

```text
/app/projects
```

#### Scope

```text
Search
Status Filter
Pagination
Open Project
Create Project
```

#### API

```text
GET /api/projects
```

---

### FE-031 — Create Project

#### Route

```text
/app/projects/new
```

#### Fields

```text
Client Name
Project Name
Logo
Deadline
```

#### API

```text
POST /api/projects
```

#### Acceptance Criteria

Success redirects to:

```text
/app/projects/:projectId
```

---

## 18. Phase 13 — Project Detail

### FE-032 — Project Detail Shell

#### Route

```text
/app/projects/:projectId
```

#### Sections

```text
Project Information
Features
Design
Hosting
Maintenance
Calculation Summary
Quotation History
```

#### API

```text
GET /api/projects/:id
```

---

### FE-033 — Project Feature Selection

#### Scope

```text
Add Feature
Remove Feature
View Estimate
```

#### API

```text
POST /api/projects/:id/features
DELETE /api/projects/:id/features/:projectFeatureId
```

---

### FE-034 — Feature Configuration

#### Scope

Dynamic UI berdasarkan:

```text
FeatureOption.selectionType
FeatureOptionValue
```

#### API

```text
PUT /api/projects/:id/features/:projectFeatureId/selections
```

#### Acceptance Criteria

SINGLE dan MULTIPLE behavior benar.

---

### FE-035 — Feature Estimate Override

#### Scope

UI:

```text
System Estimate
Project Estimate
Override
```

#### API

```text
PATCH /api/projects/:id/features/:projectFeatureId
```

#### Acceptance Criteria

Override hanya mempengaruhi project tersebut.

---

## 19. FE-036 — Project Design

#### Scope

```text
Select Design
Change Design
Remove Design
```

#### API

```text
PUT /api/projects/:id/design
DELETE /api/projects/:id/design
```

Maksimal satu design.

---

## 20. FE-037 — Project Hosting

#### Scope

```text
Add Hosting
Edit Hosting
Remove Hosting
```

Fields:

```text
Label
Hosting Plan
Client Provided
```

#### API

```text
POST /api/projects/:id/hostings
PATCH /api/projects/:id/hostings/:hostingId
DELETE /api/projects/:id/hostings/:hostingId
```

---

## 21. FE-038 — Project Maintenance

#### Scope

```text
Add Maintenance
Remove Maintenance
```

#### API

```text
POST /api/projects/:id/maintenances
DELETE /api/projects/:id/maintenances/:maintenanceId
```

---

## 22. Phase 14 — Calculation UI

### FE-039 — Calculation Trigger

#### Goal

Memanggil backend calculation.

#### API

```text
POST /api/projects/:id/calculate
```

#### Rules

Frontend tidak menghitung final price.

---

### FE-040 — Calculation Summary

#### Display

```text
Estimated Hours
Buffer
Buffered Hours
Working Days
Deadline
Deadline Status

Development Cost
Design Cost
Hosting Cost
Maintenance Cost
Subtotal
Margin
Rush Fee
Final Price
```

Contoh:

```text
Estimated
44h

Buffer
20%

Buffered
53h

Duration
7 days
```

---

### FE-041 — Calculation States

Implement:

```text
Loading
Success
Validation Error
Calculation Error
Rush Warning
```

#### Acceptance Criteria

UI selalu mencerminkan backend result.

---

## 23. Phase 15 — Quotation

### FE-042 — Create Draft Quotation

#### Action

```text
Create Quotation
```

#### API

```text
POST /api/projects/:id/quotations
```

#### Acceptance Criteria

Redirect:

```text
/app/quotations/:quotationId
```

---

### FE-043 — Quotation Detail

#### Display

```text
Client
Project
Features
Design
Hosting
Maintenance
Timeline
Pricing
Revision
Status
```

#### API

```text
GET /api/quotations/:id
```

---

### FE-044 — Draft Recalculate

#### API

```text
POST /api/quotations/:id/recalculate
```

Button hanya terlihat jika:

```text
status = DRAFT
```

---

### FE-045 — Finalize Quotation

#### Scope

Confirmation modal.

#### API

```text
POST /api/quotations/:id/finalize
```

#### Acceptance Criteria

Setelah success:

```text
status = FINAL
```

Edit controls hilang.

---

### FE-046 — Final Quotation Read-only

Jika:

```text
status = FINAL
```

UI:

```text
Edit → hidden
Recalculate → hidden
Finalize → hidden
```

Tampilkan:

```text
FINAL / Locked
Download PDF
```

Backend tetap menjadi security enforcement.

---

## 24. FE-047 — Quotation History

#### Screen

```text
/app/quotations
```

#### API

```text
GET /api/quotations
```

#### Display

```text
Quotation Number
Project
Client
Version
Status
Final Price
Created At
```

---

## 25. FE-048 — Project Quotation History

Di Project Detail:

```text
Quotation History
```

Menampilkan:

```text
v1 FINAL
v2 FINAL
v3 DRAFT
```

---

## 26. FE-049 — Quotation PDF

#### Action

```text
Download PDF
```

#### API

```text
GET /api/quotations/:quotationId/pdf
```

#### Acceptance Criteria

Browser menerima PDF tanpa menampilkan internal-only data yang tidak seharusnya muncul.

---

## 27. Phase 16 — UX Hardening

### FE-050 — Loading States

Semua query utama memiliki:

```text
Skeleton
Loading Button
Disabled Duplicate Submit
```

---

### FE-051 — Empty States

Implement empty states untuk:

```text
Projects
Features
Designs
Hosting
Maintenance
Quotations
```

---

### FE-052 — Error States

Handle:

```text
400
401
403
404
409
422
500
Network Error
```

---

### FE-053 — Unsaved Changes

Form editor memberikan warning jika user meninggalkan halaman dengan perubahan yang belum disimpan.

---

### FE-054 — Confirmation Dialogs

Implement confirmation untuk:

```text
Deactivate
Remove Feature
Remove Hosting
Remove Maintenance
Finalize Quotation
```

---

## 28. Phase 17 — Responsive UI

### FE-055 — Desktop

Optimize:

```text
Sidebar
Tables
Calculator
Quotation
```

---

### FE-056 — Tablet

Implement:

```text
Collapsible Sidebar
Responsive Tables
```

---

### FE-057 — Mobile

Transform:

```text
Sidebar → Drawer
Table → Card/List
Multi-column → Stack
```

Calculator tetap usable.

---

## 29. Phase 18 — Accessibility

### FE-058 — Accessibility Pass

Check:

```text
Keyboard navigation
Focus states
Labels
Button semantics
Modal focus
Error association
Color contrast
```

Status tidak boleh hanya dibedakan dengan warna.

---

## 30. Phase 19 — Testing

### FE-059 — Component Unit Tests

Test:

```text
Button
Input
Modal
Select
Feature Configuration
Pricing Summary
Status Badge
```

---

### FE-060 — Feature Tests

Test:

```text
Login
Register
Feature Catalog
Project Feature Selection
Quotation Draft
Quotation Final
```

---

### FE-061 — Integration Tests

Test screen/API interaction:

```text
Settings
Projects
Calculation
Quotation
```

---

### FE-062 — E2E Test

Main flow:

```text
Register
↓
Dashboard
↓
Create Project
↓
Add Feature
↓
Configure Feature
↓
Select Design
↓
Add Hosting
↓
Add Maintenance
↓
Calculate
↓
Create Draft
↓
Finalize
↓
Quotation History
```

---

## 31. Phase 20 — Production Frontend

### FE-063 — Production Build

Run:

```bash
npm run build
```

#### Acceptance Criteria

Build berhasil tanpa TypeScript error.

---

### FE-064 — Frontend Dockerfile

#### Goal

Menjalankan production static build melalui container.

Target:

```text
React build
↓
Nginx
↓
Static assets
```

Development tetap menjalankan Vite pada host.

---

### FE-065 — Production Environment

Environment:

```env
VITE_API_URL=
```

Tidak memasukkan:

```text
DATABASE_URL
SESSION_SECRET
```

ke frontend.

---

### FE-066 — Deployment Smoke Test

Check:

```text
Login
Dashboard
API Request
Create Project
Calculation
Quotation
```

---

## 32. Frontend Definition of Done

Task frontend dianggap selesai jika:

```text
[ ] UI sesuai Screen Map
[ ] Behavior sesuai UI-Spec
[ ] Design System digunakan
[ ] API Contract sesuai
[ ] Loading state ada
[ ] Empty state ada
[ ] Error state ada
[ ] Validation ada
[ ] Responsive
[ ] Accessibility minimum terpenuhi
[ ] TypeScript tidak error
[ ] Test tersedia
[ ] No duplicate business calculation
[ ] PR siap review
```

---

## 33. Frontend Development Order

```text
FE-001 Environment
 ↓
FE-002 Repository
 ↓
FE-003 Dependencies
 ↓
FE-004 Testing
 ↓
FE-005 Tailwind
 ↓
FE-006 Design Tokens
 ↓
FE-007 Structure
 ↓
FE-008 Router
 ↓
FE-009 Query
 ↓
FE-010 API Client
 ↓
FE-011 Error Handling
 ↓
FE-012 Components
 ↓
FE-013–014 App Shell
 ↓
FE-015–018 Auth
 ↓
FE-019 Settings
 ↓
FE-020–023 Features
 ↓
FE-024–025 Designs
 ↓
FE-026–027 Hosting
 ↓
FE-028–029 Maintenance
 ↓
FE-030–031 Projects
 ↓
FE-032–038 Project Configuration
 ↓
FE-039–041 Calculation
 ↓
FE-042–049 Quotation
 ↓
FE-050–058 UX Hardening
 ↓
FE-059–062 Testing
 ↓
FE-063–066 Production
```

---

## 34. FE ↔ BE Dependencies

```text
Backend
          Frontend

BE-015 ──────→ FE-015
Register

BE-016 ──────→ FE-016
Login

BE-019 ──────→ FE-017
Auth Guard (current user)

BE-018 ──────→ FE-018
Logout

BE-020 ──────→ FE-019
Settings

BE-021–023 ──→ FE-020–023
Features

BE-024 ───────→ FE-024–025
Design

BE-025 ───────→ FE-026–027
Hosting

BE-026 ───────→ FE-028–029
Maintenance

BE-027–031 ───→ FE-030–038
Projects

BE-037 ───────→ FE-039–041
Calculation

BE-038–044 ───→ FE-042–049
Quotation

BE-048–050 ───→ FE-059–062
Testing
```

Frontend dapat mulai membuat UI lebih awal berdasarkan:

```text
API-CONTRACT.md
UI-SPEC.md
```

tanpa menunggu backend selesai sepenuhnya.

---

## 35. Parallel Development Model

```text
                 API CONTRACT
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
   BACKEND DEVELOPMENT     FRONTEND DEVELOPMENT
          │                       │
          │                       │
          └───────────┬───────────┘
                      ▼
                  INTEGRATION
                      │
                      ▼
                    TEST
                      │
                      ▼
                     MVP
```

---

## 36. Final MVP Task Flow

```text
SETUP
│
├── Backend
│
└── Frontend
      ↓
FOUNDATION
│
├── Database
├── API
├── App Shell
└── Authentication
      ↓
CATALOG
│
├── Features
├── Designs
├── Hosting
└── Maintenance
      ↓
PROJECT
│
├── Create
├── Feature Configuration
├── Design
├── Hosting
└── Maintenance
      ↓
CALCULATION
│
├── Estimation
├── Buffer
├── Timeline
├── Deadline
├── Rush
└── Pricing
      ↓
QUOTATION
│
├── Draft
├── Recalculate
├── Finalize
└── History
      ↓
QUALITY
│
├── Security
├── Unit
├── Integration
└── E2E
      ↓
DEPLOYMENT
      ↓
MVP
```

---

## 37. Final Task Principle

Developer tidak menerima task seperti:

```text
"Kerjakan fitur project."
```

Task harus selalu menjawab:

```text
Apa yang dibuat?
Kenapa dibuat?
Dependency-nya apa?
API/DB apa yang digunakan?
Aturan apa yang berlaku?
Kapan dianggap selesai?
Bagaimana cara mengetesnya?
```

Dengan demikian setiap task dapat dikerjakan secara mandiri tanpa kehilangan konteks produk.
