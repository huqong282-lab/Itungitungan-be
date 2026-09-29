# User Flow

## Itungitungan — Configurable Project Estimation & Quotation System

---

## 1. Purpose

Dokumen ini mendefinisikan alur yang dilakukan user saat menggunakan aplikasi dari pertama kali masuk sampai quotation selesai dibuat.

User Flow menjadi acuan untuk:

- Frontend
- Backend
- API Contract
- UI/UX
- Testing
- Development Tasks

Alur harus mengikuti PRD dan Business Rules yang sudah ditetapkan.

---

## 2. High-Level Application Flow

```text
Open Application
      ↓
Authentication
      ↓
First Time?
   ┌──┴──┐
  YES    NO
   ↓      ↓
Setup   Dashboard
   ↓      ↓
Dashboard
      ↓
Project Workflow
      ↓
Quotation Workflow
      ↓
Quotation History
```

---

## 3. Authentication Flow

### 3.1 Register

```text
Register Page
     ↓
Input:
- Name
- Email
- Password
     ↓
Submit
     ↓
Backend Validation
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
     ↓
Dashboard
```

#### Result

User memiliki:

```text
User
DeveloperSettings
Session
Default Feature Catalog
Default Design Catalog
Default Hosting Catalog
Default Maintenance Catalog
```

---

## 4. Login Flow

```text
Login Page
     ↓
Input Email + Password
     ↓
Submit
     ↓
Backend Validation
     ↓
Credential Valid?
   ┌──┴──┐
  NO    YES
   ↓      ↓
 Error  Create Session
          ↓
     HTTP-only Cookie
          ↓
       Dashboard
```

---

## 5. Session Flow

Setiap request authenticated:

```text
Browser
   ↓
HTTP-only Session Cookie
   ↓
Backend
   ↓
Find Session
   ↓
Check Expiration
   ↓
Check User
   ↓
Request Authorized
```

Jika session:

```text
Expired
Invalid
Tidak ditemukan
```

maka:

```text
→ Unauthorized
→ Redirect/Login kembali
```

---

## 6. First-Time User Flow

Setelah register, user masuk ke dashboard.

Default catalog sudah tersedia.

```text
Register
   ↓
Default Configuration Created
   ↓
Dashboard
```

User tidak diwajibkan mengatur semuanya sebelum dapat membuat project.

User dapat langsung menggunakan default.

---

## 7. Developer Settings Flow

User dapat membuka:

```text
Settings
```

Kemudian:

```text
Developer Settings
```

Informasi:

```text
Developer Rate
Working Hours / Day
Buffer %
Default Margin %
Default Rush %
Free Revision Count
Additional Revision Price
Currency
```

Flow:

```text
Settings
   ↓
Edit Configuration
   ↓
Validate
   ↓
Save
   ↓
Success
```

Perubahan settings berlaku untuk perhitungan baru.

Quotation yang sudah dibuat tetap menggunakan snapshot sebelumnya.

---

## 8. Feature Catalog Flow

User membuka:

```text
Features
```

Kemudian dapat melihat:

```text
Feature List
```

Flow utama:

```text
Features
   ↓
Create Feature
   ↓
Feature Form
   ↓
Save
   ↓
Feature Detail
```

Feature dapat berupa:

```text
Simple Feature
```

atau:

```text
Feature + Options
```

---

## 9. Simple Feature Flow

Contoh:

```text
Create Feature
      ↓
Name:
Static Page

Base Estimated Hours:
4

      ↓
Save
      ↓
Feature Created
```

Tidak membutuhkan FeatureOption.

---

## 10. Complex Feature Flow

Contoh:

```text
Create Feature
      ↓
Payment Gateway
      ↓
Create Option
```

Option:

```text
Provider
```

Values:

```text
Midtrans   → 8h
Xendit     → 10h
Stripe     → 12h
Custom     → 20h
```

Kemudian:

```text
Create Option
      ↓
Add Values
      ↓
Save
```

User dapat menambahkan:

```text
Payment Type
Refund
Webhook
```

---

## 11. Feature Edit Flow

