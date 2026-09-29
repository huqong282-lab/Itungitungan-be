# UI Specification v2

## Itungitungan — Configurable Project Estimation & Quotation System

---

## 1. Purpose

Dokumen ini mendefinisikan spesifikasi fungsional dan struktural UI untuk MVP.

UI Specification menjadi referensi untuk:

- Frontend implementation
- Component design
- Form behavior
- Validation
- Loading state
- Error state
- Responsive behavior
- API integration

Visual styling seperti color, typography, spacing, radius, shadow, dan tokens ditentukan pada `DESIGN-SYSTEM.md`.

---

## 2. Global UI Principles

Semua authenticated page menggunakan:

```text
Topbar
Sidebar
Main Content
```

Setiap page sebisa mungkin memiliki:

```text
Page Header
├── Title
├── Description
└── Primary Action

Page Content
```

Setiap primary action harus memiliki feedback loading dan success/error.

---

## 3. Global Form Rules

Validation dilakukan pada:

```text
Client
+
Server
```

Client validation digunakan untuk feedback cepat.

Backend validation tetap menjadi source of truth.

Numeric input harus menerima nilai yang sesuai dengan tipe data API.

Jam estimasi menggunakan integer.

Persentase dapat menggunakan decimal.

Nominal uang menggunakan integer.

---

## 4. Authentication UI

### Login

Route:

```text
/login
```

Fields:

```text
Email
Password
```

States:

```text
Initial
Submitting
Validation Error
Invalid Credentials
Server Error
Success
```

---

### Register

Route:

```text
/register
```

Fields:

```text
Name
Email
Password
Confirm Password
```

Validation:

```text
Name required
Email valid
Password required
Password confirmation matches
```

---

## 5. Dashboard UI

Route:

```text
/app
```

Layout:

```text
Dashboard
Welcome back, {name}

Project Summary
Quotation Summary
Recent Projects
Recent Quotations
Quick Actions
```

Quick actions:

```text
Create Project
Manage Features
```

---

## 6. Project List UI

Route:

```text
/app/projects
```

Toolbar:

```text
Search
Status Filter
Create Project
```

Table:

```text
Project
Client
Status
Deadline
Latest Quotation
Updated
Action
```

States:

```text
Loading
Empty
Error
Success
```

---

## 7. Create Project UI

Route:

```text
/app/projects/new
```

Fields:

```text
Client Name *
Project Name *
Logo
Deadline
```

Deadline bersifat optional.

Actions:

```text
Cancel
Create Project
```

---

## 8. Project Detail UI

Route:

```text
/app/projects/:projectId
```

Sections:

```text
Project Information
Features
Design
Hosting
Maintenance
Calculation Summary
Quotation History
```

---

## 9. Feature Selection UI

```text
Features

[ + Add Feature ]

Authentication
Estimated: 12h

Payment Gateway
Estimated: 26h
```

User dapat:

```text
Configure
Remove
Override Estimate
```

Feature catalog hanya menampilkan feature aktif milik user.

---

## 10. Complex Feature UI

Contoh:

```text
Payment Gateway

Provider
[ Xendit ]

Payment Type
( ) One Time
( ) Subscription

Refund
[ Yes / No ]

Webhook
[ Yes / No ]
```

Option `SINGLE` menggunakan single selection.

Option `MULTIPLE` menggunakan multi selection.

---

## 11. Feature Estimate UI

Setelah configuration:

```text
Estimated Breakdown

Base
0h

Xendit
+10h

Subscription
+8h

Refund
+4h

Webhook
+4h

----------------
Total
26h
```

Jika override:

```text
System Estimate
26h

Project Estimate
16h
```

Override diberi indikator bahwa nilai tersebut hanya berlaku pada project.

---

## 12. Design UI

Project dapat memiliki maksimal satu design.

Empty state:

```text
No design selected.

[ Select Design ]
```

Selected:

```text
Premium UI
Rp1.500.000

[ Change ]
[ Remove ]
```

---

## 13. Hosting UI

Karena project dapat memiliki banyak hosting:

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

Setiap hosting mempunyai:

```text
Label
Hosting Plan
Client Provided
```

---

## 14. Maintenance UI

Karena project dapat memiliki banyak maintenance:

```text
Maintenance

[ + Add Maintenance ]

Website Maintenance
Rp500.000 / month

Server Monitoring
Rp200.000 / month
```

Plan yang sudah dipilih tidak dapat ditambahkan dua kali.

---

## 15. Calculation Summary UI

```text
Calculation Summary

Estimated Hours
44h

Buffer
20%

Buffered Hours
53h

Estimated Duration
7 working days

Deadline
12 October 2026

Status
NORMAL
```

