# Design System

## Itungitungan — Configurable Project Estimation & Quotation System

---

## 1. Purpose

Dokumen ini mendefinisikan visual language dan reusable design tokens untuk aplikasi.

Design System menjadi acuan untuk:

- Frontend UI
- Reusable components
- Page consistency
- Responsive design
- Accessibility
- Future design changes

Design System tidak menentukan business logic.

---

## 2. Design Direction

Aplikasi merupakan business/productivity tool untuk developer dan freelancer.

Visual direction:

```text
Clean
Professional
Focused
Technical
Modern
Minimal
```

Prioritas visual:

```text
Clarity
>
Information Density
>
Visual Decoration
```

UI harus membantu user memahami:

```text
Apa yang sedang saya konfigurasi?
Berapa estimasinya?
Berapa biayanya?
Apa status quotation saya?
```

---

## 3. Design Principles

### DS-001 — Clarity First

Informasi pricing dan estimation harus mudah dibaca.

### DS-002 — Consistent Interaction

Komponen dengan fungsi yang sama harus memiliki behavior yang sama.

### DS-003 — Visual Hierarchy

Informasi penting harus lebih menonjol daripada informasi pendukung.

Prioritas:

```text
Final Price
    ↓
Timeline
    ↓
Cost Breakdown
    ↓
Configuration Details
```

### DS-004 — Avoid Excessive Decoration

Tidak menggunakan visual decoration yang tidak memberikan informasi atau membantu navigation.

### DS-005 — Destructive Actions Must Be Clear

Deactivate, Remove, dan Finalize tidak boleh terlihat seperti action biasa.

---

## 4. Theme

MVP menggunakan:

```text
Light Theme
```

Dark theme belum menjadi requirement MVP.

Design system harus tetap memiliki semantic tokens sehingga dark theme dapat ditambahkan nanti tanpa mengganti component implementation.

---

## 5. Color System

Gunakan semantic color tokens, bukan hardcoded color di component.

### Brand

```text
Primary
Primary Hover
Primary Active
Primary Subtle
```

Primary digunakan untuk:

- Main CTA
- Active navigation
- Important interaction
- Selected state

---

### Neutral

```text
Background
Surface
Surface Elevated
Border
Border Strong
Text Primary
Text Secondary
Text Muted
Text Disabled
```

---

### Semantic

#### Success

Digunakan untuk:

```text
Saved
Successful Action
Normal Deadline
Finalized
Active
```

#### Warning

Digunakan untuk:

```text
Rush Project
Unsaved Changes
Potential Problem
```

#### Error

Digunakan untuk:

```text
Validation Error
Server Error
Destructive Action
Invalid State
```

#### Info

Digunakan untuk:

```text
Information
Hints
Explanations
```

---

## 6. Color Usage Rules

Jangan menggunakan semantic colors hanya untuk dekorasi.

Contoh:

```text
Warning
→ Rush Project
```

bukan:

```text
Warning color
→ random card decoration
```

Color harus memiliki semantic meaning.

---

## 7. Typography

Gunakan satu primary UI font family.

Hierarchy:

```text
Display
H1
H2
H3
H4
Body
Body Small
Caption
Label
```

Recommended baseline:

```text
H1 → 32px
H2 → 24px
H3 → 20px
H4 → 18px

Body → 14–16px
Small → 13px
Caption → 12px
```

Actual font family dapat ditentukan saat implementation.

---

## 8. Typography Weight

```text
Regular
Medium
Semibold
Bold
```

Usage:

```text
Regular
→ body

Medium
→ labels

Semibold
→ section heading

Bold
→ important values
```

---

## 9. Number & Currency Typography

Harga dan angka penting menggunakan visual emphasis.

Contoh:

```text
Final Price
Rp7.410.000
```

`Rp7.410.000` harus lebih prominent daripada label.

Untuk estimation:

```text
53h
7 days
```

