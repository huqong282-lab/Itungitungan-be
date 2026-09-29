# Development Plan

## Itungitungan — Configurable Project Estimation & Quotation System

---

## 1. Purpose

Dokumen ini mendefinisikan urutan pengembangan project dari setup awal sampai MVP siap digunakan.

Development Plan menjadi referensi untuk:

- Backend development
- Frontend development
- Integration
- Testing
- Deployment
- Task breakdown
- Progress tracking

Dokumen ini tidak menggantikan `PRD.md`, `ERD.md`, `BUSINESS-RULES.md`, atau `API-CONTRACT.md`.

---

## 2. Development Philosophy

Project dikembangkan secara bertahap berdasarkan dependency.

Prinsip:

```text
Foundation
    ↓
Infrastructure
    ↓
Backend Core
    ↓
Frontend Core
    ↓
Business Features
    ↓
Integration
    ↓
Testing
    ↓
Deployment
```

Tidak mengerjakan feature UI yang bergantung pada API yang belum memiliki kontrak.

---

## 3. Repository Structure

Project menggunakan dua repository.

```text
GitHub
│
├── estimator-api
│
└── estimator-web
```

### estimator-api

```text
estimator-api/
├── docs/
├── prisma/
├── src/
├── docker/
├── Dockerfile
├── prisma.config.ts
├── package.json
└── README.md
```

### estimator-web

```text
estimator-web/
├── docs/
├── src/
├── public/
├── Dockerfile
├── package.json
└── README.md
```

---

## 4. Development Phases

```text
Phase 0  → Documentation Baseline
Phase 1  → Repository & Tooling Setup
Phase 2  → Database Foundation
Phase 3  → Backend Foundation
Phase 4  → Authentication
Phase 5  → Catalog Management
Phase 6  → Project Management
Phase 7  → Calculation Engine
Phase 8  → Quotation
Phase 9  → Frontend Foundation
Phase 10 → Frontend Catalog
Phase 11 → Frontend Project Workflow
Phase 12 → Frontend Quotation
Phase 13 → FE-BE Integration
Phase 14 → Testing & Hardening
Phase 15 → Deployment
```

Beberapa phase dapat berjalan paralel setelah dependency terpenuhi.

---

## 5. Phase 0 — Documentation Baseline

Status:

```text
DONE
```

Dokumen:

```text
PRD.md
BUSINESS-RULES.md
USER-FLOW.md
ERD.md
ARCHITECTURE.md
PRISMA-SCHEMA.md
SCREEN-MAP.md
UI-SPEC.md
DESIGN-SYSTEM.md
API-CONTRACT.md
```

Tujuan:

```text
Semua requirement utama memiliki source of truth.
```

---

## 6. Phase 1 — Repository & Tooling Setup

### Backend

Setup:

```text
Node.js
TypeScript
Fastify
Prisma
ESM
ESLint / Formatter
Environment Config
Testing Framework
```

Output:

```text
Fastify server dapat berjalan.
Health endpoint tersedia.
Prisma configuration tersedia.
Environment loading berjalan.
```

### Frontend

Setup:

```text
React
TypeScript
Vite
React Router
TanStack Query
Zustand
Tailwind CSS
ESLint / Formatter
Testing Framework
```

Output:

```text
Frontend dapat berjalan.
Router aktif.
Application shell dasar tersedia.
```

### Docker

Development infrastructure:

```text
PostgreSQL
```

dijalankan melalui Docker Compose.

---

## 7. Phase 2 — Database Foundation

### Tasks

```text
Create Prisma Schema
Create Prisma Config
Validate Schema
Create Initial Migration
Review Migration SQL
Apply Migration
Add Database Constraints
Add Indexes
Create Seed System
Create Default Catalog Seed
```

### Output

Database memiliki:

```text
User
DeveloperSettings
Session

Feature
FeatureOption
FeatureOptionValue

Design
HostingPlan
MaintenancePlan

Project
ProjectFeature
ProjectFeatureSelection
ProjectDesign
ProjectHosting
ProjectMaintenance

Quotation
QuotationFeature
QuotationFeatureSelection
QuotationDesign
QuotationHosting
QuotationMaintenance
```

### Acceptance

```text
Migration berhasil.
Schema sesuai ERD.
Foreign keys valid.
Unique constraints valid.
Indexes tersedia.
Check constraints valid.
Seed dapat dijalankan.
```

---

## 8. Phase 3 — Backend Foundation

### Backend Architecture

Implement:

```text
src/
├── app/
├── modules/
├── infrastructure/
└── shared/
```

Module awal:

```text
auth
settings
features
designs
hosting
maintenance
projects
calculations
quotations
```

### Infrastructure

Implement:

```text
Fastify bootstrap
Error handler
Request validation
Database client
Environment config
Logging
CORS
Authentication middleware
```

### Health Check

Endpoint:

```http
GET /api/health
```

Response:

```json
{
  "data": {
    "status": "ok"
  }
}
```

---

## 9. Phase 4 — Authentication

### Backend

Implement:

```text
Register
Login
Current User
Logout
Session Validation
Session Expiration
Password Hashing
Ownership Context
```

### Frontend

Implement:

```text
Login Page
Register Page
Authentication Guard
Logout
Session Initialization
```

### Integration

Flow:

```text
Register
 ↓
User + Settings + Default Catalog
 ↓
Session
 ↓
Dashboard
```

---

## 10. Phase 5 — Catalog Management

Catalog dikerjakan sebelum project calculator karena project membutuhkan catalog.

Urutan:

```text
Developer Settings
        ↓
Features
        ↓
Feature Options
        ↓
Feature Values
        ↓
Designs
        ↓
Hosting Plans
        ↓
Maintenance Plans
```

---

## 11. Settings Implementation

Backend:

```text
GET /api/settings
PATCH /api/settings
```

Frontend:

```text
Settings Page
Pricing Form
Timeline Form
Margin Form
Rush Form
Revision Form
```

Acceptance:

```text
Settings tersimpan.
Validation berjalan.
Project baru menggunakan settings terbaru.
Quotation lama tidak berubah.
```

---

## 12. Feature Catalog Implementation

### Backend

```text
List Feature
Get Feature
Create Feature
Update Feature
Deactivate Feature

Create Option
Update Option

Create Value
Update Value
Deactivate Value
```

### Frontend

```text
Feature List
Feature Editor
Option Editor
Value Editor
Search
Filter
Deactivate Confirmation
```

Acceptance:

```text
Feature hanya milik current user.
Feature inactive tidak muncul pada selector project baru.
Option dan Value dapat CRUD.
```

---

## 13. Design Catalog Implementation

Backend:

```text
List
Get
Create
Update
Deactivate
```

Frontend:

```text
Design List
Design Editor
Deactivate
```

---

## 14. Hosting Catalog Implementation

Backend:

```text
List
Get
Create
Update
Deactivate
```

Frontend:

```text
Hosting List
Hosting Editor
Internal Cost
Client Price
Billing Period
```

Internal cost hanya tersedia pada internal authenticated UI.

---

## 15. Maintenance Catalog Implementation

Backend:

```text
List
Get
Create
Update
Deactivate
```

Frontend:

```text
Maintenance List
Maintenance Editor
```

---

## 16. Phase 6 — Project Management

Project CRUD menjadi fondasi calculator.

### Backend

Implement:

```text
Create Project
List Projects
Get Project
Update Project
```

### Frontend

Implement:

```text
Project List
Create Project
Project Detail
Project Header
Project Information
```

---

## 17. Project Feature Workflow

Backend:

```text
Add Feature
Remove Feature
Update Override
Replace Selections
```

Frontend:

```text
Add Feature
Remove Feature
Configure Feature
Override Estimate
```

Business rules:

```text
Same feature tidak boleh ditambahkan dua kali.
Feature inactive tidak dapat digunakan project baru.
Feature ownership wajib diverifikasi.
```

---

## 18. Project Design Workflow

Backend:

```text
Set Design
Remove Design
```

Frontend:

```text
Design Selector
Selected Design
Change Design
Remove Design
```

Rule:

```text
Maksimal satu design per project.
```

---

## 19. Project Hosting Workflow

Backend:

```text
Add Hosting
Update Hosting
Remove Hosting
```

Frontend:

```text
Hosting List
Add Hosting
Edit Hosting
Remove Hosting
```

Rule:

```text
Project dapat memiliki banyak hosting.
```

Contoh:

```text
Production
Staging
```

---

## 20. Project Maintenance Workflow

Backend:

```text
Add Maintenance
Remove Maintenance
```

Frontend:

```text
Maintenance List
Add Maintenance
Remove Maintenance
```

Rule:

```text
Plan yang sama tidak dapat ditambahkan dua kali.
```

---

## 21. Phase 7 — Calculation Engine

Ini merupakan core business logic.

Calculation Engine dipisahkan dari HTTP controller.

Struktur:

```text
calculations/
├── calculation.service.ts
├── estimation.engine.ts
├── pricing.engine.ts
├── timeline.engine.ts
└── rush.engine.ts
```