Pricing:

```text
Development
Rp4.000.000

Design
Rp1.000.000

Hosting
Rp200.000

Maintenance
Rp500.000

Subtotal
Rp5.700.000

Margin
30%
Rp1.710.000

Rush Fee
Rp0

-------------------------
Final Price
Rp7.410.000
```

Frontend harus menampilkan nilai yang dikembalikan backend sebagai source of truth.

---

## 16. Buffer Display Rule

UI tidak menampilkan pecahan jam pada buffered result.

Contoh:

```text
44h × 1.20
= 52.8h
→ rounded up
→ 53h
```

Yang ditampilkan:

```text
Buffered Hours
53h
```

Bukan:

```text
Buffered Hours
52.8h
```

---

## 17. Timeline Display

Timeline menggunakan buffered hours:

```text
Buffered Hours
53h

Working Hours / Day
8h

Working Days
7 days
```

Rumus:

```text
Working Days
=
CEIL(Buffered Hours / Working Hours Per Day)
```

---

## 18. Deadline Warning

Normal:

```text
✓ Normal

Estimated completion is before the client's deadline.
```

Rush:

```text
⚠ Rush Project

The requested deadline is earlier than the estimated completion date.

Rush Fee
30%
```

UI hanya memberi informasi berdasarkan hasil calculation.

---

## 19. Calculation Loading

Saat calculation:

```text
Calculation Summary

[ Skeleton ]

Calculating project estimate...
```

Button:

```text
[ Calculating... ]
```

Tidak dapat ditekan berulang kali.

---

## 20. Calculation Error

```text
Unable to calculate this project.

Please check your project configuration.

[ Retry ]
```

Detail internal backend tidak ditampilkan.

---

## 21. Create Quotation

Action:

```text
[ Create Quotation ]
```

Jika belum ada calculation result:

```text
Please calculate the project first.
```

Jika calculation tersedia:

```text
Create quotation from current calculation?
```

Actions:

```text
Cancel
Create Draft
```

---

## 22. Quotation Draft UI

Route:

```text
/app/quotations/:quotationId
```

Header:

```text
Quotation #QT-0001
Version 1
Status: DRAFT

[ Edit ]
[ Finalize ]
```

Body:

```text
Client Information
Project Information
Project Scope
Feature Breakdown
Design
Hosting
Maintenance
Timeline
Pricing
Revision Policy
```

---

## 23. Quotation Finalization

Modal:

```text
Finalize Quotation

Once finalized:
• This quotation cannot be edited.
• Current calculation becomes historical.
• Changes require a new quotation version.

[Cancel]
[Finalize]
```

---

## 24. Quotation Final UI

Jika status:

```text
FINAL
```

tampilkan:

```text
Quotation #QT-0001
Version 1

FINAL
```

Available:

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

---

## 25. Quotation History

```text
Version   Status   Total        Created
v1        FINAL    Rp6.5M       ...
v2        FINAL    Rp8.0M       ...
v3        DRAFT    Rp9.2M       ...
```

User dapat membuka quotation yang sesuai.

---

## 26. Settings UI

Route:

```text
/app/settings
```

Sections:

```text
Pricing
Timeline
Margin & Rush
Revision
General
```

Fields:

```text
Developer Rate
Working Hours / Day
Default Buffer
Default Margin
Default Rush Fee
Free Revision Count
Additional Revision Price
Currency
```

---

## 27. Catalog UI Pattern

Feature, Design, Hosting, dan Maintenance mengikuti pola:

```text
Page Header
Search / Filter
List
Create
Edit
Deactivate
```

Catalog yang inactive tidak muncul pada selector project baru.

---

## 28. Global Modal Rules

Confirmation wajib digunakan untuk:

```text
Deactivate Catalog
Remove Project Feature
Remove Hosting
Remove Maintenance
Finalize Quotation
```

---

## 29. Empty State

Setiap resource list mempunyai empty state.

Contoh:

```text
No hosting plans yet.

Add your first hosting plan to use it in your projects.

[Create Hosting]
```

---

## 30. Loading State

Gunakan:

```text
Skeleton
```

untuk initial data loading.

Gunakan:

```text
Button loading state
```

untuk mutations.

Gunakan calculation-specific loading state pada calculator.

---

## 31. Error State

Error dikategorikan:

```text
Validation Error
Authentication Error
Authorization Error
Not Found
Server Error
Network Error
```

Technical stack trace tidak ditampilkan.

---

## 32. Responsive Behavior

Desktop:

```text
Sidebar
Main Content
Multi-column
```