menggunakan numeric emphasis.

---

## 10. Spacing System

Gunakan spacing scale yang konsisten.

Base unit:

```text
4px
```

Scale:

```text
4
8
12
16
20
24
32
40
48
64
```

Contoh:

```text
Page padding → 24px
Section gap → 24px
Form field gap → 16px
Component internal gap → 8–12px
```

---

## 11. Layout

### Application

Desktop:

```text
Sidebar
+
Main Content
```

Recommended:

```text
Sidebar width
≈ 240px
```

Main content menggunakan responsive width.

---

### Page Container

Maximum content width dapat digunakan untuk page yang membutuhkan readability.

Contoh:

```text
max-width
≈ 1200–1400px
```

Calculation dan quotation pages dapat menggunakan width lebih besar dibanding settings.

---

## 12. Border Radius

Gunakan radius yang konsisten.

Baseline:

```text
Small
6px

Medium
8px

Large
12px

Card
12px

Modal
16px
```

Jangan mencampur banyak radius tanpa alasan.

---

## 13. Border

Border digunakan untuk:

```text
Card separation
Input boundaries
Table separation
Section separation
```

Gunakan border yang subtle.

Jangan menggunakan border pada semua element apabila hierarchy sudah cukup jelas melalui spacing.

---

## 14. Shadow

Shadow digunakan terutama untuk elevated UI:

```text
Dropdown
Popover
Modal
Drawer
Floating menu
```

Card normal tidak harus menggunakan shadow.

---

## 15. Button System

Variants:

```text
Primary
Secondary
Ghost
Danger
```

#### Primary

Untuk main action:

```text
Create Project
Calculate
Save
Finalize
```

#### Secondary

Untuk secondary action:

```text
Cancel
Back
Change
```

#### Ghost

Untuk low-emphasis action:

```text
View
More
```

#### Danger

Untuk destructive action:

```text
Deactivate
Remove
```

---

## 16. Button States

Setiap button harus mempunyai:

```text
Default
Hover
Active
Focus
Disabled
Loading
```

Loading:

```text
[ Saving... ]
```

Button tidak menerima duplicate click selama loading.

---

## 17. Input System

Input variants:

```text
Text
Email
Password
Number
Currency
Search
Textarea
Date
```

States:

```text
Default
Focus
Filled
Error
Disabled
Read-only
```

---

## 18. Form Layout

Form menggunakan:

```text
Label
Input
Help Text
Error Message
```

Contoh:

```text
Developer Rate *

[ 75000 ]

Enter your rate per working hour.
```

Error:

```text
Developer Rate *

[ -5000 ]

Rate cannot be negative.
```

---

## 19. Select System

Single selection:

```text
Select
```

Multiple:

```text
MultiSelect
```

Searchable select digunakan ketika option jumlahnya banyak.

---

## 20. Feature Option UI

`SINGLE`:

```text
○ Midtrans
○ Xendit
○ Stripe
○ Custom
```

`MULTIPLE`:

```text
☐ Refund
☐ Webhook
☐ Subscription
```

Selection state harus terlihat jelas.

---

## 21. Card System

Card digunakan untuk grouping informasi.

Common cards:

```text
Stat Card
Feature Card
Pricing Card
Summary Card
Configuration Card
```

Card tidak boleh terlalu banyak nested.

---

## 22. Pricing Summary

Final pricing menggunakan hierarchy khusus:

```text
Subtotal
Rp5.700.000

Margin
30%
+Rp1.710.000

Rush Fee
Rp0

────────────────

Final Price
Rp7.410.000
```

Final Price harus menjadi visual focal point.

---

## 23. Status Badge

Status:

```text
Draft
Final
Active
Inactive
Normal
Rush
Quoted
Accepted
Rejected
```

Badge menggunakan semantic colors.

Contoh:

```text
DRAFT
FINAL
RUSH
```

Status tidak boleh hanya dibedakan melalui color.

