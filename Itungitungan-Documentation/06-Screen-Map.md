# Screen Map

## Itungitungan — Configurable Project Estimation & Quotation System

---

## 1. Purpose

Dokumen ini mendefinisikan seluruh screen dan navigation structure untuk MVP.

Screen Map menjadi referensi bagi:

- Frontend
- UI/UX
- API integration
- Frontend task breakdown
- E2E testing

Screen Map tidak menentukan detail visual setiap component. Detail visual dibahas di `UI-SPEC.md` dan `DESIGN-SYSTEM.md`.

---

## 2. Application Areas

MVP dibagi menjadi tiga area:

```text
Public / Unauthenticated
        │
        ├── Login
        └── Register

Authenticated Application
        │
        ├── Dashboard
        ├── Projects
        ├── Catalog
        ├── Quotations
        └── Settings

System States
        │
        ├── 404
        ├── Unauthorized
        ├── Forbidden
        └── Server Error
```

---

## 3. Route Structure

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

/404
```

---

## 4. Authentication Screens

### AUTH-001 — Login

#### Route

```text
/login
```

#### Purpose

Memungkinkan existing user masuk ke aplikasi.

#### Main Content

```text
Email
Password
Login Button
Register Link
```

#### Flow

```text
Login
 ↓
Submit
 ↓
Authentication
 ↓
Success → /app
Failure → Show validation/error
```

#### States

```text
Default
Loading
Invalid Credentials
Validation Error
Server Error
```

---

## 5. AUTH-002 — Register

#### Route

```text
/register
```

#### Purpose

Membuat account baru.

#### Main Content

```text
Name
Email
Password
Confirm Password
Register Button
Login Link
```

#### Flow

```text
Register
 ↓
Create User
 ↓
Create Settings
 ↓
Initialize Default Catalog
 ↓
Create Session
 ↓
/app
```

#### States

```text
Default
Loading
Validation Error
Email Already Used
Server Error
Success
```

---

## 6. App Shell

Semua authenticated screen menggunakan application shell yang sama.

```text
┌─────────────────────────────────────────────┐
│ Topbar                                      │
├──────────────┬──────────────────────────────┤
│ Sidebar      │ Main Content                 │
│              │                              │
│ Dashboard    │                              │
│ Projects     │                              │
│ Features     │                              │
│ Designs      │                              │
│ Hosting      │                              │
│ Maintenance  │                              │
│ Quotations   │                              │
│ Settings     │                              │
│              │                              │
│ User         │                              │
└──────────────┴──────────────────────────────┘
```

App Shell menangani:

```text
Navigation
User Menu
Logout
Responsive Layout
Global Toast
Global Error Handling
```

---

## 7. APP-001 — Dashboard

#### Route

```text
/app
```

#### Purpose

Memberikan ringkasan kondisi aplikasi dan akses cepat ke workflow utama.

#### Main Content

```text
Project Summary
Quotation Summary
Recent Projects
Recent Quotations
Quick Actions
```

#### Quick Actions

```text
Create Project
Manage Features
Manage Designs
Manage Hosting
Manage Maintenance
```

#### Recommended Information

```text
Total Projects
Draft Projects
Final Quotations
Recent Activity
```

Dashboard tidak melakukan perhitungan quotation sendiri.

---

## 8. Project Screens

Project merupakan workflow utama aplikasi.

```text
/app/projects
/app/projects/new
/app/projects/:projectId
```

---

## 9. PROJECT-001 — Project List

#### Route

```text
/app/projects
```

#### Purpose

Menampilkan seluruh project milik user.

#### Main Content

```text
Page Header
Create Project Button
Project Search
Project Status Filter
Project Table/List
```

#### Project Item

Minimal menampilkan:

```text
Project Name
Client
Status
Deadline
Latest Quotation
Updated At
```

#### Actions

```text
Open
Delete / Archive
```

Delete/Archive behavior mengikuti Business Rules.

---

## 10. PROJECT-002 — Create Project

#### Route

```text
/app/projects/new
```

#### Purpose

Membuat project baru.

#### Main Content

```text
Client Name
Project Name
Logo
Deadline
```

#### Actions

```text
Create Project
Cancel
```

#### Flow

```text
Create Project
 ↓
Save
 ↓
Project Created
 ↓
Project Detail / Calculator
```

Project baru memiliki:

```text
status = DRAFT
```

---

## 11. PROJECT-003 — Project Detail

#### Route

```text
/app/projects/:projectId
```

#### Purpose

Menjadi pusat konfigurasi project.

#### Structure

```text
Project Header
Project Information

Features
Design
Hosting
Maintenance

Calculation Summary

