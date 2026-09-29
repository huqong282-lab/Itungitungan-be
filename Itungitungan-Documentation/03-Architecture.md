# Tech Stack & Architecture Final

## Itungitungan — Configurable Project Estimation & Quotation System

---

## 1. Architecture Decision

### Architecture Style

Project menggunakan **Modular Monolith**.

MVP tidak menggunakan microservices karena belum ada kebutuhan yang membenarkan kompleksitas tambahan.

Struktur utama:

```text
Frontend
    ↓ REST API
Backend
    ↓
PostgreSQL
```

Backend tetap menjadi satu application service, tetapi modul internal dipisahkan berdasarkan domain.

---

## 2. Repository Strategy

Project menggunakan **2 repository**.

```text
GitHub
│
├── estimator-web
│   └── Frontend
│
└── estimator-api
    └── Backend
```

### estimator-web

Berisi:

- React application
- UI components
- pages
- client-side state
- server state
- API client

### estimator-api

Berisi:

- REST API
- authentication
- authorization
- business logic
- calculation engine
- quotation generation
- Prisma
- database access

### Alasan

Frontend dan backend memiliki responsibility yang berbeda dan dapat dikembangkan serta dideploy secara independen.

Repository boundary juga memperjelas hubungan:

```text
Frontend
    ↓
API Contract
    ↓
Backend
```

---

## 3. Frontend

### Technology

```text
React
TypeScript
Vite
React Router
TanStack Query
Zustand
Tailwind CSS
```

React + Vite dipilih karena estimator merupakan authenticated business application, bukan website publik yang membutuhkan SSR/SEO sebagai kebutuhan utama.

React menyediakan pendekatan build-from-scratch dengan Vite ketika framework yang lebih besar tidak diperlukan; dokumentasi React saat ini juga menunjukkan Vite sebagai salah satu jalur resmi untuk aplikasi React yang dibangun dari scratch.

---

## 4. Frontend Responsibility

Frontend bertanggung jawab terhadap:

```text
UI
Routing
Form
User Interaction
Loading State
Error State
Client State
Server State
Presentation
```

Frontend **tidak menjadi source of truth untuk business calculation**.

Contoh:

```text
Frontend
→ memilih feature
→ mengirim konfigurasi project
→ menerima hasil kalkulasi
→ menampilkan hasil
```

Bukan:

```text
Frontend
→ menghitung finalPrice sendiri
```

---

## 5. Frontend Routing

Struktur route:

```text
/login
/register

/app
/app/projects
/app/projects/:id

/app/features
/app/designs
/app/hosting
/app/maintenance

/app/quotations
/app/quotations/:id

/app/settings
```

Semua route `/app/*` membutuhkan authentication.

---

## 6. Frontend State Strategy

### Server State

Gunakan:

```text
TanStack Query
```

Untuk:

```text
Features
Designs
Hosting
Maintenance
Projects
Quotations
User Settings
```

### Client/UI State

Gunakan:

```text
Zustand
```

Hanya untuk state yang memang bersifat client-side/global.

Contoh:

```text
Sidebar state
UI preferences
Temporary calculator state
```

Prinsip:

```text
Server State
→ TanStack Query

Client State
→ Zustand
```

---

## 7. Backend

### Technology

```text
Node.js 24 LTS
TypeScript
Fastify
```

Node.js 24 berada pada lini LTS per September 2026.

Backend menggunakan TypeScript dan ES Modules.

```text
import ...
export ...
```

bukan mencampur pola CommonJS dan ESM tanpa alasan khusus.

---

## 8. Backend Responsibility

Backend menjadi source of truth untuk:

```text
Authentication
Authorization
Business Rules
Calculation
Timeline
Pricing
Rush Detection
Quotation Generation
Database Access
```

---

## 9. API Style

Backend menggunakan:

```text
REST API
```

Contoh:

```text
GET    /api/features
POST   /api/features
GET    /api/features/:id
PATCH  /api/features/:id
DELETE /api/features/:id
```

Project:

```text
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
```

Calculation:

```text
POST /api/projects/:id/calculate
```

Quotation:

```text
POST /api/projects/:id/quotations
GET  /api/quotations
GET  /api/quotations/:id
```

---

## 10. Backend Architecture

Backend menggunakan modular architecture:

```text
src/
├── modules/
│   ├── auth/
│   ├── settings/
│   ├── features/
│   ├── designs/
│   ├── hosting/
│   ├── maintenance/
│   ├── projects/
│   ├── calculations/
│   └── quotations/
│
├── infrastructure/
│   ├── prisma/
│   ├── config/
│   └── http/
│
├── shared/
│   ├── errors/
│   ├── types/
│   └── utils/
│
├── app/
│
└── server.ts
```

---

## 11. Module Structure

Setiap module dapat menggunakan pola:

```text
features/
├── feature.routes.ts
├── feature.controller.ts
├── feature.service.ts
├── feature.repository.ts
├── feature.schema.ts
└── feature.types.ts
```

### Route

Mengatur endpoint.

### Controller

Mengatur:

```text
request
response
HTTP status
```

Controller tidak menjadi tempat business logic utama.

### Service

Berisi business logic.

### Repository

Berisi database access.

### Schema

Berisi validation request/response.

---

## 12. Database

### PostgreSQL

Database utama:

```text
PostgreSQL
```

Alasannya:

- relational
- foreign key
- transaction
- unique constraint
- indexing
- cocok untuk model project dan quotation
- cocok untuk historical snapshot

---

## 13. ORM

Gunakan:

```text
Prisma ORM 7
```

Prisma ORM 7 masih fully supported pada September 2026, sedangkan Prisma ORM 8 masih berstatus release candidate. Karena ini project baru yang ingin menekankan stabilitas, MVP menggunakan Prisma 7 dan versi package dikunci ke major version 7.

Prisma digunakan untuk:

```text
Schema
Migration
Type-safe database access
Transaction
Database tooling
```

---

## 14. Database Architecture

```text
Backend
   │
   ▼
Prisma
   │
   ▼
PostgreSQL
```

Business logic tidak melakukan query PostgreSQL secara langsung di controller.

---

## 15. Calculation Engine

Calculation Engine adalah bagian inti aplikasi.

```text
src/modules/calculations/
├── estimation.engine.ts
├── pricing.engine.ts
├── timeline.engine.ts
├── rush.engine.ts
└── calculation.service.ts
```

---

## 16. Estimation Engine

Flow:

```text
Project Features
        ↓
Selected Options
        ↓
User-defined estimation rules
        ↓
Estimated Hours
```

Contoh:

```text
Payment Gateway

Xendit       +10h
Subscription +8h
Refund       +4h
Webhook      +4h
----------------
Total        26h
```

Angka tersebut berasal dari konfigurasi user.

Aplikasi tidak mempunyai:

```text
"Xendit selalu 10 jam"
```

sebagai aturan universal.

---

## 17. Pricing Engine

Flow:

```text
Development Cost
+
Design Cost
+
Hosting Cost
+
Maintenance
        ↓
Subtotal
        ↓
Margin
        ↓
Rush Fee jika ada
        ↓
Final Price
```

Backend bertanggung jawab menghasilkan final value.

---

## 18. Timeline Engine

Timeline dihitung berdasarkan:

```text
Estimated Hours
Working Hours / Day
Buffer
Working Days
Holiday
Deadline
```

Contoh:

```text
Estimated Hours = 44

Buffer = 20%

Buffered Hours = 52.8

Working Hours / Day = 8

Working Days = 7
```

Perhitungan hari harus memperhatikan hari kerja dan tidak sekadar:

```text
hours / 8
```

---

## 19. Rush Detection

Backend membandingkan:

```text
Normal Estimated Completion Date
vs
Client Deadline
```

Jika deadline lebih cepat:

```text
isRush = true
```

Kemudian sistem dapat menghitung rush fee berdasarkan configuration user.

---

## 20. Quotation Generation

Flow final:

```text
Project
   ↓
Calculation Engine
   ↓
Calculated Result
   ↓
Snapshot Builder
   ↓
Quotation
```

Snapshot Builder menyimpan nilai yang digunakan pada saat quotation dibuat.

---

## 21. Quotation Immutability

Quotation dianggap sebagai historical record.

```text
Project
├── Quotation v1
├── Quotation v2
└── Quotation v3
```

Jika catalog berubah:

```text
Feature price
Design price
Hosting price
Developer rate
Margin
Buffer
Revision policy
```

quotation lama **tidak berubah**.

Jika client meminta perubahan:

```text
Quotation v1
      ↓
Project updated
      ↓
Recalculate
      ↓
Quotation v2
```

---