Gunakan text yang jelas.

---

## 24. Project Status

Visual hierarchy:

```text
DRAFT
QUOTED
ACCEPTED
REJECTED
```

Status badge harus terlihat pada:

```text
Project List
Project Detail
Quotation Context
Dashboard Summary
```

---

## 25. Quotation Status

```text
DRAFT
FINAL
```

`FINAL` harus terlihat sebagai locked/read-only state.

Contoh:

```text
🔒 FINAL
```

Icon hanya menjadi supplementary indicator; text tetap harus ada.

---

## 26. Alert System

Alert variants:

```text
Info
Success
Warning
Error
```

Example rush:

```text
⚠ Rush Project

The requested deadline is earlier than the estimated completion.
```

Alert tidak boleh menggantikan validation message.

---

## 27. Modal

Modal digunakan untuk:

```text
Confirmation
Small Form
Important Decision
```

Modal structure:

```text
Title

Description

Content

Footer
[Cancel] [Confirm]
```

Finalize quotation menggunakan modal confirmation.

---

## 28. Drawer

Drawer digunakan untuk:

```text
Quick Configuration
Edit Form
Add Hosting
Add Maintenance
Feature Configuration
```

Drawer digunakan ketika user tetap perlu melihat context dari underlying page.

---

## 29. Table System

Table digunakan untuk desktop-heavy list:

```text
Projects
Features
Quotations
```

Table structure:

```text
Header
Rows
Actions
Pagination (if needed)
```

Table harus memiliki:

```text
Hover
Selected
Loading
Empty
```

---

## 30. Mobile List Transformation

Pada mobile:

```text
Table
↓
Card/List
```

Informasi utama tetap ditampilkan:

```text
Name
Status
Main Value
Primary Action
```

Secondary metadata dapat dipindahkan ke detail.

---

## 31. Empty State

Empty state terdiri dari:

```text
Icon/Illustration (optional)
Title
Description
Primary Action
```

Contoh:

```text
No Projects Yet

Create your first project to start estimating.

[Create Project]
```

---

## 32. Skeleton Loading

Skeleton digunakan untuk content loading.

Contoh:

```text
████████████
██████
████████████████
```

Jangan menggunakan blank page selama data sedang dimuat.

---

## 33. Toast

Toast digunakan untuk short-lived feedback.

Contoh:

```text
✓ Project created successfully.
✓ Feature updated successfully.
✓ Quotation finalized.
```

Toast error:

```text
Failed to save changes.
```

Informasi penting yang membutuhkan keputusan tidak boleh hanya menggunakan toast.

---

## 34. Confirmation Patterns

#### Destructive

```text
Deactivate Feature?

This feature will no longer be available for new projects.
Existing project data will remain intact.

[Cancel]
[Deactivate]
```

#### Finalization

```text
Finalize Quotation?

This quotation will become read-only.

[Cancel]
[Finalize]
```

---

## 35. Icons

Icons digunakan sebagai supporting visual, bukan satu-satunya information source.

Contoh:

```text
Edit → icon + tooltip
Delete → icon + tooltip
Warning → icon + text
Lock → icon + FINAL
```

Icon-only buttons wajib memiliki accessible label.

---

## 36. Accessibility

Minimum:

```text
Keyboard Navigation
Visible Focus
Semantic HTML
Accessible Labels
Error Association
Modal Focus Trap
Color Contrast
```

Status tidak boleh dikomunikasikan hanya melalui color.

---

## 37. Motion

Motion digunakan secara minimal.

Use cases:

```text
Modal open
Drawer open
Toast enter/exit
Sidebar collapse
Loading
```

Durasi pendek dan tidak boleh menghambat interaction.

---

## 38. Responsive Breakpoints

Baseline:

```text
Mobile
< 640px

Tablet
640px – 1023px

Desktop
≥ 1024px
```

Breakpoint dapat disesuaikan saat implementation berdasarkan layout actual.

