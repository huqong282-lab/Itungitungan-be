# ERD v2 Final

## Itungitungan — Configurable Project Estimation & Quotation System

---

## 1. Prinsip Utama

Database dibagi menjadi tiga lapisan:

```text
CONFIGURATION / CATALOG
        ↓
      PROJECT
        ↓
    CALCULATION
        ↓
     QUOTATION
        ↓
HISTORICAL SNAPSHOT
```

### Configuration / Catalog

Data yang dikonfigurasi dan dimiliki oleh masing-masing user:

```text
DeveloperSettings
Feature
FeatureOption
FeatureOptionValue
Design
HostingPlan
MaintenancePlan
```

### Project

Data kebutuhan project saat ini:

```text
Project
ProjectFeature
ProjectFeatureSelection
ProjectDesign
ProjectHosting
ProjectMaintenance
```

### Quotation

Data hasil perhitungan yang menjadi histori:

```text
Quotation
QuotationFeature
QuotationFeatureSelection
QuotationDesign
QuotationHosting
QuotationMaintenance
```

---

## 2. Aturan Ownership

Setiap data catalog dan project adalah milik user tertentu.

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

User A tidak dapat membaca atau memodifikasi data milik User B.

Semua query resource harus dibatasi berdasarkan `userId` atau ownership melalui parent resource.

---

## 3. ERD Keseluruhan

```text
                                ┌──────────────┐
                                │     User     │
                                └──────┬───────┘
                                       │
       ┌───────────────┬───────────────┼───────────────┬───────────────┐
       │               │               │               │               │
       ▼               ▼               ▼               ▼               ▼
┌──────────────┐ ┌───────────┐ ┌──────────┐ ┌─────────────┐ ┌───────────────┐
│ Developer    │ │  Session  │ │ Feature  │ │   Design    │ │ HostingPlan   │
│ Settings     │ └───────────┘ └────┬─────┘ └─────────────┘ └───────────────┘
└──────────────┘                     │
                                     ▼
                              ┌───────────────┐
                              │ FeatureOption │
                              └───────┬───────┘
                                      │
                                      ▼
                              ┌───────────────────┐
                              │FeatureOptionValue │
                              └───────────────────┘

       User
        │
        ▼
┌─────────────────────┐
│ MaintenancePlan     │
└─────────────────────┘

       User
        │
        ▼
┌──────────────┐
│    Project   │
└──────┬───────┘
       │
   ┌───┼─────────────────────────────┐
   │   │             │              │
   ▼   ▼             ▼              ▼
┌────────────┐ ┌─────────────┐ ┌──────────────┐ ┌───────────────────┐
│Project     │ │ProjectDesign│ │ProjectHosting│ │ProjectMaintenance │
│Feature     │ └─────────────┘ └──────────────┘ └───────────────────┘
└─────┬──────┘
      │
      ▼
┌────────────────────────────┐
│ProjectFeatureSelection     │
└────────────────────────────┘

       Project
          │
          ▼
    ┌─────────────┐
    │  Quotation  │
    └──────┬──────┘
           │
     ┌─────┼────────────────────────────┐
     │     │             │              │
     ▼     ▼             ▼              ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│Quotation      │ │QuotationDesign│ │QuotationHosting│
│Feature        │ └───────────────┘ └───────────────┘
└──────┬────────┘
       │
       ▼
┌───────────────────────────────┐
│QuotationFeatureSelection      │
└───────────────────────────────┘

                         ┌──────────────────────┐
                         │QuotationMaintenance  │
                         └──────────────────────┘
```

---

## 4. User

Pemilik seluruh data aplikasi.

```text
User
-------------------------
id                  PK
email               UNIQUE
passwordHash
name
createdAt
updatedAt
```

Relasi:

```text
User 1 ─── 1 DeveloperSettings
User 1 ─── N Session
User 1 ─── N Feature
User 1 ─── N Design
User 1 ─── N HostingPlan
User 1 ─── N MaintenancePlan
User 1 ─── N Project
```

---

## 5. DeveloperSettings

Konfigurasi pricing dan estimation milik user.

```text
DeveloperSettings
-------------------------
id                          PK
userId                      FK UNIQUE

developerRate              Int
workingHoursPerDay         Int

bufferPercentage           Decimal
defaultMarginPercentage    Decimal
defaultRushPercentage      Decimal

freeRevisionCount          Int
additionalRevisionPrice    Int

currency

createdAt
updatedAt
```

