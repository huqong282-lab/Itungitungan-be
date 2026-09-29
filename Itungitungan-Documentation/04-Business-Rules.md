# Business Rules v2

## Itungitungan — Configurable Project Estimation & Quotation System

---

## 1. Purpose

Dokumen ini mendefinisikan aturan bisnis yang harus dipatuhi oleh aplikasi.

PRD menjelaskan **apa yang ingin dibuat**.

Business Rules menjelaskan **bagaimana sistem harus berperilaku**.

Business Rules menjadi referensi bagi:

- Backend
- Frontend
- Database
- Calculation Engine
- API
- Testing

---

## 2. User & Data Ownership

### BR-001 — Data Isolated Per User

Setiap user memiliki data dan catalog masing-masing.

```text
User A
├── Features
├── Designs
├── Hosting Plans
├── Maintenance Plans
├── Projects
└── Quotations

User B
├── Features
├── Designs
├── Hosting Plans
├── Maintenance Plans
├── Projects
└── Quotations
```

User A tidak boleh:

- melihat data User B
- mengubah data User B
- menghapus data User B
- menggunakan catalog milik User B

Backend wajib melakukan ownership validation.

---

## 3. Developer Settings

### BR-002 — One Settings Per User

Setiap user hanya memiliki satu `DeveloperSettings`.

```text
User 1 ─── 1 DeveloperSettings
```

### BR-003 — Developer Rate

Developer rate merupakan tarif dasar per jam milik user.

```text
Development Cost
=
Development Hours × Developer Rate
```

`developerRate` harus lebih besar atau sama dengan `0`.

### BR-004 — Working Hours

`workingHoursPerDay` menentukan jumlah jam kerja per hari.

Default:

```text
8 jam
```

Nilai harus lebih besar dari `0`.

---

## 4. Catalog Rules

Catalog terdiri dari:

```text
Feature
FeatureOption
FeatureOptionValue
Design
HostingPlan
MaintenancePlan
```

### BR-005 — Catalog Belongs to User

Semua catalog harus memiliki owner berupa user.

### BR-006 — Catalog Can Be Modified

User dapat melakukan CRUD terhadap catalog miliknya selama aturan lain tidak melarang operasi tersebut.

### BR-007 — Catalog Soft Delete

Catalog yang telah digunakan tidak boleh dihapus secara permanen.

Gunakan:

```text
isActive = false
```

Setelah inactive:

- tidak muncul sebagai pilihan baru
- tetap tersedia untuk histori
- tidak memutus hubungan data lama

---

## 5. Feature Rules

### BR-008 — Feature Belongs to User

Feature hanya dapat digunakan oleh owner-nya.

### BR-009 — Feature May Be Simple

Feature dapat memiliki hanya:

```text
baseEstimatedHours
```

Contoh:

```text
Static Page
4 jam
```

### BR-010 — Feature May Have Options

Feature dapat memiliki:

```text
FeatureOption
    ↓
FeatureOptionValue
```

Contoh:

```text
Payment Gateway
├── Provider
├── Payment Type
├── Refund
└── Webhook
```

### BR-011 — User Defines Estimation

Sistem tidak menentukan estimasi universal.

Estimasi berasal dari konfigurasi user.

Contoh:

```text
Xendit = 10 jam
Stripe = 12 jam
```

User lain dapat menggunakan nilai yang berbeda.

### BR-012 — Feature Option Selection Type

Setiap option memiliki:

```text
SINGLE
MULTIPLE
```

**SINGLE** — Hanya boleh memilih satu value.

**MULTIPLE** — Boleh memilih beberapa value.

Aturan ini divalidasi pada service layer.

---

## 6. Project Feature Rules

### BR-013 — Feature Can Be Added to Project

User dapat memilih feature aktif dari catalog miliknya.

### BR-014 — Same Feature Cannot Be Added Twice

Satu project tidak boleh memiliki feature yang sama lebih dari satu kali.

### BR-015 — Project Override

User dapat mengganti estimasi feature pada project tertentu.

Contoh:

```text
Catalog
Payment Gateway = 24 jam

Project A
Payment Gateway = 16 jam
```

Override hanya berlaku untuk project tersebut.

Catalog tetap:

```text
24 jam
```

### BR-016 — Removing Project Feature

Menghapus feature dari project hanya menghapus hubungan `ProjectFeature`.

Catalog tidak ikut terhapus.

---

## 7. Design Rules

### BR-017 — Maximum One Design

Satu project dapat memiliki:

```text
0 atau 1 Design
```

---

## 8. Hosting Rules

### BR-018 — Multiple Hosting Allowed

Satu project dapat memiliki banyak hosting.

Contoh:

```text
Project A
├── Production
└── Staging
```

### BR-019 — Hosting Label

Setiap hosting dalam project harus memiliki label.

Contoh:

```text
Production
Staging
Development
```

### BR-020 — Client Provided Hosting

Client dapat menyediakan hosting sendiri.

Jika:

```text
clientProvided = true
```

maka hosting plan internal tidak wajib dipilih.

### BR-021 — Internal Hosting Cost

