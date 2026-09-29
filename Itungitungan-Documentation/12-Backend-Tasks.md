# Backend Tasks

## Itungitungan — Configurable Project Estimation & Quotation System

---

## 1. Purpose

Dokumen ini berisi seluruh task backend untuk membangun MVP dari repository kosong sampai production-ready.

Repository:

```text
estimator-api
```

Backend stack:

```text
Node.js 24
TypeScript
Fastify
TypeBox
Prisma ORM 7
PostgreSQL
HTTP-only Session Cookie
Vitest
Docker Compose
```

Prisma 7 menggunakan `prisma-client` generator, driver adapter untuk PostgreSQL, dan `@prisma/client@7`; setup resmi PostgreSQL juga menggunakan `@prisma/adapter-pg` dan `pg`.

Fastify menyediakan TypeBox type provider untuk schema validation sekaligus type inference.

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

### BE-001 — Prepare Development Environment

#### Goal

Menyiapkan tools yang diperlukan untuk menjalankan backend.

#### Scope

Install:

```text
Git
Node.js 24
npm
Docker Desktop
VS Code / IDE
```

PostgreSQL **tidak perlu di-install langsung di host**.

PostgreSQL development berjalan melalui Docker.

#### Requirements

Verify:

```bash
git --version
node --version
npm --version
docker --version
docker compose version
```

Node harus menggunakan major version 24.

#### Dependencies

None.

#### Acceptance Criteria

```text
[ ] Git tersedia
[ ] Node.js 24 tersedia
[ ] npm tersedia
[ ] Docker tersedia
[ ] Docker Compose tersedia
```

#### Testing

Jalankan seluruh verification command.

#### Definition of Done

Semua prerequisite berhasil digunakan dari terminal.

---

## 4. Phase 1 — Repository Setup

### BE-002 — Initialize Backend Repository

#### Goal

Membuat repository backend dari nol.

#### Scope

```bash
mkdir estimator-api
cd estimator-api
git init
npm init -y
```

Buat:

```text
src/
docs/
prisma/
docker/
```

#### Requirements

Package menggunakan:

```text
"type": "module"
```

#### Dependencies

BE-001.

#### Acceptance Criteria

```text
[ ] npm project tersedia
[ ] Git repository tersedia
[ ] ESM aktif
[ ] folder dasar tersedia
```

#### Definition of Done

Repository dapat di-commit sebagai initial setup.

---

### BE-003 — Install TypeScript Toolchain

#### Goal

Menyiapkan TypeScript development environment.

#### Install

```bash
npm install -D typescript tsx @types/node
```

#### Create

```text
tsconfig.json
```

#### Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit"
  }
}
```

#### Acceptance Criteria

```bash
npm run typecheck
npm run build
```

berhasil.

#### Testing

```bash
npm run typecheck
npm run build
```

#### Definition of Done

TypeScript dapat compile tanpa error.

---

## 5. Phase 2 — Backend Dependencies

### BE-004 — Install Backend Dependencies

#### Goal

Memasang runtime dependency backend.

#### Install

```bash
npm install fastify @fastify/cors @fastify/cookie
npm install typebox @fastify/type-provider-typebox
npm install argon2 dotenv
```

Prisma/PostgreSQL:

```bash
npm install @prisma/client@7 @prisma/adapter-pg pg
npm install -D prisma@7 @types/pg
```

Testing:

```bash
npm install -D vitest
```

#### Purpose

```text
fastify
→ HTTP server

@fastify/cors
→ CORS

@fastify/cookie
→ HTTP-only cookie

typebox
→ Request/response schema

argon2
→ Password hashing

prisma
→ CLI / migrations

@prisma/client@7
→ Generated DB client

@prisma/adapter-pg
→ PostgreSQL runtime adapter

pg
→ PostgreSQL driver

dotenv
→ Environment loading

vitest
→ Testing
```

#### Acceptance Criteria

```bash
npm install
```

berhasil dan dependency dapat diimport.

#### Definition of Done

`package.json` dan lockfile sudah committed.

---

## 6. Phase 3 — Environment Configuration

### BE-005 — Configure Environment

#### Goal

Menentukan environment variable backend.

#### Required

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/project_estimator?schema=public
CORS_ORIGINS=http://localhost:5173
SESSION_COOKIE_NAME=estimator_session
```

#### Files

```text
.env
.env.example
```