Quotation History
```

#### Navigation

Project Detail dapat mengakses:

```text
Feature Configuration
Design Selection
Hosting Selection
Maintenance Selection
Calculation
Quotation
```

---

## 12. Project Detail Layout

```text
┌────────────────────────────────────────────┐
│ Project Name                               │
│ Client Name                                │
│ Status                                     │
├────────────────────────────────────────────┤
│ Project Information                        │
├────────────────────────────────────────────┤
│ Features                                   │
│                                            │
│ Authentication                            │
│ Payment Gateway                            │
│ Dashboard                                  │
├────────────────────────────────────────────┤
│ Design                                     │
│ Premium UI                                 │
├────────────────────────────────────────────┤
│ Hosting                                    │
│ Production → VPS                           │
│ Staging → Railway                          │
├────────────────────────────────────────────┤
│ Maintenance                                │
│ Website Maintenance                        │
├────────────────────────────────────────────┤
│ Calculation Summary                        │
├────────────────────────────────────────────┤
│ Quotation History                          │
└────────────────────────────────────────────┘
```

---

## 13. Feature Management Screens

Feature catalog:

```text
/app/features
/app/features/:featureId
```

---

## 14. FEATURE-001 — Feature List

#### Route

```text
/app/features
```

#### Purpose

Mengelola feature catalog milik user.

#### Main Content

```text
Feature List
Search
Category Filter
Active/Inactive Filter
Create Feature
```

#### Feature Item

```text
Name
Category
Base Hours
Option Count
Status
```

#### Actions

```text
Open
Edit
Deactivate
```

---

## 15. FEATURE-002 — Feature Detail / Editor

#### Route

```text
/app/features/:featureId
```

#### Purpose

Mengedit feature dan option-nya.

#### Main Content

```text
Basic Information
Name
Description
Category
Base Estimated Hours

Options
 ├── Option
 │    ├── Value
 │    ├── Hours
 │    └── Status
 └── ...
```

#### Actions

```text
Save
Deactivate
Add Option
Edit Option
Delete / Deactivate Option
Add Value
Edit Value
Deactivate Value
```

---

## 16. Feature Creation

Untuk MVP, Create Feature dapat menggunakan screen yang sama dengan editor:

```text
/app/features/new
```

Screen ini merupakan mode create dari Feature Editor.

---

## 17. Feature Option Editor

Option tidak harus memiliki route sendiri.

MVP menggunakan:

```text
Modal
atau
Drawer
```

untuk:

```text
Create Option
Edit Option
Create Value
Edit Value
```

Alasan:

Option merupakan bagian dari Feature dan tidak perlu menjadi navigational entity utama.

---

## 18. Design Screens

```text
/app/designs
/app/designs/:designId
```

---

## 19. DESIGN-001 — Design List

#### Route

```text
/app/designs
```

#### Main Content

```text
Design List
Create Design
Search
Status Filter
```

#### Design Item

```text
Name
Description
Price
Status
```

---

## 20. DESIGN-002 — Design Editor

#### Route

```text
/app/designs/:designId
```

#### Main Content

```text
Name
Description
Price
```

#### Actions

```text
Save
Deactivate
```

Create mode:

```text
/app/designs/new
```

---

## 21. Hosting Screens

```text
/app/hosting
/app/hosting/:hostingId
```

---

## 22. HOSTING-001 — Hosting List

#### Route

```text
/app/hosting
```

#### Main Content

```text
Hosting Plans
Create Hosting
Search
Status Filter
```

#### Hosting Item

```text
Provider
Plan
Internal Cost
Client Price
Billing Period
Status
```

Internal cost is only visible inside the authenticated application.

---

## 23. HOSTING-002 — Hosting Editor

#### Route

```text
/app/hosting/:hostingId
```

#### Main Content

```text
Provider
Plan Name
Internal Cost
Client Price
Billing Period
```

#### Actions

```text
Save
Deactivate
```

Create mode:

```text
/app/hosting/new
```

---

## 24. Maintenance Screens

```text
/app/maintenance
/app/maintenance/:maintenanceId
```

---

## 25. MAINTENANCE-001 — Maintenance List

#### Route

```text
/app/maintenance
```

#### Main Content

```text
Maintenance Plans
Create Plan
Search
Status Filter
```

#### Maintenance Item

```text
Name
Price
Billing Period
Status
```

---

## 26. MAINTENANCE-002 — Maintenance Editor

#### Route

```text
/app/maintenance/:maintenanceId
```

#### Main Content

```text
Name
Price
Billing Period
```

#### Actions

```text
Save
Deactivate
```

Create mode:

```text
/app/maintenance/new
```

---

## 27. Project Calculator

Calculator tidak harus menjadi route terpisah untuk MVP.

Calculator berada di:

```text
/app/projects/:projectId
```

sebagai bagian utama Project Detail.

#### Calculator Sections

```text
Feature Estimation
Design Cost
Hosting Cost
Maintenance Cost
Buffer
Timeline
Deadline
Margin
Rush Fee
Final Price
```

---

## 28. Calculation Summary

Calculation result ditampilkan di dalam Project Detail.

#### Main Content

```text
Estimated Hours
Buffered Hours
Working Days
Deadline Status