Contoh:

```text
developerRate = 75000
workingHoursPerDay = 8

bufferPercentage = 20
defaultMarginPercentage = 30
defaultRushPercentage = 30

freeRevisionCount = 2
additionalRevisionPrice = 200000

currency = IDR
```

---

## 6. Session

Digunakan untuk authentication berbasis session.

```text
Session
-------------------------
id                  PK
userId              FK

tokenHash           UNIQUE
expiresAt
createdAt
```

Relasi:

```text
User 1 ─── N Session
```

Session dipakai bersama HTTP-only cookie. Raw session token tidak pernah disimpan; hanya `tokenHash` yang disimpan di database (lihat Business Rules BR-053).

---

## 7. Feature

Catalog fitur milik user.

```text
Feature
-------------------------
id                  PK
userId              FK

name
description
category

baseEstimatedHours  Int

isActive             Boolean

createdAt
updatedAt
```

`baseEstimatedHours` digunakan untuk feature sederhana.

Contoh:

```text
Static Page
4 jam
```

Feature kompleks dapat menggunakan:

```text
baseEstimatedHours
+
selected FeatureOptionValue
```

Relasi:

```text
User 1 ─── N Feature
Feature 1 ─── N FeatureOption
Feature 1 ─── N ProjectFeature
```

---

## 8. FeatureOption

Kelompok pilihan dalam sebuah feature.

```text
FeatureOption
-------------------------
id                  PK
featureId           FK

name
selectionType

createdAt
updatedAt
```

`selectionType`:

```text
SINGLE
MULTIPLE
```

Contoh:

```text
Payment Gateway
├── Provider
├── Payment Type
├── Refund
└── Webhook
```

---

## 9. FeatureOptionValue

Nilai dari sebuah option.

```text
FeatureOptionValue
-------------------------
id                  PK
featureOptionId     FK

label
estimatedHours      Int

isDefault           Boolean
isActive             Boolean

createdAt
updatedAt
```

Contoh:

```text
Provider

Midtrans  → 8 jam
Xendit    → 10 jam
Stripe    → 12 jam
Custom    → 20 jam
```

Dan:

```text
Refund

No  → 0 jam
Yes → 4 jam
```

---

## 10. Design

Catalog desain.

```text
Design
-------------------------
id                  PK
userId              FK

name
description
price               Int

isActive             Boolean

createdAt
updatedAt
```

Contoh:

```text
Template     → Rp500.000
Premium UI   → Rp1.500.000
```

Satu project hanya memilih maksimal satu design.

---

## 11. HostingPlan

Catalog hosting/server.

```text
HostingPlan
-------------------------
id                  PK
userId              FK

provider
name

internalCost        Int
clientPrice         Int

billingPeriod

isActive             Boolean

createdAt
updatedAt
```

Contoh:

```text
Provider: Railway
Plan: Hobby

Internal Cost: Rp150.000
Client Price: Rp200.000

Billing: MONTHLY
```

`internalCost` bersifat internal dan tidak harus ditampilkan kepada client.

Satu project dapat menggunakan lebih dari satu hosting plan.

---

## 12. MaintenancePlan

Catalog maintenance.

```text
MaintenancePlan
-------------------------
id                  PK
userId              FK

name
price               Int

billingPeriod

isActive             Boolean

createdAt
updatedAt
```

Satu project dapat memilih lebih dari satu maintenance plan.

Contoh:

```text
Website Maintenance
Rp500.000 / month

Server Monitoring
Rp200.000 / month
```

---

## 13. Project

Project yang sedang dihitung.

```text
Project
-------------------------
id                  PK
userId              FK

clientName
projectName
logoUrl

deadline
status

createdAt
updatedAt
```

Status:

```text
DRAFT
QUOTED
ACCEPTED
REJECTED
```

Relasi:

```text
User 1 ─── N Project

Project 1 ─── N ProjectFeature
Project 1 ─── 0..1 ProjectDesign
Project 1 ─── N ProjectHosting
Project 1 ─── N ProjectMaintenance
Project 1 ─── N Quotation
```

---

## 14. ProjectFeature

Feature yang digunakan dalam project.

```text
ProjectFeature
-------------------------
id                  PK

projectId           FK
featureId           FK

overrideHours       Int?

notes

createdAt
updatedAt
```

Contoh:

```text
Catalog:
Payment Gateway = 24 jam

Project:
overrideHours = 16 jam
```

Jika `overrideHours = NULL`, gunakan hasil estimation rule.

Constraint:

```text
@@unique([projectId, featureId])
```

Satu project tidak boleh memiliki feature yang sama lebih dari satu kali (lihat Business Rules BR-014).

Relasi:

```text
Project 1 ─── N ProjectFeature
Feature 1 ─── N ProjectFeature
```

---

## 15. ProjectFeatureSelection

Pilihan option/value yang digunakan project.

```text
ProjectFeatureSelection
-------------------------
id                      PK

projectFeatureId        FK

featureOptionId         FK
featureOptionValueId    FK

createdAt
updatedAt
```

Contoh:

```text
Payment Gateway

Provider      → Xendit
Payment Type  → Subscription
Refund        → Yes
Webhook       → Yes
```

Catatan:

Database menjamin foreign key valid, tetapi aturan seperti:

```text
selectionType = SINGLE
→ hanya boleh satu selection
```

divalidasi oleh business logic/service layer.

---

## 16. ProjectDesign

Design yang dipilih project.

```text
ProjectDesign
-------------------------
id                  PK
projectId           FK UNIQUE

designId            FK

createdAt
updatedAt
```

Relasi:

```text
Project 1 ─── 0..1 ProjectDesign
Design 1 ─── N ProjectDesign
```

Project dapat tidak menggunakan design catalog atau menggunakan satu design.

---

## 17. ProjectHosting

Hosting yang digunakan project.

```text
ProjectHosting
-------------------------
id                  PK
projectId           FK

label
hostingPlanId       FK

clientProvided      Boolean

createdAt
updatedAt
```

`label` wajib diisi (lihat Business Rules BR-019), digunakan untuk membedakan beberapa hosting dalam satu project.

Contoh:

```text
Production
Staging
```

Relasi:

```text
Project 1 ─── N ProjectHosting
HostingPlan 1 ─── N ProjectHosting
```

Contoh:

```text
Project A

Production
→ VPS

Staging
→ Railway
```

`clientProvided = true` digunakan ketika client menyediakan infrastructure sendiri.

---

## 18. ProjectMaintenance

Maintenance yang dipilih project.

```text
ProjectMaintenance
-------------------------
id                  PK
projectId           FK

maintenancePlanId   FK

createdAt
updatedAt
```

Constraint:

```text
@@unique([projectId, maintenancePlanId])
```

Plan yang sama tidak dapat ditambahkan dua kali pada project yang sama (lihat Business Rules BR-022 dan API Contract PROJECT-MAINTENANCE-001).

Relasi:

```text
Project 1 ─── N ProjectMaintenance
MaintenancePlan 1 ─── N ProjectMaintenance
```

Contoh:

```text
Website Maintenance
Server Monitoring
```

---

## 19. Quotation

Hasil perhitungan project.

Quotation memiliki lifecycle.

```text
DRAFT
  ↓
FINAL
```

### DRAFT

Masih dapat diedit dan dihitung ulang.

### FINAL

Sudah dikunci dan dianggap sebagai historical record.

```text
Quotation
-------------------------
id                              PK

projectId                       FK

quotationNumber                 UNIQUE
version

status
finalizedAt

clientNameSnapshot
projectNameSnapshot
logoUrlSnapshot
deadlineSnapshot

developerRateSnapshot          Int
workingHoursPerDaySnapshot     Int

developmentHours               Int

bufferPercentage               Decimal
bufferedHours                  Int
workingDays                    Int

developmentCost                Int
designCost                     Int
hostingCost                    Int
maintenanceCost                Int

subtotal                       Int

marginPercentage               Decimal
marginAmount                   Int

rushFeePercentage              Decimal
rushFeeAmount                  Int

freeRevisionCount              Int
additionalRevisionPrice        Int

finalPrice                     Int

createdAt
```

Enum:

```text
DRAFT
FINAL
```

Constraint:

```text
(projectId, version) UNIQUE
```

Relasi:

```text
Project 1 ─── N Quotation
```

---

## 20. QuotationFeature

Snapshot feature ketika quotation dibuat.

```text
QuotationFeature
-------------------------
id                      PK

quotationId             FK

featureNameSnapshot
baseHoursSnapshot       Int
estimatedHours          Int

developerRateSnapshot   Int
developmentCost         Int

createdAt
```