---

## 22. Estimation Engine

Input:

```text
ProjectFeature
Feature
FeatureOption
FeatureOptionValue
Project Override
```

Output:

```text
Estimated Hours
Feature Breakdown
```

Rumus:

```text
Feature Hours
=
Base Hours
+
Selected Option Hours
```

Project override memiliki prioritas:

```text
Project Override
        ↓
Calculated Feature Hours
```

---

## 23. Buffer Calculation

Rumus final:

```text
Buffered Hours
=
CEIL(
  Estimated Hours ×
  (1 + Buffer Percentage / 100)
)
```

Contoh:

```text
44h
20%
↓
52.8
↓
53h
```

---

## 24. Timeline Calculation

Rumus:

```text
Working Days
=
CEIL(
  Buffered Hours /
  Working Hours Per Day
)
```

Contoh:

```text
53h
÷ 8h
=
6.625
↓
7 hari
```

Output:

```text
bufferedHours
workingDays
```

Keduanya berupa integer.

---

## 25. Pricing Engine

Input:

```text
Development
Design
Hosting
Maintenance
Margin
Rush Fee
```

Output:

```text
Subtotal
Margin Amount
Rush Fee Amount
Final Price
```

Rumus:

```text
Subtotal
=
Development
+
Design
+
Hosting
+
Maintenance
```

```text
Margin Amount
=
Subtotal × Margin / 100
```

```text
Final Price
=
Subtotal
+
Margin
+
Rush Fee
```

---

## 26. Rush Detection

Input:

```text
Deadline
Estimated Duration
```

Output:

```text
NORMAL
atau
RUSH
```

Jika rush:

```text
Rush Fee
=
Configured Rush Percentage
```

Business rule menjadi source of truth.

---

## 27. Calculation API

Endpoint:

```http
POST /api/projects/:projectId/calculate
```

Response harus menyediakan:

```text
estimatedHours
bufferPercentage
bufferedHours
workingHoursPerDay
workingDays
deadline
deadlineStatus
developmentCost
designCost
hostingCost
maintenanceCost
subtotal
marginPercentage
marginAmount
rushFeePercentage
rushFeeAmount
finalPrice
revisionPolicy
```

---

## 28. Calculation Testing

Sebelum quotation dibuat, Calculation Engine harus memiliki unit tests untuk:

```text
Simple Feature
Complex Feature
Project Override
Buffer
Timeline
Margin
Rush
Hosting
Maintenance
No Design
Multiple Hosting
Multiple Maintenance
```

Edge case:

```text
0 hour feature
0% buffer
100% buffer
0% margin
100% margin
No deadline
Rush deadline
Client-provided hosting
No maintenance
No design
```

---

## 29. Phase 8 — Quotation

Quotation dibuat setelah calculation engine stabil.

Urutan:

```text
Calculate
 ↓
Create Draft
 ↓
Edit / Recalculate
 ↓
Finalize
 ↓
Historical Snapshot
```

---

## 30. Quotation Draft

Backend:

```text
Create Draft
Get Draft
Recalculate Draft
```

Snapshot harus menyimpan:

```text
Client
Project
Developer Rate
Working Hours
Feature
Feature Selection
Design
Hosting
Maintenance
Buffer
Margin
Rush
Revision Policy
```

---

## 31. Quotation Finalization

Endpoint:

```http
POST /api/quotations/:quotationId/finalize
```

Flow:

```text
DRAFT
 ↓
Validate
 ↓
Finalize
 ↓
FINAL
```

Set:

```text
status = FINAL
finalizedAt = current time
```

Setelah final:

```text
No Edit
No Recalculate
No Mutation
```

---

## 32. Quotation Versioning

Jika quotation FINAL perlu berubah:

```text
v1 FINAL
   ↓
Project Changes
   ↓
New Quotation
   ↓
v2 DRAFT
```

Jangan mengubah v1.

---

## 33. Quotation PDF

MVP:

```text
GET /api/quotations/:quotationId/pdf
```

PDF harus menggunakan quotation snapshot.

Perubahan catalog tidak mengubah PDF historical quotation.

---

## 34. Phase 9 — Frontend Foundation

Frontend implementation dimulai setelah API contract dan core backend endpoint stabil.

Implement:

```text
Application Shell
Routing
Authentication State
TanStack Query
Global Error Handling
Toast
Form System
Reusable UI Components
Responsive Layout
```

---

## 35. Phase 10 — Frontend Catalog

Urutan:

```text
Settings
Features
Designs
Hosting
Maintenance
```

Setiap module:

```text
List
Create
Edit
Deactivate
Empty State
Loading State
Error State
```

---

## 36. Phase 11 — Frontend Project Workflow

Urutan:

```text
Project List
 ↓
Create Project
 ↓
Project Detail
 ↓
Feature Selection
 ↓
Feature Configuration
 ↓
Design
 ↓
Hosting
 ↓
Maintenance
 ↓
Calculation Summary
```

---

## 37. Phase 12 — Frontend Quotation

Urutan:

```text
Create Draft
 ↓
Quotation Detail
 ↓
Recalculate
 ↓
Review
 ↓
Finalize
 ↓
Quotation Final
 ↓
Quotation History
```

---

## 38. Phase 13 — FE/BE Integration

Tujuan:

```text
Semua screen terhubung ke actual API.
```

Integration dilakukan berdasarkan domain:

```text
Auth
 ↓
Settings
 ↓
Catalog
 ↓
Projects
 ↓
Calculation
 ↓
Quotation
```

Tidak mengintegrasikan seluruh aplikasi sekaligus.

---

## 39. Integration Rules

Frontend tidak boleh membuat duplicate business logic.

Contoh:

Frontend:

```text
POST /calculate
```

Backend:

```text
Calculation Engine
```

Frontend menerima:

```text
finalPrice
workingDays
rushStatus
```

kemudian menampilkan.

---

## 40. Phase 14 — Testing & Hardening

Testing layers:

```text
Unit
Integration
E2E
```

---

## 41. Unit Testing

Fokus:

```text
Estimation Engine
Pricing Engine
Timeline Engine
Rush Engine
Validation
```

---

## 42. Integration Testing

Fokus:

```text
Authentication
Ownership
Feature CRUD
Project CRUD
Calculation Endpoint
Quotation Creation
Quotation Finalization
```

---

## 43. E2E Testing

Main scenario:

```text
Register
 ↓
Login
 ↓
Configure Settings
 ↓
Create Project
 ↓
Add Features
 ↓
Configure Feature
 ↓
Select Design
 ↓
Select Hosting
 ↓
Select Maintenance
 ↓
Calculate
 ↓
Create Quotation
 ↓
Review Draft
 ↓
Finalize
 ↓
View History
```

---

## 44. Security Testing

Minimal:

```text
User A cannot access User B Project
User A cannot access User B Feature
User A cannot access User B Quotation
Expired Session rejected
FINAL Quotation cannot be mutated
Inactive catalog unavailable for new project
```

---

## 45. Phase 15 — Deployment

### Development

```text
Frontend
→ Host

Backend
→ Host

PostgreSQL
→ Docker
```

### Production

```text
Frontend
→ Docker / Nginx

Backend
→ Docker

PostgreSQL
→ Managed PostgreSQL
```

---

## 46. Production Deployment Flow

```text
Git Push
 ↓
CI
 ↓
Test
 ↓
Build
 ↓
Build Docker Image
 ↓
Deploy
 ↓
Database Migration
 ↓
Health Check
 ↓
Ready
```

---

## 47. Database Migration Strategy

Development:

```bash
npx prisma migrate dev
```

Production:

```text
Deploy committed migrations
        ↓
Apply migration
        ↓
Start application
```

Migration files harus committed ke Git.

Migration lama tidak diedit setelah digunakan bersama.

---

## 48. Seed Strategy

Default catalog hanya dibuat sebagai initial user configuration.

Seed atau initialization harus memastikan:

```text
New User
 ↓
Settings
 ↓
Default Feature
 ↓
Default Option
 ↓
Default Option Value
 ↓
Default Design
 ↓
Default Hosting
 ↓
Default Maintenance
```

Seed tidak boleh menciptakan shared catalog global untuk seluruh user.

---

## 49. Git Workflow

Repository menggunakan branch-based development.

Contoh:

```text
main
 │
 ├── feature/auth
 ├── feature/catalog
 ├── feature/projects
 ├── feature/calculation
 └── feature/quotation
```

Branch harus memiliki scope yang jelas.

---

## 50. Commit Strategy

Commit menjelaskan satu perubahan logis.

Contoh:

```text
feat(auth): add session login
feat(features): add feature CRUD
feat(calculation): add buffer calculation
fix(quotation): prevent final quotation mutation
test(calculation): add timeline tests
refactor(projects): extract project service
```

Hindari:

```text
update stuff
fix
changes
final
```

---

## 51. Pull Request Strategy

PR harus menjelaskan:

```text
What changed?
Why?
How was it tested?
Any migration?
Any API change?
Any breaking change?
```