```text
Features
   ↓
Select Feature
   ↓
Edit
   ↓
Change Name / Description / Hours / Options
   ↓
Save
```

Jika feature sudah digunakan oleh project:

- perubahan catalog tetap berlaku untuk penggunaan berikutnya
- histori quotation tidak berubah
- snapshot quotation tetap dipertahankan

---

## 12. Feature Deactivation Flow

Jika feature sudah digunakan project:

```text
Feature
   ↓
Deactivate
   ↓
isActive = false
```

Feature:

```text
Tidak muncul di project baru
```

Tetapi:

```text
Tetap tersedia untuk histori
Tidak memutus data lama
```

---

## 13. Design Catalog Flow

```text
Designs
   ↓
Create Design
   ↓
Name
Description
Price
   ↓
Save
```

Contoh:

```text
Template
Rp500.000

Premium UI
Rp1.500.000
```

User dapat:

```text
Create
Edit
Deactivate
```

---

## 14. Hosting Catalog Flow

```text
Hosting
   ↓
Create Hosting Plan
   ↓
Provider
Plan Name
Internal Cost
Client Price
Billing Period
   ↓
Save
```

Contoh:

```text
Railway
Hobby

Internal:
Rp150.000

Client:
Rp200.000

Monthly
```

Internal cost hanya untuk perhitungan internal.

---

## 15. Maintenance Catalog Flow

```text
Maintenance
    ↓
Create Plan
    ↓
Name
Price
Billing Period
    ↓
Save
```

Contoh:

```text
Website Maintenance
Rp500.000 / Monthly
```

---

## 16. Create Project Flow

Ini merupakan alur utama aplikasi.

```text
Dashboard
    ↓
Create Project
    ↓
Project Information
```

Input:

```text
Client Name
Project Name
Logo
Deadline
```

Setelah disimpan:

```text
Project
Status = DRAFT
```

Kemudian user masuk ke Project Detail/Calculator.

---

## 17. Project Feature Selection Flow

```text
Project
   ↓
Features
   ↓
Add Feature
   ↓
Select Feature
```

Contoh:

```text
Authentication
Payment Gateway
Dashboard
Notification
```

Setelah feature dipilih:

```text
Simple Feature
→ selesai

Complex Feature
→ Configure Options
```

---

## 18. Feature Configuration Flow

Contoh:

```text
Payment Gateway
```

User melihat option:

```text
Provider
Payment Type
Refund
Webhook
```

Kemudian:

```text
Provider
→ Xendit

Payment Type
→ Subscription

Refund
→ Yes

Webhook
→ Yes
```

System menghitung:

```text
Xendit        +10h
Subscription  +8h
Refund        +4h
Webhook       +4h

Total = 26h
```

---

## 19. Project Estimation Override Flow

User dapat melakukan override.

```text
Payment Gateway
Calculated:
26h
```

User memilih:

```text
Override Estimate
```

Kemudian:

```text
16h
```

Final project estimation untuk feature tersebut:

```text
16h
```

Catalog tetap:

```text
24h / rule-based calculation
```

Perubahan hanya berlaku pada project tersebut.

---

## 20. Design Selection Flow

Project dapat memilih:

```text
0 atau 1 Design
```

Flow:

```text
Project
   ↓
Design
   ↓
Select Design
   ↓
Template / Premium UI / ...
   ↓
Save
```

User juga dapat memilih:

```text
No Design
```

jika project tidak menggunakan catalog design.

---

## 21. Hosting Selection Flow

Project dapat memiliki:

```text
0..N Hosting
```

Flow:

```text
Project
   ↓
Hosting
   ↓
Add Hosting
```

User menentukan:

```text
Label
Hosting Plan
Client Provided
```

Contoh:

```text
Production
→ VPS

Staging
→ Railway
```

Jika client menyediakan hosting:

```text
Client Provided = true
```

---

## 22. Maintenance Selection Flow

Project dapat memiliki:

```text
0..N Maintenance
```

Flow:

```text
Project
   ↓
Maintenance
   ↓
Add Maintenance
   ↓
Select Plan
   ↓
Save
```