Relasi:

```text
Quotation 1 ─── N QuotationFeature
```

---

## 21. QuotationFeatureSelection

Snapshot option/value ketika quotation dibuat.

```text
QuotationFeatureSelection
-------------------------
id                      PK

quotationFeatureId      FK

optionNameSnapshot
valueLabelSnapshot

hoursSnapshot           Int

createdAt
```

Contoh:

```text
Provider
Xendit
10 jam

Payment Type
Subscription
8 jam

Refund
Yes
4 jam

Webhook
Yes
4 jam
```

Setelah snapshot dibuat, data ini tidak membutuhkan catalog aktif untuk membaca histori.

---

## 22. QuotationDesign

Snapshot design.

```text
QuotationDesign
-------------------------
id                  PK

quotationId         FK UNIQUE

nameSnapshot
priceSnapshot       Int

createdAt
```

Relasi:

```text
Quotation 1 ─── 0..1 QuotationDesign
```

---

## 23. QuotationHosting

Snapshot semua hosting yang digunakan quotation.

```text
QuotationHosting
-------------------------
id                      PK

quotationId             FK

providerSnapshot
planSnapshot

internalCostSnapshot    Int
clientPriceSnapshot     Int

clientProvided

billingPeriodSnapshot

createdAt
```

Relasi:

```text
Quotation 1 ─── N QuotationHosting
```

Jika project memiliki:

```text
Production
Staging
```

keduanya dapat masuk sebagai snapshot terpisah.

---

## 24. QuotationMaintenance

Snapshot maintenance yang digunakan quotation.

```text
QuotationMaintenance
-------------------------
id                      PK

quotationId             FK

nameSnapshot
priceSnapshot           Int

billingPeriodSnapshot

createdAt
```

Relasi:

```text
Quotation 1 ─── N QuotationMaintenance
```

---

## 25. Cardinality Final

```text
User
│
├── 1 : 1 ── DeveloperSettings
├── 1 : N ── Session
├── 1 : N ── Feature
│              └── 1 : N ── FeatureOption
│                               └── 1 : N ── FeatureOptionValue
│
├── 1 : N ── Design
├── 1 : N ── HostingPlan
├── 1 : N ── MaintenancePlan
│
└── 1 : N ── Project
               │
               ├── 1 : N ── ProjectFeature
               │              └── 1 : N ── ProjectFeatureSelection
               │
               ├── 1 : 0..1 ── ProjectDesign
               │
               ├── 1 : N ── ProjectHosting
               │
               ├── 1 : N ── ProjectMaintenance
               │
               └── 1 : N ── Quotation
                              │
                              ├── 1 : N ── QuotationFeature
                              │              └── 1 : N ── QuotationFeatureSelection
                              │
                              ├── 1 : 0..1 ── QuotationDesign
                              │
                              ├── 1 : N ── QuotationHosting
                              │
                              └── 1 : N ── QuotationMaintenance
```

---

## 26. Database Integrity Rules

### User Isolation

Semua owned resource harus berada di bawah user yang sesuai.

Backend tidak boleh hanya memeriksa:

```text
resource.id
```

tetapi juga ownership:

```text
resource.userId = currentUser.id
```

---

### Catalog Soft Delete

Catalog yang sudah pernah digunakan tidak boleh hard delete.

Gunakan:

```text
isActive = false
```

untuk:

```text
Feature
FeatureOptionValue
Design
HostingPlan
MaintenancePlan
```

Data yang sudah pernah digunakan tetap tersedia untuk histori.

---

### Cascade Rules

Relation parent-child yang sepenuhnya bergantung pada parent dapat menggunakan cascade.

Contoh:

```text
Feature
  ↓
FeatureOption
  ↓
FeatureOptionValue
```

Jika Feature benar-benar dihapus pada kondisi yang diperbolehkan, child dapat ikut dihapus.

Sedangkan catalog yang sudah memiliki dependensi project sebaiknya tidak dihapus dan hanya di-deactivate.

---

### Project Feature Removal

User dapat menghapus feature dari satu project tanpa menghapus feature dari catalog.

```text
Catalog
Payment Gateway

Project A
Payment Gateway
      ↓
Remove
      ↓
Hanya ProjectFeature yang dihapus
```

Catalog tetap ada.

---

### SINGLE / MULTIPLE Validation

Database menjaga foreign key.

Business service menjaga:

```text
SINGLE
→ maksimal satu selected value

MULTIPLE
→ boleh lebih dari satu
```

---

### Quotation Status Integrity

```text
DRAFT
→ boleh edit

FINAL
→ immutable
```

Backend harus menolak mutation terhadap quotation `FINAL`.

---

### Quotation Version Integrity

Setiap project tidak boleh memiliki version yang sama:

```text
@@unique([projectId, version])
```

Contoh:

```text
Project A + version 1 ✅
Project A + version 2 ✅
Project A + version 1 ❌
```

---

### Snapshot Integrity

Quotation tidak boleh bergantung pada nilai catalog terkini untuk membaca histori.

Semua nilai penting sudah disalin ke:

```text
QuotationFeature
QuotationFeatureSelection
QuotationDesign
QuotationHosting
QuotationMaintenance
```

---

## 27. Index Strategy

Index dibuat berdasarkan query yang kemungkinan sering dilakukan.

Tidak semua field perlu diberi index.

### User

```text
User.email
```

Sudah memiliki unique constraint:

```text
email UNIQUE
```

yang juga menghasilkan unique index pada database.

---

### DeveloperSettings

```text
userId UNIQUE
```

Karena satu user hanya memiliki satu settings.

---

### Session

```text
@@index([userId])
@@index([expiresAt])
```

Untuk:

```text
ambil session user
bersihkan session expired
```

---

### Feature

```text
@@index([userId])
@@index([userId, isActive])
```

Untuk:

```text
GET semua feature milik user
GET active feature milik user
```

---

### FeatureOption

```text
@@index([featureId])
```

---

### FeatureOptionValue

```text
@@index([featureOptionId])
@@index([featureOptionId, isActive])
```

---

### Design

```text
@@index([userId])
@@index([userId, isActive])
```

---

### HostingPlan

```text
@@index([userId])
@@index([userId, isActive])
```

---

### MaintenancePlan

```text
@@index([userId])
@@index([userId, isActive])
```

---

### Project

```text
@@index([userId])
@@index([userId, status])
@@index([userId, createdAt])
```

Untuk:

```text
GET project user
filter by status
sort/list berdasarkan waktu
```

---

### ProjectFeature

```text
@@unique([projectId, featureId])
@@index([projectId])
@@index([featureId])
```

`@@unique([projectId, featureId])` juga berfungsi sebagai index, sehingga mencegah feature yang sama ditambahkan dua kali ke project yang sama pada level database, sejalan dengan BR-014.

---

### ProjectFeatureSelection

```text
@@index([projectFeatureId])
@@index([featureOptionId])
@@index([featureOptionValueId])
```

---

### ProjectDesign

`projectId` sudah unique:

```text
projectId UNIQUE
```

sehingga tidak memerlukan index terpisah untuk kebutuhan lookup yang sama.

---

### ProjectHosting

```text
@@index([projectId])
@@index([hostingPlanId])
```

---

### ProjectMaintenance

```text
@@unique([projectId, maintenancePlanId])
@@index([projectId])
@@index([maintenancePlanId])
```

`@@unique([projectId, maintenancePlanId])` juga berfungsi sebagai index sekaligus mencegah plan yang sama dipilih dua kali pada project yang sama.

---

### Quotation

```text
@@unique([quotationNumber])
@@unique([projectId, version])
@@index([projectId])
@@index([projectId, status])
@@index([createdAt])
```

Catatan: `quotationNumber` sudah unique sehingga sudah memiliki unique index.

---

### QuotationFeature

```text
@@index([quotationId])
```

---

### QuotationFeatureSelection

```text
@@index([quotationFeatureId])
```

---

### QuotationDesign

`quotationId UNIQUE` sudah sekaligus menjadi index.

---

### QuotationHosting

```text
@@index([quotationId])
```

---

### QuotationMaintenance

```text
@@index([quotationId])
```

---

## 28. Data Types Final

```text
ID
→ String / CUID

Money
→ Int

Estimated Hours
→ Int

Working Hours
→ Int

Percentage
→ Decimal

Boolean
→ Boolean

Date / Time
→ DateTime

Status / Billing Period / Selection Type
→ Enum
```

Contoh:

```text
Rp75.000
→ 75000

8 jam
→ 8

27.5%
→ Decimal("27.5")
```

---

## 29. Default Catalog

Default catalog bukan entity khusus.