`internalCost` hanya digunakan untuk perhitungan internal.

Informasi tersebut tidak wajib muncul pada quotation client.

---

## 9. Maintenance Rules

### BR-022 — Multiple Maintenance Allowed

Satu project dapat memiliki lebih dari satu maintenance plan.

### BR-023 — Maintenance Is Separate

Maintenance tidak dihitung sebagai development cost.

Maintenance ditampilkan sebagai biaya terpisah.

---

## 10. Estimation Rules

### BR-024 — Hours Are Integer

Estimasi waktu menggunakan jam bulat.

Valid:

```text
4
8
16
24
```

MVP tidak menggunakan pecahan jam.

### BR-025 — Estimated Hours Cannot Be Negative

Semua nilai:

```text
baseEstimatedHours
estimatedHours
overrideHours
hoursSnapshot
```

harus:

```text
>= 0
```

### BR-026 — Base + Option Estimation

Untuk feature kompleks:

```text
Total Feature Hours
=
Base Hours
+
Selected Option Hours
```

Contoh:

```text
Base = 0

Xendit       = 10
Subscription = 8
Refund       = 4
Webhook      = 4

Total = 26 jam
```

Jika project memiliki `overrideHours`, nilai tersebut digunakan sebagai estimasi feature pada project tersebut.

---

## 11. Buffer Rules

### BR-027 — Buffer Is Configurable

User menentukan buffer sendiri.

Contoh:

```text
20%
```

### BR-028 — Buffer Range

Buffer berada pada:

```text
0% – 100%
```

### BR-029 — Buffered Hours Must Be Integer

Buffered hours selalu dibulatkan ke atas menjadi jam bulat.

Rumus:

```text
Buffered Hours
=
CEIL(
  Estimated Hours × (1 + Buffer / 100)
)
```

Contoh:

```text
Estimated Hours
44h

Buffer
20%

44 × 1.20
= 52.8

CEIL
= 53h
```

Maka hasil akhir:

```text
Buffered Hours = 53h
```

### BR-030 — Timeline Uses Buffered Hours

Working days dihitung menggunakan buffered hours.

```text
Working Days
=
CEIL(
  Buffered Hours / Working Hours Per Day
)
```

Contoh:

```text
Buffered Hours = 53h
Working Hours / Day = 8h

53 / 8
= 6.625

CEIL
= 7 hari kerja
```

---

## 12. Timeline Rules

### BR-031 — Working Hours Per Day

Timeline menggunakan:

```text
workingHoursPerDay
```

Default:

```text
8 jam
```

### BR-032 — Holiday

Holiday calendar belum termasuk MVP.

Untuk MVP, timeline menggunakan konfigurasi jam kerja dan perhitungan hari kerja dasar.

---

## 13. Deadline Rules

### BR-033 — Client Deadline Is Optional

Project dapat memiliki deadline atau tidak.

### BR-034 — Rush Detection

Jika deadline client lebih cepat daripada estimasi normal, project dianggap:

```text
Rush Project
```

### BR-035 — Rush Fee

Rush fee menggunakan konfigurasi user.

Contoh:

```text
Rush Fee = 30%
```

Rush fee hanya diterapkan jika project memenuhi kondisi rush.

---

## 14. Margin Rules

### BR-036 — One Project Margin

Margin menggunakan satu persentase untuk seluruh project.

### BR-037 — Margin Range

Margin berada pada:

```text
0% – 100%
```

### BR-038 — Margin Calculation

```text
Margin Amount
=
Subtotal × Margin Percentage / 100
```

Contoh:

```text
Subtotal = Rp5.000.000
Margin = 30%

Margin Amount = Rp1.500.000

Final = Rp6.500.000
```

---

## 15. Money Rules

### BR-039 — Money Stored as Integer

Semua nominal uang disimpan sebagai integer dalam unit mata uang.

Untuk IDR:

```text
Rp75.000
=
75000
```

### BR-040 — Money Cannot Be Negative

Nominal seperti:

```text
developerRate
price
internalCost
clientPrice
additionalRevisionPrice
```

tidak boleh negatif.

---

## 16. Quotation Rules

### BR-041 — Multiple Quotations Per Project

Satu project dapat memiliki banyak quotation.

```text
Project A
├── Quotation v1
├── Quotation v2
└── Quotation v3
```

### BR-042 — Unique Version

Version hanya unik dalam project tersebut.

```text
Project A + v1 ✅
Project A + v1 ❌
Project A + v2 ✅
Project B + v1 ✅
```

### BR-043 — Quotation Number Unique

Setiap quotation memiliki nomor unik.

### BR-044 — Quotation Draft

Quotation baru dibuat dengan:

```text
status = DRAFT
```

DRAFT dapat:

- diedit
- dihitung ulang
- diperbarui
- disesuaikan sebelum finalisasi

### BR-045 — Quotation Final

Quotation dapat difinalisasi:

```text
DRAFT → FINAL
```

Setelah FINAL:

- tidak dapat diedit
- tidak dapat dihitung ulang
- snapshot tidak boleh diubah

Aturan ini ditangani oleh service layer.

### BR-046 — New Version After Final