Contoh:

```text
Website Maintenance
Server Monitoring
```

---

## 23. Calculation Flow

Setelah konfigurasi project selesai:

```text
Project
   ↓
Calculate
```

Backend mengambil:

```text
Developer Settings
Feature Configuration
Project Override
Design
Hosting
Maintenance
Deadline
```

Kemudian:

```text
Estimation Engine
       ↓
Timeline Engine
       ↓
Pricing Engine
       ↓
Rush Detection
```

---

## 24. Calculation Result Flow

System menampilkan:

```text
Estimated Hours
Buffer
Buffered Hours
Working Days
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
Estimated Hours
44h

Buffer
20%

Buffered Hours
52.8h

Working Days
7 days

Subtotal
Rp5.000.000

Margin
30%

Rush Fee
0%

Final Price
Rp6.500.000
```

---

## 25. Deadline Flow

Jika user memasukkan deadline:

```text
Calculate
   ↓
Compare Estimated Completion
with Client Deadline
```

### Normal

```text
Estimated Completion
≤
Client Deadline
```

Status:

```text
NORMAL
```

### Rush

```text
Estimated Completion
>
Client Deadline
```

Status:

```text
RUSH
```

System menampilkan warning.

Jika configured:

```text
Rush Fee
```

maka fee diterapkan.

---

## 26. Calculation Revision Flow

Jika user mengubah:

```text
Feature
Design
Hosting
Maintenance
Override
Settings
Deadline
```

maka:

```text
Recalculate
```

dipanggil kembali.

Hasil sebelumnya tidak dianggap final selama quotation masih DRAFT.

---

## 27. Create Quotation Flow

Setelah hasil calculation sesuai:

```text
Calculation Summary
       ↓
Create Quotation
       ↓
Create Snapshot
       ↓
Quotation DRAFT
```

Snapshot dibuat dari kondisi project saat itu.

---

## 28. Quotation Draft Flow

Quotation DRAFT dapat:

```text
View
Edit
Recalculate
Update
```

User dapat memeriksa:

```text
Client
Project
Feature
Design
Hosting
Maintenance
Timeline
Pricing
Margin
Rush
Revision Policy
```

---

## 29. Finalize Quotation Flow

Jika user sudah yakin:

```text
Quotation DRAFT
      ↓
Review
      ↓
Finalize
      ↓
Confirmation
      ↓
Quotation FINAL
```

Setelah FINAL:

```text
Read-only
```

Snapshot tidak boleh berubah.

---

## 30. Quotation Final Flow

Quotation FINAL dapat:

```text
View
Download / Generate PDF
Share externally
```

Tetapi tidak dapat:

```text
Edit
Recalculate
Modify Snapshot
```

---

## 31. Create New Quotation Version

Jika client meminta perubahan setelah quotation FINAL:

```text
Quotation v1 FINAL
       ↓
Modify Project
       ↓
Create New Quotation
       ↓
Quotation v2 DRAFT
```

Quotation v1 tetap:

```text
FINAL
```

dan tidak berubah.

---

## 32. Quotation History Flow

User membuka:

```text
Quotations
```

System menampilkan:

```text
Quotation Number
Client
Project
Version
Status
Final Price
Created At
```

Contoh:

```text
QT-0001
Company A
Website
v1
FINAL
Rp6.500.000

QT-0002
Company A
Website
v2
DRAFT
Rp8.000.000
```

---

## 33. Project History Flow

User membuka:

```text
Projects
   ↓
Project Detail
```

Dapat melihat:

```text
Current Configuration
Quotation History
```

Contoh:

```text
Project A

Current Configuration
├── Features
├── Design
├── Hosting
└── Maintenance

Quotation History
├── v1 FINAL
├── v2 FINAL
└── v3 DRAFT
```

---

## 34. Error Flow

Jika backend mengembalikan validation error:

```text
Submit
 ↓
Backend Validation
 ↓
400 Bad Request
 ↓
Frontend displays field/message error
```

Jika unauthorized:

```text
401
 ↓
Session invalid
 ↓
Login
```

Jika forbidden:

```text
403
 ↓
Resource tidak dimiliki user
```

Jika resource tidak ditemukan:

```text
404
```

Jika server error:

```text
500
 ↓
Generic error UI
```

Detail internal error tidak ditampilkan kepada client.

---

## 35. Ownership Flow

Untuk setiap resource:

```text
Request
 ↓
Authenticate User
 ↓
Find Resource
 ↓
Check Ownership
 ↓
Allowed?
```

Contoh:

```text
User A
    ↓
GET Project B
    ↓
Project B.userId != User A.id
    ↓
403 Forbidden
```

User tidak boleh mengakses resource user lain hanya karena mengetahui ID-nya.

---

## 36. Logout Flow

```text
Logout
   ↓
Backend
   ↓
Invalidate Session
   ↓
Clear HTTP-only Cookie
   ↓
Login Page
```

Session lama tidak dapat digunakan lagi.

---

## 37. Complete User Journey

```text
                         ┌──────────────┐
                         │    Open App  │
                         └──────┬───────┘
                                ↓
                        ┌───────────────┐
                        │ Authentication│
                        └───────┬───────┘
                                ↓
                           Dashboard
                                │
          ┌─────────────────────┼──────────────────────┐
          │                     │                      │
          ↓                     ↓                      ↓
      Settings               Catalogs               Projects
                                │                      │
                    ┌───────────┼───────────┐          ↓
                    │           │           │      Create Project
                    ↓           ↓           ↓          ↓
                 Features     Design      Hosting   Project Config
                    │                       │           ↓
                    └───────────┬───────────┘      Calculate
                                │                       ↓
                                │                 Calculation
                                │                       ↓
                                │               Create Quotation
                                │                       ↓
                                │                  DRAFT Quote
                                │                       ↓
                                │                  Review Quote
                                │                       ↓
                                │                   Finalize
                                │                       ↓
                                │                   FINAL Quote
                                │                       ↓
                                └────────────── Quotation History
```

---

## 38. Primary User Journey

Jalur utama yang harus selalu dapat diselesaikan:

```text
Register
 ↓
Dashboard
 ↓
Create Project
 ↓
Add Features
 ↓
Configure Features
 ↓
Select Design
 ↓
Select Hosting
 ↓
Select Maintenance
 ↓
Calculate
 ↓
Review Result
 ↓
Create Quotation
 ↓
Review Draft
 ↓
Finalize
 ↓
Quotation History
```

---

## 39. Alternative User Journey

User dapat mengkonfigurasi catalog terlebih dahulu:

```text
Register
 ↓
Settings
 ↓
Configure Feature Catalog
 ↓
Configure Design
 ↓
Configure Hosting
 ↓
Configure Maintenance
 ↓
Create Project
```

---

## 40. User Flow Rules

User Flow harus mematuhi:

```text
PRD
 ↓
Business Rules
 ↓
ERD
```

Tidak boleh ada flow yang memungkinkan:

```text
User melihat data user lain
Quotation FINAL diedit
Catalog used dihapus secara permanen
Project memiliki dua Design
Feature SINGLE memiliki multiple selection
Frontend menentukan final price sendiri
```

---

## 41. MVP User Flow

MVP wajib mendukung:

```text
Authentication
Developer Settings
Feature Management
Feature Option Management
Design Management
Hosting Management
Maintenance Management
Project Creation
Project Configuration
Calculation
Deadline Detection
Quotation Draft
Quotation Final
Quotation History
```

Belum termasuk:

```text
Payment
Invoice
Client Portal
CRM
Team Collaboration
AI Estimation
WhatsApp
Holiday Calendar
```

---

## 42. End State

Tujuan akhir user journey:

```text
Client Requirements
        ↓
Configured Project
        ↓
Calculated Estimation
        ↓
Calculated Price
        ↓
Quotation Draft
        ↓
Quotation Final
        ↓
Historical Record
```

User berhasil ketika dapat menghasilkan quotation yang konsisten berdasarkan konfigurasi pricing miliknya sendiri tanpa melakukan perhitungan manual di luar aplikasi.