## 22. Authentication

MVP menggunakan:

```text
Email
Password
HTTP-only Cookie
```

Password disimpan sebagai hash.

Authentication state dikelola backend.

Frontend tidak menyimpan credential di:

```text
localStorage
sessionStorage
```

---

## 23. Authorization

MVP menggunakan model:

```text
User owns resources
```

Contoh:

```text
User A
├── Feature A
├── Project A
└── Quotation A

User B
├── Feature B
├── Project B
└── Quotation B
```

Setiap request harus memeriksa ownership.

Contoh:

```text
GET /api/projects/:id
```

Backend harus memastikan:

```text
project.userId === currentUser.id
```

---

## 24. Docker Strategy

Docker digunakan, tetapi **tidak semua service harus dijalankan di Docker pada development**.

Ini keputusan final.

### Development

```text
Frontend
→ Host machine

Backend
→ Host machine

PostgreSQL
→ Docker
```

Arsitektur:

```text
Browser
   │
   ▼
React + Vite :5173
   │
   ▼
Fastify :3000
   │
   ▼
PostgreSQL :5432
   │
   └── Docker
```

---

## 25. Kenapa Frontend Tidak Docker Saat Development?

React/Vite tidak membutuhkan container hanya untuk dapat berjalan.

Menjalankan frontend langsung di host membuat:

- HMR lebih sederhana
- filesystem watcher lebih sederhana
- debugging lebih mudah
- `node_modules` tidak perlu dikelola melalui volume container

Jadi Docker digunakan berdasarkan manfaat, bukan karena semua service harus dikontainerkan.

---

## 26. Kenapa PostgreSQL Menggunakan Docker?

Database merupakan bagian yang paling berguna untuk dibuat reproducible.

Developer lain cukup:

```bash
docker compose up -d
```

untuk mendapatkan PostgreSQL yang sesuai.

Tanpa harus:

```text
Install PostgreSQL
Create database
Create user
Configure port
Configure local database
```

---

## 27. Docker Compose

Docker Compose digunakan untuk menyediakan infrastructure development.

Contoh:

```text
estimator-api/
├── docker/
│   └── compose.yaml
├── prisma/
├── src/
├── Dockerfile
└── package.json
```

Compose minimal:

```yaml
services:
  postgres:
    image: postgres

volumes:
  postgres_data:
```

Docker Compose memang dirancang untuk mendefinisikan dan menjalankan multi-container application secara deklaratif melalui satu konfigurasi.

---

## 28. Production Docker Strategy

Production menggunakan container untuk application services.

```text
Frontend
→ Docker
→ Nginx/static server

Backend
→ Docker
→ Fastify

Database
→ Managed PostgreSQL
```

Untuk MVP, PostgreSQL production **tidak harus** dijalankan sebagai container sendiri.

Managed database lebih cocok karena persistence, backup, maintenance, dan operational concern tidak perlu ditangani langsung oleh application container.

---

## 29. Frontend Production

Build:

```bash
npm run build
```

menghasilkan:

```text
dist/
```

Production container dapat menyajikan static files tersebut menggunakan Nginx.

Flow:

```text
Browser
   ↓
Nginx
   ↓
React static files
```

---

## 30. Backend Production

Backend dibuat menjadi Docker image.

```text
Docker
└── Fastify
    └── Node.js
```

Environment production disediakan melalui environment variables.

---

## 31. Environment Management

Frontend:

```text
VITE_API_URL
```

Backend:

```text
DATABASE_URL
SESSION_SECRET
CORS_ORIGINS
PORT
```

Development menggunakan `.env`.

Repository hanya menyimpan:

```text
.env.example
```

Secret asli tidak masuk Git.

---

## 32. Development Workflow

Developer baru melakukan:

```bash
git clone estimator-web
git clone estimator-api
```

Backend:

```bash
npm install
docker compose up -d
npm run dev
```

Frontend:

```bash
npm install
npm run dev
```

Dengan begitu developer tidak perlu memasang PostgreSQL secara lokal.

---

## 33. API Contract

Karena FE dan BE berada pada repository berbeda, API contract harus diperlakukan sebagai kontrak antar-system.

Contoh:

```text
estimator-api
└── docs/
    └── API.md
```

MVP dapat menggunakan dokumentasi API manual.

Future version dapat menggunakan OpenAPI sebagai source of truth.

---

## 34. Security Principles