Jika client meminta perubahan setelah quotation FINAL:

```text
Quotation v1 FINAL
        ↓
Project berubah
        ↓
Generate v2
        ↓
Quotation v2 DRAFT
```

Quotation v1 tetap tidak berubah.

---

## 17. Snapshot Rules

### BR-047 — Quotation Is Historical Snapshot

Quotation menyimpan nilai yang digunakan ketika quotation dibuat.

Snapshot meliputi:

```text
Client
Project
Developer Rate
Working Hours
Feature
Feature Option
Design
Hosting
Maintenance
Buffer
Margin
Rush Fee
Revision Policy
```

### BR-048 — Catalog Changes Do Not Affect Quotation

Jika user mengubah:

```text
Feature
Design
Hosting
Developer Rate
Margin
Buffer
```

quotation lama tidak berubah.

---

## 18. Revision Rules

### BR-049 — Free Revision Count

Jumlah revisi gratis berasal dari DeveloperSettings saat quotation dibuat.

Default:

```text
2
```

### BR-050 — Additional Revision Price

Revisi setelah batas gratis dikenakan:

```text
additionalRevisionPrice
```

Nilainya berasal dari konfigurasi user dan disimpan pada snapshot quotation.

---

## 19. Authentication Rules

### BR-051 — Session Based Authentication

User yang login memiliki session.

Session menggunakan HTTP-only cookie.

### BR-052 — Session Expiration

Session memiliki:

```text
expiresAt
```

Session expired tidak boleh digunakan.

### BR-053 — Session Token Security

Database tidak menyimpan raw session token.

Database hanya menyimpan:

```text
tokenHash
```

---

## 20. Authorization Rules

### BR-054 — Authentication Is Not Enough

User harus login dan memiliki ownership terhadap resource.

Contoh:

```text
GET /projects/project-A
```

Backend juga harus memastikan:

```text
project.userId === currentUser.id
```

### BR-055 — Nested Resource Ownership

Jika resource tidak memiliki `userId` langsung, ownership ditelusuri melalui parent.

Contoh:

```text
Quotation
 ↓
Project
 ↓
User
```

---

## 21. Data Deletion Rules

### BR-056 — Catalog Soft Delete

Catalog yang memiliki dependensi tidak boleh hard delete.

Gunakan:

```text
isActive = false
```

### BR-057 — Project Feature Removal

Menghapus feature dari project tidak menghapus catalog feature.

### BR-058 — Quotation History

Quotation FINAL tidak boleh diedit dan tidak boleh diubah sebagai historical record.

---

## 22. Integrity Responsibility

### Database Responsibility

Database menangani:

```text
Primary Key
Foreign Key
Unique Constraint
Index
Referential Integrity
Basic Check Constraint
```

### Service Layer Responsibility

Service menangani:

```text
Ownership
Quotation Lifecycle
SINGLE / MULTIPLE
Calculation
Rush Detection
Margin
Buffer
Project Rules
Authorization
```

---

## 23. Calculation Source of Truth

Backend merupakan source of truth untuk perhitungan.

Frontend:

```text
mengirim configuration
```

Backend:

```text
menghitung hasil
```

Frontend:

```text
menampilkan hasil
```

Frontend tidak boleh menentukan final price secara independen dari backend.

---

## 24. Default Catalog Rules

Default catalog disediakan saat user pertama kali dibuat.

Contoh:

```text
Authentication
Dashboard
CRUD
Payment Gateway
Notification
Search
```

Default catalog bukan global shared data.

Data tersebut dibuat sebagai milik user.

```text
User A
└── Default Features A

User B
└── Default Features B
```

User bebas mengubah catalog miliknya.

---

## 25. Rule Priority

Jika terdapat konflik antara sumber konfigurasi:

```text
Project Override
        ↓
Feature Configuration
        ↓
Default Configuration
```

Project-specific configuration memiliki prioritas tertinggi.

---

## 26. Business Rule Principle

Sistem tidak menentukan:

> "Harga yang benar adalah X."

Sistem menentukan:

> "Berdasarkan konfigurasi dan aturan yang dibuat user, hasil perhitungannya adalah X."

Keputusan pricing tetap berada pada user.

---

## 27. Rule Summary

```text
USER
├── Data isolated
├── Own catalog
└── Own projects

CATALOG
├── Configurable
├── Soft delete
└── User-defined estimation

PROJECT
├── Feature: 0..N
├── Design: 0..1
├── Hosting: 0..N
└── Maintenance: 0..N

CALCULATION
├── Estimation Hours → Integer
├── Buffer → 0–100%
├── Buffered Hours → CEIL → Integer
├── Working Days → CEIL → Integer
├── Deadline
├── Rush
├── Margin
└── Final Price

QUOTATION
├── Multiple per project
├── DRAFT → editable
├── FINAL → immutable
└── Historical snapshot
```

---

## 28. Source of Truth

```text
PRD
 ↓
Business Rules
 ↓
ERD
 ↓
Architecture
 ↓
API Contract
 ↓
Implementation
```

Jika implementation bertentangan dengan Business Rules, implementation harus diperbaiki.