Tablet:

```text
Collapsible Sidebar
Reduced Columns
```

Mobile:

```text
Sidebar → Drawer
Table → Card/List
Multi-column → Single Column
```

Project calculator harus tetap usable tanpa horizontal scrolling yang tidak diperlukan.

---

## 33. Accessibility

Minimum:

```text
Keyboard Accessible
Visible Focus State
Form Labels
Button Semantics
Input Error Association
Modal Focus Handling
Sufficient Contrast
```

---

## 34. Data Visibility

Authenticated application boleh menampilkan:

```text
Internal Cost
Client Price
Developer Rate
Margin
Project Configuration
Quotation Draft
Quotation History
```

Client-facing quotation dapat menampilkan:

```text
Client Information
Project Scope
Timeline
Final Pricing
Maintenance
Revision Policy
```

Tidak wajib menampilkan:

```text
Internal Cost
Developer Rate
Detailed Margin Calculation
Internal Provider Notes
```

---

## 35. Frontend Calculation Principle

Frontend boleh melakukan calculation untuk presentational purposes jika diperlukan.

Namun nilai berikut harus berasal dari backend:

```text
Final Price
Buffered Hours
Working Days
Rush Status
Quotation Total
```

Frontend tidak boleh menjadi source of truth untuk business calculation.

---

## 36. Quotation Editing

DRAFT:

```text
Edit
↓
Recalculate
↓
Update
```

FINAL:

```text
Read-only
```

Backend tetap menjadi enforcement utama.

---

## 37. UI Component Boundaries

Contoh Project Detail:

```text
ProjectDetail
├── ProjectHeader
├── ProjectInformation
├── FeatureSection
│   ├── FeatureList
│   ├── AddFeatureDialog
│   └── FeatureConfiguration
├── DesignSection
├── HostingSection
├── MaintenanceSection
├── CalculationSummary
└── QuotationHistory
```

Tidak membuat satu component besar yang menangani seluruh Project Detail.

---

## 38. Screen State Matrix

| Screen           | Loading | Empty | Error | Validation | Success |
| ---------------- | ------- | ----- | ----- | ---------- | ------- |
| Dashboard        | Yes     | Yes   | Yes   | -          | Yes     |
| Project List     | Yes     | Yes   | Yes   | -          | Yes     |
| Project Detail   | Yes     | Yes   | Yes   | Yes        | Yes     |
| Feature List     | Yes     | Yes   | Yes   | -          | Yes     |
| Feature Editor   | Yes     | -     | Yes   | Yes        | Yes     |
| Design List      | Yes     | Yes   | Yes   | -          | Yes     |
| Hosting List     | Yes     | Yes   | Yes   | -          | Yes     |
| Maintenance List | Yes     | Yes   | Yes   | -          | Yes     |
| Quotation List   | Yes     | Yes   | Yes   | -          | Yes     |
| Quotation Detail | Yes     | Yes   | Yes   | Yes        | Yes     |
| Settings         | Yes     | -     | Yes   | Yes        | Yes     |

---

## 39. API Dependency Principle

Contoh:

```text
Feature List
↓
GET /api/features
```

Project Detail:

```text
GET /api/projects/:id
GET /api/features
GET /api/projects/:id/quotations
```

Calculate:

```text
POST /api/projects/:id/calculate
```

Quotation:

```text
POST /api/projects/:id/quotations
GET /api/quotations/:id
POST /api/quotations/:id/finalize
```

Detail request/response akan ditentukan dalam `API-CONTRACT.md`.

---

## 40. UI-Spec Boundary

UI-SPEC menentukan:

```text
Structure
Interaction
Behavior
Validation
States
Component Responsibilities
API Dependency
```

UI-SPEC tidak menentukan:

```text
Exact Colors
Font Family
Exact Spacing Tokens
Shadow Values
Border Radius Tokens
Branding
```

Semua itu ditentukan dalam `DESIGN-SYSTEM.md`.

---

## 41. Completion Criteria

UI Specification dianggap lengkap untuk MVP ketika setiap screen pada `SCREEN-MAP.md` memiliki:

```text
Structure
Primary Action
Secondary Actions
Form Fields
Validation
Loading State
Empty State
Error State
Success State
Permission Behavior
API Dependency
Responsive Behavior
```

### Final Calculation Display

Semua screen dan component yang menampilkan estimation timeline harus menggunakan rule yang sama:

```text
Estimated Hours
44h

Buffer
20%

Buffered Hours
53h

Working Hours / Day
8h

Working Days
7 days
```

Tidak boleh ada UI yang menampilkan hasil buffered berbeda dari backend.