Development Cost
Design Cost
Hosting Cost
Maintenance Cost

Subtotal

Margin
Margin Amount

Rush Fee
Rush Fee Amount

Final Price
```

#### Actions

```text
Recalculate
Create Quotation
```

---

## 29. Project Feature Configuration UI

Untuk feature kompleks:

```text
Payment Gateway
```

UI menampilkan:

```text
Provider
[ Xendit ▼ ]

Payment Type
( ) One Time
( ) Subscription

Refund
[ Yes ]

Webhook
[ Yes ]
```

Setelah selection berubah:

```text
Calculate Feature
```

atau calculation dilakukan otomatis sesuai UX yang nanti ditentukan pada `UI-SPEC.md`.

---

## 30. Project Hosting UI

Karena hosting dapat lebih dari satu:

```text
Hosting

[ + Add Hosting ]

Production
Railway Hobby
Rp200.000 / month

Staging
VPS Basic
Rp150.000 / month
```

Setiap hosting memiliki:

```text
Label
Plan
Client Provided
```

---

## 31. Project Maintenance UI

Karena maintenance dapat lebih dari satu:

```text
Maintenance

[ + Add Maintenance ]

Website Maintenance
Rp500.000 / month

Server Monitoring
Rp200.000 / month
```

---

## 32. Quotation Screens

```text
/app/quotations
/app/quotations/:quotationId
```

---

## 33. QUOTATION-001 — Quotation List

#### Route

```text
/app/quotations
```

#### Main Content

```text
Quotation Number
Client
Project
Version
Status
Final Price
Created At
```

#### Filters

```text
Status
Project
Date
```

#### Actions

```text
Open
```

---

## 34. QUOTATION-002 — Quotation Detail

#### Route

```text
/app/quotations/:quotationId
```

#### Main Content

```text
Quotation Header
Client Information

Project Summary

Feature Breakdown
Design
Hosting
Maintenance

Timeline

Pricing Breakdown

Revision Policy

Status
```

---

## 35. Quotation DRAFT UI

Jika:

```text
status = DRAFT
```

Actions:

```text
Edit
Recalculate
Finalize
```

User dapat melakukan perubahan terhadap draft.

---

## 36. Quotation FINAL UI

Jika:

```text
status = FINAL
```

Actions:

```text
View
Download PDF
```

Tidak tersedia:

```text
Edit
Recalculate
Modify
```

UI harus memperlihatkan bahwa quotation telah dikunci.

---

## 37. Finalize Confirmation

Ketika user memilih:

```text
Finalize
```

tampilkan confirmation modal:

```text
Finalize Quotation?

After finalization:
- Quotation cannot be edited
- Current calculation becomes historical snapshot
- Changes require a new quotation version

[Cancel]
[Finalize]
```

---

## 38. Settings Screens

#### Route

```text
/app/settings
```

MVP menggunakan satu Settings screen.

#### Sections

```text
Developer Pricing
Timeline
Margin
Rush
Revision
Currency
```

#### Fields

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

---

## 39. Global Error Screens

### ERROR-001 — Not Found

#### Route

```text
/404
```

Menampilkan:

```text
Page Not Found
Back to Dashboard
```

---

## 40. ERROR-002 — Unauthorized

Jika session tidak valid:

```text
401
```

Flow:

```text
Current Page
 ↓
Session Invalid
 ↓