`.env` tidak boleh masuk Git.

`.env.example` harus masuk Git.

#### Acceptance Criteria

Backend dapat membaca:

```text
PORT
DATABASE_URL
CORS_ORIGINS
SESSION_COOKIE_NAME
```

#### Definition of Done

Environment loader dapat digunakan seluruh module.

---

## 7. Phase 4 — Docker Database

### BE-006 — Create PostgreSQL Docker Compose

#### Goal

Menyediakan PostgreSQL development tanpa instalasi PostgreSQL di host.

#### Scope

Create:

```text
docker/compose.yaml
```

Service:

```text
postgres
```

#### Requirements

Database:

```text
database: project_estimator
user: postgres
password: postgres
port: 5432
```

Gunakan persistent volume.

#### Example Structure

```yaml
services:
  postgres:
    image: postgres
    environment:
      POSTGRES_DB: project_estimator
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### Acceptance Criteria

```bash
docker compose -f docker/compose.yaml up -d
```

berhasil.

PostgreSQL dapat menerima connection.

#### Testing

```bash
docker compose -f docker/compose.yaml ps
```

#### Definition of Done

Developer baru dapat menyediakan database development dengan satu command.

---

## 8. Phase 5 — Prisma

### BE-007 — Add Prisma Configuration

#### Goal

Menghubungkan backend dengan Prisma 7.

#### Files

```text
prisma/schema.prisma
prisma.config.ts
```

Generator:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

Datasource:

```prisma
datasource db {
  provider = "postgresql"
}
```

#### Acceptance Criteria

```bash
npx prisma validate
```

berhasil.

#### Dependencies

BE-004, BE-005.

---

### BE-008 — Implement Prisma Schema

#### Goal

Mengimplementasikan ERD v2 Final.

#### Scope

Models:

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

#### Requirements

Harus sesuai:

```text
ERD.md
PRISMA-SCHEMA.md
BUSINESS-RULES.md
```

#### Acceptance Criteria

```bash
npx prisma validate
npx prisma format
```

berhasil.

#### Definition of Done

Schema sesuai ERD dan tidak memiliki relation error.

---

## 9. BE-009 — Create Initial Migration

#### Goal

Membuat database schema PostgreSQL pertama.

#### Command

Review terlebih dahulu:

```bash
npx prisma migrate dev --name init --create-only
```

Review:

```text
prisma/migrations/
```

Setelah migration disetujui:

```bash
npx prisma migrate dev
```

#### Requirements

Migration harus mencakup:

```text
Tables
Enums
Primary Keys
Foreign Keys
Unique Constraints
Indexes
Referential Actions
Check Constraints
```

#### Check Constraints

Minimal:

```text
developerRate >= 0
workingHoursPerDay > 0

estimatedHours >= 0
overrideHours >= 0

price >= 0
internalCost >= 0
clientPrice >= 0