Contoh:

```text
Feature: Project Calculation

Changes:
- Add estimation engine
- Add timeline engine
- Add pricing engine
- Add calculation endpoint

Testing:
- Unit tests
- API integration test

Migration:
- None
```

---

## 52. Dependency Rules

Implementasi mengikuti dependency berikut:

```text
Database
 ↓
Backend Domain
 ↓
API
 ↓
Frontend Integration
 ↓
UI Polish
```

Jangan membuat frontend memperkirakan contract API yang belum ditentukan.

---

## 53. Parallel Development

Setelah API Contract stabil, FE dan BE dapat bekerja paralel.

```text
              API Contract
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
     Backend Task      Frontend Task
          │                 │
          └────────┬────────┘
                   ▼
                Integrate
```

Backend dapat menggunakan fixture/mock response saat FE development.

Frontend tidak perlu menunggu seluruh backend selesai untuk mulai bekerja.

---

## 54. Feature Completion Workflow

Setiap feature mengikuti:

```text
Requirement
 ↓
Business Rule
 ↓
ERD/API Dependency
 ↓
Backend
 ↓
Frontend
 ↓
Integration
 ↓
Test
 ↓
Review
 ↓
Done
```

---

## 55. Suggested Feature Development Order

#### Feature 1

Authentication

```text
Register
Login
Session
Logout
```

#### Feature 2

Developer Settings

#### Feature 3

Feature Catalog

#### Feature 4

Design Catalog

#### Feature 5

Hosting Catalog

#### Feature 6

Maintenance Catalog

#### Feature 7

Project Management

#### Feature 8

Feature Configuration

#### Feature 9

Calculation Engine

#### Feature 10

Quotation

#### Feature 11

Quotation Finalization

#### Feature 12

Quotation History

#### Feature 13

PDF

---

## 56. MVP Completion Order

```text
1. Authentication
2. Settings
3. Catalog
4. Project
5. Calculation
6. Quotation Draft
7. Quotation Final
8. Quotation History
9. PDF
10. Testing
11. Deployment
```

---

## 57. Out of Scope During MVP

Jangan mengerjakan:

```text
AI Estimation
CRM
Client Portal
Team Collaboration
Online Payment
Invoice
WhatsApp Integration
Advanced Holiday Calendar
Advanced Analytics
Public Marketing Website
```

Scope tersebut dapat menjadi future roadmap.

---

## 58. Definition of Integration Complete

FE/BE integration dianggap selesai apabila:

```text
Authentication works
Settings works
Catalog works
Project works
Calculation works
Quotation works
Ownership works
Quotation lifecycle works
Error handling works
Loading states works
```

dan tidak ada mock business data pada main workflow.

---

## 59. Definition of MVP Complete

MVP dianggap selesai apabila user dapat:

```text
Register
 ↓
Login
 ↓
Configure Pricing
 ↓
Configure Catalog
 ↓
Create Project
 ↓
Configure Project
 ↓
Calculate Estimate
 ↓
Detect Rush
 ↓
Generate Quotation
 ↓
Edit Draft
 ↓
Finalize
 ↓
View History
 ↓
Generate PDF
```

semua tanpa proses manual eksternal.

---

## 60. Final Development Pipeline

```text
                    PRODUCT
                       │
                       ▼
                     PRD
                       │
                       ▼
               BUSINESS RULES
                       │
                       ▼
                   USER FLOW
                       │
                       ▼
                  SCREEN MAP
                       │
                       ▼
                    UI SPEC
                       │
                       ▼
                DESIGN SYSTEM
                       │
                       ▼
                     ERD
                       │
                       ▼
                 ARCHITECTURE
                       │
                       ▼
                PRISMA SCHEMA
                       │
                       ▼
                 API CONTRACT
                       │
                       ▼
             DEVELOPMENT PLAN
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
    BACKEND TASKS             FRONTEND TASKS
         │                           │
         └─────────────┬─────────────┘
                       ▼
                   INTEGRATION
                       │
                       ▼
                    TESTING
                       │
                       ▼
                  DEPLOYMENT
                       │
                       ▼
                      MVP
```

---

## 61. Final Principle

Development tidak dimulai dengan:

```text
"Fitur apa yang mau dibuat hari ini?"
```

tetapi:

```text
Requirement
→ Rule
→ Design
→ Contract
→ Task
→ Implementation
→ Test
→ Done
```

Dengan urutan ini, setiap task memiliki konteks dan dependency yang jelas, sehingga developer tidak harus menunggu instruksi manual untuk mengetahui pekerjaan berikutnya.