---

## 39. Density

Karena aplikasi merupakan productivity tool:

```text
Information Density
= Medium
```

Tujuannya bukan membuat UI terlalu spacious seperti marketing website, tetapi tetap memberikan whitespace agar data tidak terasa padat.

---

## 40. Dashboard Visual Hierarchy

Urutan perhatian:

```text
Primary KPI
↓
Recent Activity
↓
Quick Actions
```

Dashboard tidak boleh dipenuhi chart yang tidak memiliki nilai bisnis.

---

## 41. Calculator Visual Hierarchy

Calculator merupakan core feature.

Priority:

```text
1. Final Price
2. Timeline
3. Cost Breakdown
4. Feature Estimation
5. Configuration Details
```

Final Price harus mudah ditemukan tanpa scrolling panjang.

---

## 42. Quotation Visual Hierarchy

Quotation:

```text
Client
↓
Project
↓
Scope
↓
Timeline
↓
Pricing
↓
Revision Policy
```

Final Price merupakan primary financial information.

---

## 43. Internal vs Client-Facing UI

Authenticated internal UI boleh menampilkan:

```text
Internal Cost
Developer Rate
Margin
Rush Calculation
Provider Details
```

Quotation client-facing:

```text
Client
Project
Scope
Timeline
Price
Maintenance
Revision Policy
```

Internal cost tidak boleh bocor ke client-facing output.

---

## 44. Design Token Principle

Component tidak boleh langsung menggunakan arbitrary value apabila token tersedia.

Jangan:

```text
margin: 17px
```

jika design system sudah memiliki:

```text
spacing-md
spacing-lg
```

Gunakan semantic design tokens.

---

## 45. Component Naming

Gunakan nama berdasarkan responsibility.

Contoh:

```text
PricingSummary
FeatureSelector
FeatureConfiguration
QuotationStatusBadge
ProjectHeader
HostingList
MaintenanceSelector
```

Hindari nama terlalu generik:

```text
Box
Thing
DataComponent
Wrapper2
```

---

## 46. Component Variants

Variant harus digunakan jika behavior atau visual meaning sama tetapi tingkat emphasis berbeda.

Contoh:

```text
Button
├── primary
├── secondary
├── ghost
└── danger
```

Jangan membuat component berbeda hanya karena perbedaan warna kecil.

---

## 47. Visual Consistency

Hal berikut harus konsisten:

```text
Button height
Input height
Card padding
Heading spacing
Table row height
Modal structure
Badge shape
Error presentation
Toast presentation
```

---

## 48. Design System Boundaries

Design System menentukan:

```text
Tokens
Components
Variants
States
Responsive Patterns
Accessibility Patterns
```

Design System tidak menentukan:

```text
Business Rules
API
Database
Calculation
Quotation Logic
```

---

## 49. MVP Component Inventory

Core components:

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

Domain components:

```text
ProjectHeader
ProjectInformation
FeatureSelector
FeatureConfiguration
FeatureEstimate
DesignSelector
HostingSelector
MaintenanceSelector
CalculationSummary
PricingBreakdown
QuotationHeader
QuotationStatusBadge
QuotationHistory
```

---

## 50. Definition of Design System Complete

Design System dianggap cukup untuk MVP ketika:

```text
Color Tokens
Typography
Spacing
Radius
Borders
Shadows
Buttons
Inputs
Forms
Cards
Tables
Badges
Alerts
Toast
Modal
Drawer
Loading
Empty
Error
Responsive Rules
Accessibility Rules
```

sudah didefinisikan dan dapat digunakan secara konsisten oleh seluruh frontend.

---

## 51. Final Design Principle

```text
User should immediately understand:

Where am I?
What am I editing?
What does it cost?
How long will it take?
What happens if I finalize?
```

Visual design harus membantu menjawab pertanyaan tersebut tanpa membuat UI menjadi berlebihan.