percentage >= 0
percentage <= 100
```

#### Acceptance Criteria

Migration berjalan pada database kosong.

#### Testing

Destroy/recreate development DB dan jalankan migration dari nol.

#### Definition of Done

Migration committed ke Git.

---

## 10. BE-010 — Prisma Client Setup

#### Goal

Membuat singleton Prisma Client.

#### File

```text
src/infrastructure/prisma/client.ts
```

#### Requirements

Gunakan:

```text
PrismaClient
PrismaPg
DATABASE_URL
```

Prisma 7 membutuhkan driver adapter PostgreSQL untuk runtime client.

#### Acceptance Criteria

Backend dapat melakukan query sederhana:

```text
SELECT / findFirst User
```

tanpa connection error.

---

## 11. BE-011 — Seed System

#### Goal

Menyediakan default catalog.

#### Scope

Seed default:

```text
Authentication
Dashboard
CRUD
Payment Gateway
Notification
Search
```

Payment Gateway harus memiliki sample options.

#### Requirements

Default data harus dibuat sebagai data milik user.

Tidak ada global shared catalog.

#### Acceptance Criteria

User baru mendapatkan default catalog.

Seed dapat dijalankan ulang tanpa menghasilkan duplicate data.

---

## 12. Phase 6 — Fastify Foundation

### BE-012 — Create Fastify Application

#### Goal

Membuat HTTP server modular.

#### Structure

```text
src/
├── app/
├── modules/
├── infrastructure/
├── shared/
└── server.ts
```

#### Requirements

Implement:

```text
Fastify
CORS
Cookie
TypeBox
Error Handler
Logger
```

#### Acceptance Criteria

```bash
npm run dev
```

server berjalan pada:

```text
http://localhost:3000
```

---

### BE-013 — Health Endpoint

#### Endpoint

```http
GET /api/health
```

#### Response

```json
{
  "data": {
    "status": "ok"
  }
}
```

#### Testing

Integration test menggunakan Fastify inject.

#### Definition of Done

Health check tidak membutuhkan authentication.

---

## 13. Phase 7 — Authentication

### BE-014 — Auth Module Structure

#### Structure

```text
src/modules/auth/
├── auth.routes.ts
├── auth.controller.ts
├── auth.service.ts
├── auth.repository.ts
├── auth.schema.ts
└── auth.types.ts
```

#### Acceptance Criteria

Module tidak bergantung langsung pada HTTP dari service.

---

### BE-015 — Register

#### Endpoint

```http
POST /api/auth/register
```

#### Scope

```text
Validate
Create User
Create DeveloperSettings
Initialize Default Catalog
Create Session
Set Cookie
```

#### Acceptance Criteria

User baru langsung dapat login dan memiliki default configuration.

#### Testing

```text
valid registration
duplicate email
invalid email
weak/invalid password
```

---

### BE-016 — Login

#### Endpoint

```http
POST /api/auth/login
```

#### Scope

```text
Find User
Verify Argon2 Hash
Create Session
Set HTTP-only Cookie
```

#### Acceptance Criteria

Password tidak pernah disimpan plaintext.

#### Testing

```text
valid credential
invalid email
invalid password
```

---

### BE-017 — Session Middleware

#### Goal

Membaca session dari cookie.

#### Scope

```text
Read Cookie
Hash Token
Find Session
Check expiresAt
Attach currentUser
```

#### Acceptance Criteria

Authenticated routes dapat membaca:

```text
request.user
```

---

### BE-018 — Logout

#### Endpoint

```http
POST /api/auth/logout
```

#### Scope

Invalidate session dan clear cookie.

#### Acceptance Criteria

Session lama tidak dapat digunakan lagi.

---

### BE-019 — Current User

#### Endpoint

```http
GET /api/auth/me
```

#### Acceptance Criteria

Mengembalikan user tanpa:

```text
passwordHash
tokenHash
```

---

## 14. Phase 8 — Developer Settings

### BE-020 — Settings Service

#### Endpoints

```http
GET /api/settings
PATCH /api/settings
```

#### Validation

```text
developerRate >= 0
workingHoursPerDay > 0
buffer 0..100
margin 0..100
rush 0..100
freeRevisionCount >= 0
additionalRevisionPrice >= 0
```

#### Testing

Unit + integration.

---

## 15. Phase 9 — Feature Catalog

### BE-021 — Feature CRUD

Endpoints:

```http
GET    /api/features
GET    /api/features/:id
POST   /api/features
PATCH  /api/features/:id
PATCH  /api/features/:id/status
```

#### Requirements

Ownership wajib.

#### Acceptance Criteria

User hanya dapat membaca/mengubah feature sendiri.

---

### BE-022 — Feature Option CRUD

Endpoints:

```http
POST  /api/features/:featureId/options
PATCH /api/features/:featureId/options/:optionId
```

#### Validation

Option harus milik feature milik current user.

---

### BE-023 — Feature Option Value CRUD

Endpoints:

```http
POST  /api/features/:featureId/options/:optionId/values
PATCH /api/features/:featureId/options/:optionId/values/:valueId
```

#### Validation

Value harus milik option yang benar.

---

## 16. Phase 10 — Design Catalog

### BE-024 — Design CRUD

Endpoints:

```http
GET    /api/designs
GET    /api/designs/:id
POST   /api/designs
PATCH  /api/designs/:id
PATCH  /api/designs/:id/status
```

#### Testing

Ownership + validation + deactivate.

---

## 17. Phase 11 — Hosting Catalog

### BE-025 — Hosting CRUD

Endpoints:

```http
GET    /api/hosting-plans
GET    /api/hosting-plans/:id
POST   /api/hosting-plans
PATCH  /api/hosting-plans/:id
PATCH  /api/hosting-plans/:id/status
```

#### Validation

```text
internalCost >= 0
clientPrice >= 0
```

---

## 18. Phase 12 — Maintenance Catalog

### BE-026 — Maintenance CRUD

Endpoints:

```http
GET    /api/maintenance-plans
GET    /api/maintenance-plans/:id
POST   /api/maintenance-plans
PATCH  /api/maintenance-plans/:id
PATCH  /api/maintenance-plans/:id/status
```

---

## 19. Phase 13 — Project

### BE-027 — Project CRUD

Endpoints:

```http
GET    /api/projects
GET    /api/projects/:id
POST   /api/projects
PATCH  /api/projects/:id
```

#### Acceptance Criteria

User hanya dapat mengakses project miliknya.

---

### BE-028 — Project Feature Management

Endpoints:

```http
POST   /api/projects/:projectId/features
PATCH  /api/projects/:projectId/features/:projectFeatureId
DELETE /api/projects/:projectId/features/:projectFeatureId
PUT    /api/projects/:projectId/features/:projectFeatureId/selections
```

#### Validation

```text
feature active
feature owned by user
feature not duplicated
option belongs to feature
value belongs to option
SINGLE/MULTIPLE respected
override >= 0
```

---

### BE-029 — Project Design

Endpoints:

```http
PUT    /api/projects/:projectId/design
DELETE /api/projects/:projectId/design
```

#### Rule

Maximum one design.

---

### BE-030 — Project Hosting

Endpoints:

```http
POST   /api/projects/:projectId/hostings
PATCH  /api/projects/:projectId/hostings/:hostingId
DELETE /api/projects/:projectId/hostings/:hostingId
```

#### Rule

Multiple hosting allowed.

---

### BE-031 — Project Maintenance

Endpoints:

```http
POST   /api/projects/:projectId/maintenances
DELETE /api/projects/:projectId/maintenances/:maintenanceId
```

#### Rule

Same maintenance plan cannot appear twice in one project.

---

## 20. Phase 14 — Calculation Engine

### BE-032 — Estimation Engine

#### Goal

Menghitung feature hours.

#### Input

```text
Feature
Base Hours
Selected Values
Project Override
```

#### Formula

```text
Base
+
Selected Option Hours
=
Feature Estimate
```

Override memiliki prioritas tertinggi.

#### Testing

Test minimal:

```text
simple feature
complex feature
multiple option
override
zero hours
```

---

### BE-033 — Buffer Engine

#### Formula

```text
CEIL(
  estimatedHours *
  (1 + bufferPercentage / 100)
)
```

Contoh:

```text
44h
20%
→ 53h
```

#### Testing

```text
0%
10%
20%
50%
100%
```

---

### BE-034 — Timeline Engine

#### Formula

```text
CEIL(
  bufferedHours /
  workingHoursPerDay
)
```

#### Testing

```text
8h / 8 = 1 day
9h / 8 = 2 days
53h / 8 = 7 days
```

---

### BE-035 — Pricing Engine

#### Formula

```text
Subtotal =
Development +
Design +
Hosting +
Maintenance
```

```text
Margin =
Subtotal × Margin / 100
```

```text
Final =
Subtotal +
Margin +
Rush Fee
```

#### Testing

Gunakan fixed examples dari Business Rules.

---

### BE-036 — Rush Engine

#### Goal

Menentukan:

```text
NORMAL
RUSH
```

dan rush fee.

#### Testing

```text
deadline after estimated completion
deadline equal estimated completion
deadline before estimated completion
no deadline
```

---

### BE-037 — Calculation Service

#### Endpoint

```http
POST /api/projects/:projectId/calculate
```

#### Acceptance Criteria

Response memiliki:

```text
estimatedHours
bufferedHours
workingDays
deadlineStatus
developmentCost
designCost
hostingCost
maintenanceCost
subtotal
marginAmount
rushFeeAmount
finalPrice
revisionPolicy
```

Backend menjadi source of truth.

---

## 21. Phase 15 — Quotation

### BE-038 — Create Draft Quotation

#### Endpoint

```http
POST /api/projects/:projectId/quotations
```

#### Scope

```text
Calculate
Build Snapshot
Determine Version
Create Quotation
```

#### Acceptance Criteria

Quotation selalu dibuat:

```text
status = DRAFT
```

---

### BE-039 — Draft Recalculation

#### Endpoint

```http
POST /api/quotations/:quotationId/recalculate
```

#### Rule

Hanya `DRAFT`.

FINAL harus ditolak.

---

### BE-040 — Quotation Detail

#### Endpoint

```http
GET /api/quotations/:quotationId
```

Response harus menggunakan snapshot data.

---

### BE-041 — Quotation History

#### Endpoint

```http
GET /api/quotations
```

Support:

```text
pagination
search
status
projectId
sort
```

---

### BE-042 — Finalize Quotation

#### Endpoint

```http
POST /api/quotations/:quotationId/finalize
```

#### Rule

```text
DRAFT → FINAL
```

FINAL tidak boleh dimutasi.

#### Testing

```text
draft finalization
already final
unauthorized
invalid ownership
```

---

### BE-043 — Quotation Versioning

#### Goal

Membuat version baru tanpa mengubah version lama.

#### Rule

```text
v1 FINAL
↓
new quotation
↓
v2 DRAFT
```

---

## 22. Phase 16 — PDF

### BE-044 — Quotation PDF

#### Endpoint

```http
GET /api/quotations/:quotationId/pdf
```

#### Requirements

PDF harus menggunakan snapshot.

#### Acceptance Criteria

Perubahan catalog tidak mengubah PDF quotation FINAL.

---

## 23. Phase 17 — Security

### BE-045 — Ownership Hardening

Audit seluruh endpoint.

Pastikan:

```text
User A ≠ User B
```

Tidak ada resource leakage melalui ID.

#### Testing

Buat:

```text
User A
User B
```

dan coba akses resource silang.

---

### BE-046 — Sensitive Data Protection

Pastikan response tidak pernah mengandung:

```text
passwordHash
tokenHash
session token
```

---

### BE-047 — Validation Hardening

Semua input API memiliki schema.

Tidak ada endpoint utama yang menerima `unknown body`.

---

## 24. Phase 18 — Testing

### BE-048 — Unit Tests

Coverage utama:

```text
Estimation Engine
Buffer Engine
Timeline Engine
Pricing Engine
Rush Engine
```

---

### BE-049 — Integration Tests

Test:

```text
Auth
Settings
Catalog
Projects
Quotation
Ownership
```

---

### BE-050 — API Regression Suite

Pastikan endpoint utama dari API Contract semuanya memiliki test.

---

## 25. Phase 19 — Production

### BE-051 — Dockerfile

Create production Dockerfile untuk API.

Output:

```text
Node runtime
Built application
Prisma generated client
```

---

### BE-052 — Production Environment

Environment:

```text
DATABASE_URL
SESSION_SECRET
CORS_ORIGINS
PORT
NODE_ENV
```

---

### BE-053 — Migration Deployment

Production menjalankan migration committed.

Tidak menggunakan:

```text
prisma migrate dev
```

untuk production.

---

### BE-054 — Backend Health Check

Deployment harus memiliki:

```http
GET /api/health
```

dan health check berhasil setelah deployment.

---

## 26. Backend Definition of Done

Task backend dianggap selesai jika:

```text
[ ] Requirement sesuai PRD
[ ] Business Rules dipenuhi
[ ] Ownership validation ada
[ ] API Contract sesuai
[ ] Validation ada
[ ] Error handling ada
[ ] Test tersedia
[ ] TypeScript no error
[ ] Migration aman jika diperlukan
[ ] No sensitive data leakage
[ ] Documentation/API update jika ada perubahan
[ ] PR siap review
```

---

## 27. Backend Development Order

```text
BE-001 Environment
 ↓
BE-002 Repository
 ↓
BE-003 TypeScript
 ↓
BE-004 Dependencies
 ↓
BE-005 Environment Config
 ↓
BE-006 Docker PostgreSQL
 ↓
BE-007 Prisma Config
 ↓
BE-008 Prisma Schema
 ↓
BE-009 Migration
 ↓
BE-010 Prisma Client
 ↓
BE-011 Seed
 ↓
BE-012 Fastify
 ↓
BE-013 Health
 ↓
BE-014–019 Auth
 ↓
BE-020 Settings
 ↓
BE-021–023 Features
 ↓
BE-024 Design
 ↓
BE-025 Hosting
 ↓
BE-026 Maintenance
 ↓
BE-027–031 Project
 ↓
BE-032–037 Calculation
 ↓
BE-038–043 Quotation
 ↓
BE-044 PDF
 ↓
BE-045–047 Security
 ↓
BE-048–050 Testing
 ↓
BE-051–054 Deployment
```