Minimum:

```text
Password
→ Hash

Authentication
→ HTTP-only Cookie

Request
→ Validation

API
→ Authentication Middleware

Resource
→ Ownership Validation

Database
→ ORM / Parameterized Queries

Secret
→ Environment Variables
```

---

## 35. Testing Strategy

### Unit Test

Fokus utama:

```text
Estimation Engine
Pricing Engine
Timeline Engine
Rush Detection
```

### Integration Test

Fokus:

```text
Authentication
API
Database
Quotation Generation
```

### E2E Test

Main workflow:

```text
Login
 ↓
Create Project
 ↓
Select Features
 ↓
Configure Features
 ↓
Calculate
 ↓
Generate Quotation
 ↓
Open Quotation History
```

---

## 36. Public Website / Branding

**Tidak termasuk MVP.**

Tidak ada Next.js pada MVP.

Future architecture dapat menjadi:

```text
example.com
└── Next.js
    ├── Landing Page
    ├── Pricing
    ├── Documentation
    └── SEO Content

app.example.com
└── React + Vite
    └── Estimator Application
```

Next.js hanya ditambahkan ketika public website memang menjadi requirement produk.

---

## 37. Client Project Output

Project ini **tidak bertugas membuat website client**.

Aplikasi hanya membantu:

```text
Client Requirements
        ↓
Project Estimation
        ↓
Pricing
        ↓
Timeline
        ↓
Quotation
```

Hasil website client merupakan project terpisah.

---

## 38. Final Repository Structure

### estimator-web

```text
estimator-web/
├── src/
│   ├── app/
│   ├── pages/
│   ├── components/
│   ├── features/
│   ├── lib/
│   ├── stores/
│   ├── types/
│   └── main.tsx
│
├── public/
├── Dockerfile
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### estimator-api

```text
estimator-api/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed/
│
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── settings/
│   │   ├── features/
│   │   ├── designs/
│   │   ├── hosting/
│   │   ├── maintenance/
│   │   ├── projects/
│   │   ├── calculations/
│   │   └── quotations/
│   │
│   ├── infrastructure/
│   ├── shared/
│   ├── app/
│   └── server.ts
│
├── docker/
│   └── compose.yaml
│
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

---

## 39. Final Stack

```text
Frontend
├── React
├── TypeScript
├── Vite
├── React Router
├── TanStack Query
├── Zustand
└── Tailwind CSS

Backend
├── Node.js 24 LTS
├── TypeScript
└── Fastify

Database
└── PostgreSQL

ORM
└── Prisma ORM 7

Architecture
└── Modular Monolith

Repository
├── estimator-web
└── estimator-api

API
└── REST

Development Infrastructure
└── Docker Compose

Development Docker
└── PostgreSQL

Production Docker
├── Frontend
└── Backend

Production Database
└── Managed PostgreSQL

Authentication
└── HTTP-only Cookie
```

---

## 40. Final Architecture

```text
                         ┌─────────────────────┐
                         │     User Browser    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   estimator-web     │
                         │   React + Vite      │
                         └──────────┬──────────┘
                                    │
                                REST API
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   estimator-api     │
                         │ Fastify + TypeScript│
                         └──────────┬──────────┘
                                    │
               ┌────────────────────┼─────────────────────┐
               │                    │                     │
               ▼                    ▼                     ▼
        Authentication       Business Logic       Calculation Engine
                                                           │
                              ┌────────────────────────────┤
                              │                            │
                              ▼                            ▼
                      Estimation Engine              Pricing Engine
                                                           │
                              ┌────────────────────────────┤
                              │                            │
                              ▼                            ▼
                      Timeline Engine                Rush Engine
                                                           │
                                                           ▼
                                                     Quotation
                                                           │
                                                           ▼
                                                      Prisma
                                                           │
                                                           ▼
                                                ┌─────────────────┐
                                                │   PostgreSQL    │
                                                └─────────────────┘
```

### Final Architecture Decision

MVP **tidak menggunakan Next.js**.

MVP menggunakan **React + Vite untuk frontend**, **Fastify untuk backend**, **PostgreSQL + Prisma 7 untuk database**, **dua repository terpisah**, dan **Docker hanya untuk infrastructure yang memang membutuhkan container pada development**, terutama PostgreSQL.

Website branding/public menggunakan Next.js adalah **future scope**, bukan bagian dari MVP.