Saat user baru dibuat, backend dapat menjalankan seed/default initialization.

Contoh:

```text
Authentication
Dashboard
CRUD
Payment Gateway
Notification
Search
```

Setelah masuk ke database user:

```text
userId = User A
```

data tersebut menjadi milik User A.

User B mendapatkan data miliknya sendiri.

Tidak ada shared global catalog pada MVP.

---

## 30. Quotation Lifecycle

```text
                    ┌────────────┐
                    │   DRAFT    │
                    └─────┬──────┘
                          │
                     Finalize
                          │
                          ▼
                    ┌────────────┐
                    │   FINAL    │
                    └────────────┘
```

DRAFT:

```text
Editable
Recalculate
Update snapshot
```

FINAL:

```text
Read-only
Historical
Tidak dapat diubah
```

Jika client meminta perubahan:

```text
FINAL v1
   ↓
Project Update
   ↓
New Calculation
   ↓
New Quotation v2
   ↓
DRAFT
   ↓
FINAL
```

---

## 31. Business Rules Final

### Rule 1

Setiap user memiliki configuration dan catalog masing-masing.

### Rule 2

User tidak dapat melihat data user lain.

### Rule 3

Feature, Design, Hosting, dan Maintenance adalah catalog user.

### Rule 4

Catalog yang telah digunakan tidak di-hard-delete.

### Rule 5

Feature dapat sederhana atau menggunakan option/value.

### Rule 6

User menentukan estimation hours sendiri.

### Rule 7

Project dapat melakukan override terhadap estimasi catalog.

### Rule 8

Satu project maksimal memiliki satu design.

### Rule 9

Satu project dapat memiliki banyak hosting.

### Rule 10

Satu project dapat memiliki banyak maintenance plan.

### Rule 11

Satu project dapat memiliki banyak quotation.

### Rule 12

Quotation memiliki `DRAFT` dan `FINAL`.

### Rule 13

Quotation `DRAFT` dapat diedit.

### Rule 14

Quotation `FINAL` tidak dapat diedit.

### Rule 15

Quotation menyimpan snapshot historis.

### Rule 16

Perubahan catalog tidak mengubah quotation lama.

### Rule 17

Quotation version harus unik di dalam satu project.

### Rule 18

Holiday belum menjadi bagian MVP.

---

## 32. Final Data Flow

```text
User
 ↓
Developer Settings
 ↓
Catalog
 ↓
Create Project
 ↓
Select Features
 ↓
Select Feature Options
 ↓
Project Override (optional)
 ↓
Select Design (0..1)
 ↓
Select Hosting (0..N)
 ↓
Select Maintenance (0..N)
 ↓
Calculation Engine
 ↓
Estimated Hours
 ↓
Buffer
 ↓
Working Days
 ↓
Deadline Check
 ↓
Development Cost
 ↓
Design Cost
 ↓
Hosting Cost
 ↓
Maintenance Cost
 ↓
Margin
 ↓
Rush Fee
 ↓
Quotation DRAFT
 ↓
Review
 ↓
Quotation FINAL
```

---

## 33. ERD Version

### ERD v1

Struktur awal:

```text
User
Catalog
Project
Quotation
```

### ERD v2 Final

Perubahan utama:

```text
+ Session
+ Per-user data isolation
+ Flexible FeatureOption
+ FeatureOptionValue
+ Project-level estimation override
+ 1 Design per Project
+ Multiple Hosting per Project
+ Multiple Maintenance per Project
+ Multiple Quotation per Project
+ Quotation Version
+ Quotation Status
+ Quotation Detail Snapshot
+ Quotation Feature Selection Snapshot
+ Database Integrity Rules
+ Index Strategy
```

Tidak termasuk MVP:

```text
Holiday
Invoice
Payment
Client Portal
Team Collaboration
CRM
AI Estimation
```

---

## 34. Final Principle

```text
CATALOG
"Bagaimana saya biasanya menghitung dan menjual layanan?"

        ↓

PROJECT
"Apa yang dibutuhkan client kali ini?"

        ↓

CALCULATION
"Berapa estimasi dan harga berdasarkan konfigurasi saya?"

        ↓

QUOTATION DRAFT
"Apakah hasilnya sudah benar?"

        ↓

QUOTATION FINAL
"Ini hasil resmi yang diberikan kepada client."
```

**ERD v2 Final ini menjadi baseline database resmi MVP.**