Login
```

---

## 41. ERROR-003 — Forbidden

Jika user mencoba membuka resource milik user lain:

```text
403
```

Menampilkan pesan generik:

```text
You do not have permission to access this resource.
```

Tidak membocorkan apakah resource tersebut benar-benar dimiliki user lain.

---

## 42. ERROR-004 — Server Error

```text
500
```

Menampilkan:

```text
Something went wrong.
Please try again.
```

Detail internal tidak ditampilkan.

---

## 43. Modal & Drawer Map

Tidak semua interaction membutuhkan page baru.

#### Modal

Digunakan untuk:

```text
Confirm Finalize
Confirm Deactivate
Confirm Remove
Create Feature Option
Edit Feature Option
Create Feature Value
Edit Feature Value
```

#### Drawer

Dapat digunakan untuk:

```text
Quick Edit
Feature Configuration
Hosting Configuration
Maintenance Configuration
```

Pemilihan final antara modal/drawer ditentukan pada `UI-SPEC.md`.

---

## 44. Navigation Map

```text
Sidebar
│
├── Dashboard
│
├── Projects
│   ├── Project List
│   ├── Create Project
│   └── Project Detail
│
├── Catalog
│   ├── Features
│   ├── Designs
│   ├── Hosting
│   └── Maintenance
│
├── Quotations
│   ├── Quotation List
│   └── Quotation Detail
│
└── Settings
```

---

## 45. Screen Dependency Map

```text
Login
  ↓
Dashboard
  ↓
Projects
  ↓
Project Detail
  │
  ├── Features
  ├── Design
  ├── Hosting
  ├── Maintenance
  └── Calculation
        ↓
   Quotation Draft
        ↓
   Quotation Final
        ↓
   Quotation History
```

Catalog screens:

```text
Features
Designs
Hosting
Maintenance
```

merupakan configuration screens yang dapat digunakan sebelum atau selama project creation.

---

## 46. Screen Count

MVP primary screens:

```text
Authentication
├── Login
└── Register

Application
├── Dashboard
├── Projects
├── Create Project
├── Project Detail
├── Features
├── Feature Editor
├── Designs
├── Design Editor
├── Hosting
├── Hosting Editor
├── Maintenance
├── Maintenance Editor
├── Quotations
├── Quotation Detail
└── Settings
```

Dengan additional system screen:

```text
404
```

---

## 47. Screen vs Component Principle

Tidak semua UI yang terlihat merupakan screen.

#### Screen

Memiliki route dan navigational purpose.

Contoh:

```text
Project Detail
Quotation Detail
Feature List
```

#### Component / Modal / Drawer

Merupakan bagian dari screen.

Contoh:

```text
Feature Option Editor
Finalize Confirmation
Hosting Form
Pricing Summary
```

Hal ini mencegah aplikasi memiliki terlalu banyak route untuk interaction kecil.

---

## 48. MVP Navigation Principle

User harus dapat mencapai workflow utama dengan maksimal beberapa langkah dari Dashboard:

```text
Dashboard
   ↓
Create Project
   ↓
Configure
   ↓
Calculate
   ↓
Create Quotation
```

Catalog management tetap berada di Sidebar.

---

## 49. Screen State Principle

Setiap screen harus mempertimbangkan minimal:

```text
Loading
Empty
Success
Error
```

Screen dengan form juga harus mempertimbangkan:

```text
Validation Error
Submitting
Unsaved Changes
Success
```

Screen yang membutuhkan data permission juga harus menangani:

```text
Unauthorized
Forbidden
Not Found
```

---

## 50. Screen Map Constraints

Screen implementation tidak boleh menambahkan feature yang belum ada dalam PRD tanpa mengubah dokumen requirement.

Jika terdapat requirement baru:

```text
Requirement
 ↓
PRD
 ↓
Business Rules
 ↓
User Flow
 ↓
Screen Map
 ↓
Implementation
```

Bukan langsung:

```text
Coding
 ↓
Oh ternyata butuh screen baru
```

---

## 51. Final MVP Screen Flow

```text
                         LOGIN
                           │
                           ▼
                       DASHBOARD
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
       PROJECTS         CATALOG          SETTINGS
          │                │
          ▼                ├── Features
    CREATE PROJECT         ├── Designs
          │                ├── Hosting
          ▼                └── Maintenance
    PROJECT DETAIL
          │
     ┌────┼─────┐
     │    │     │
     ▼    ▼     ▼
 Features Design Hosting
     │          │
     └────┬─────┘
          │
          ▼
     MAINTENANCE
          │
          ▼
      CALCULATE
          │
          ▼
   CALCULATION SUMMARY
          │
          ▼
   QUOTATION DRAFT
          │
          ▼
        FINALIZE
          │
          ▼
   QUOTATION FINAL
          │
          ▼
   QUOTATION HISTORY
```

---

## 52. Definition of Complete Screen Coverage

Screen Map dianggap lengkap untuk MVP apabila seluruh primary user journey memiliki screen atau component yang dapat mendukung:

```text
Authentication
Configuration
Project Creation
Project Configuration
Calculation
Quotation Creation
Quotation Editing
Quotation Finalization
Quotation History
Settings
Error Handling
```

Screen Map menjadi baseline untuk penyusunan `UI-SPEC.md` dan Frontend Tasks.
