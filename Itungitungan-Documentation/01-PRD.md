# Product Requirements Document (PRD)

## Product Name

Itungitungan — Configurable Project Estimation & Quotation System

---

## 1. Product Vision

Membantu developer dan freelancer membuat estimasi proyek website secara konsisten, cepat, dan terdokumentasi tanpa harus menghitung secara manual setiap kali menerima project baru.

Sistem bukan penentu harga.

Sistem adalah alat yang menjalankan aturan estimasi dan pricing yang dibuat oleh user.

---

## 2. Problem Statement

Saat menerima project baru, developer sering mengalami:

- Kesulitan menentukan harga proyek.
- Mengandalkan ingatan atau perhitungan manual.
- Estimasi yang tidak konsisten antar project.
- Sulit menghitung kombinasi fitur, desain, hosting, dan timeline.
- Sulit membuat quotation yang rapi dan profesional.
- Risiko underpricing atau overpricing.

---

## 3. Target User

### Primary User

- Freelancer
- Web Developer
- Full Stack Developer

### Secondary User

- Software House kecil
- Agency kecil
- Developer yang ingin memiliki template estimasi sendiri

---

## 4. Product Principles

**Principle 1**
Sistem tidak memiliki harga universal.

**Principle 2**
Setiap user memiliki konfigurasi pricing sendiri.

**Principle 3**
Semua estimasi dapat dikustomisasi.

**Principle 4**
Quotation harus dapat ditelusuri asal perhitungannya.

**Principle 5**
Harga lama tidak berubah ketika katalog diperbarui.

---

## 5. Goals

User dapat:

- Mengatur developer rate.
- Membuat katalog fitur.
- Menentukan estimasi fitur.
- Mengatur kompleksitas fitur.
- Mengatur katalog desain.
- Mengatur katalog hosting.
- Mengatur maintenance.
- Menghitung timeline.
- Menghasilkan quotation.
- Menyimpan histori quotation.

---

## 6. Non Goals (MVP)

Tidak termasuk:

- Invoice
- Pembayaran online
- CRM
- Team collaboration
- AI estimation
- WhatsApp integration
- Client portal

---

## 7. Core Workflow

```
Client Request
      ↓
Input Client Data
      ↓
Select Features
      ↓
Configure Feature Complexity
      ↓
Select Design
      ↓
Select Hosting
      ↓
Calculate Development
      ↓
Apply Buffer
      ↓
Calculate Timeline
      ↓
Apply Margin
      ↓
Check Deadline
      ↓
Generate Quotation
      ↓
Save Quotation
```

---

## 8. Estimation Model

### Developer Rate

Developer menentukan tarif sendiri.

Contoh:

> Rp 75.000 / jam

**Development Cost:**

```
Total Estimated Hours × Developer Rate
```

---

## 9. Feature Catalog

User dapat membuat katalog fitur.

Contoh:

- Authentication
- Dashboard
- CRUD
- Payment Gateway
- Notification
- Chat
- Search
- Admin Panel

Setiap fitur memiliki:

- Nama
- Deskripsi
- Kategori
- Status aktif
- Estimasi default

---

## 10. Complexity Engine

Fitur dapat memiliki konfigurasi kompleksitas.

**Contoh: Payment Gateway**

Provider:

- Midtrans
- Xendit
- Stripe
- Custom

Payment Type:

- One Time
- Subscription

Refund:

- Yes
- No

Webhook:

- Yes
- No

Sistem menghitung estimasi berdasarkan konfigurasi tersebut.

---

## 11. User-Controlled Rules

Aturan estimasi tidak ditentukan aplikasi.

User menentukan sendiri.

Contoh:

| Konfigurasi | Estimasi |
|---|---|
| Midtrans | 8 jam |
| Xendit | 10 jam |
| Stripe | 12 jam |
| Custom | 20 jam |
| Subscription | +8 jam |
| Refund | +4 jam |
| Webhook | +4 jam |

User lain dapat memiliki angka berbeda.

---

## 12. Project-Level Override

Estimasi dapat diubah pada project tertentu.

Contoh:

- Default: Payment Gateway = 24 jam
- Project A: Payment Gateway = 16 jam

Perubahan tidak mengubah katalog utama.

---

## 13. Design Catalog

Design memiliki biaya sendiri.

Contoh:

| Paket | Harga |
|---|---|
| Template | Rp 500.000 |
| Premium UI | Rp 1.500.000 |

Harga dapat diubah user.

---

## 14. Hosting Catalog

User dapat membuat katalog hosting.

Contoh:

- Shared Hosting
- VPS Basic
- VPS Medium
- Railway
- Vercel

Data yang disimpan:

- Nama
- Provider
- Internal Cost
- Client Price
- Billing Period

---

## 15. Client Provided Hosting

Jika client menyediakan hosting sendiri:

```
Hosting Cost = Rp 0
```

---

## 16. Maintenance

Maintenance merupakan biaya terpisah.

Contoh:

> Rp 500.000 / bulan

Ditampilkan terpisah dari biaya development.

---

## 17. Revision Policy

Default:

> 2x revisi gratis

Revisi berikutnya:

Biaya tambahan sesuai konfigurasi user.

---

## 18. Buffer System

Buffer digunakan untuk mengurangi risiko estimasi terlalu optimis.

Contoh:

| Item | Nilai |
|---|---|
| Development | 44 jam |
| Buffer | 20% |
| Final (dibulatkan ke atas) | 53 jam |

Hasil buffer selalu dibulatkan ke atas menjadi jam bulat (44 × 1.20 = 52.8, dibulatkan menjadi 53 jam).

Buffer dapat dikonfigurasi user.

---

## 19. Timeline Calculation

Aturan default:

> 8 jam = 1 hari kerja

Contoh:

```
53 jam ÷ 8 jam = 6.625 hari
Dibulatkan menjadi: 7 hari kerja
```

---

## 20. Deadline Validation

User dapat memasukkan deadline client.

Jika:

```
Deadline Client < Estimated Duration
```

Maka sistem menampilkan warning.

---

## 21. Rush Project

Jika deadline lebih cepat dari estimasi normal:

**Status:** Rush Project

**Opsional:** Rush Fee (%)

Nilai dapat diatur user.

---

## 22. Margin

Margin menggunakan satu persentase untuk seluruh project.

Contoh:

| Item | Nilai |
|---|---|
| Subtotal | Rp 5.000.000 |
| Margin | 30% |
| Final | Rp 6.500.000 |

---

## 23. Quotation

Quotation harus memuat:

### Client Information

- Client Name
- Project Name
- Logo
- Date

### Project Information

- Features
- Design
- Hosting
- Maintenance
- Revision Policy
- Estimated Duration

### Pricing

- Development Cost
- Design Cost
- Hosting Cost
- Maintenance Cost
- Margin
- Rush Fee (jika ada)
- Final Price

---

## 24. Quotation History

Sistem menyimpan:

- Quotation Number
- Client
- Project
- Created At
- Final Price
- Timeline

---

## 25. Pricing Snapshot

Ketika quotation dibuat:

Semua harga disimpan sebagai snapshot.

Perubahan katalog di masa depan tidak mengubah quotation lama.

---

## 26. Functional Requirements

| ID | Requirement |
|---|---|
| FR-001 | User dapat mengatur developer rate. |
| FR-002 | User dapat membuat feature catalog. |
| FR-003 | User dapat mengatur estimasi fitur. |
| FR-004 | User dapat membuat complexity rule. |
| FR-005 | User dapat membuat design catalog. |
| FR-006 | User dapat membuat hosting catalog. |
| FR-007 | User dapat membuat maintenance configuration. |
| FR-008 | User dapat membuat project. |
| FR-009 | User dapat memilih fitur project. |
| FR-010 | User dapat mengubah estimasi pada project. |
| FR-011 | Sistem menghitung development cost. |
| FR-012 | Sistem menghitung timeline. |
| FR-013 | Sistem menerapkan buffer. |
| FR-014 | Sistem menerapkan margin. |
| FR-015 | Sistem mendeteksi rush project. |
| FR-016 | Sistem membuat quotation. |
| FR-017 | Sistem menyimpan quotation. |
| FR-018 | User dapat melihat quotation lama. |

---

## 27. MVP Scope

Harus ada:

- Authentication
- Developer Settings
- Feature Catalog
- Complexity Rules
- Design Catalog
- Hosting Catalog
- Maintenance
- Project Calculator
- Buffer
- Margin
- Deadline Validation
- Rush Project Detection
- Quotation
- Quotation History
- Pricing Snapshot

---

## 28. Success Criteria

Produk dianggap berhasil jika user dapat:

1. Membuat konfigurasi estimasi sendiri.
2. Menghitung proyek tanpa kalkulator eksternal.
3. Mengetahui asal setiap angka pada quotation.
4. Membuat quotation dalam satu workflow.
5. Menyimpan dan membuka kembali quotation lama.

---

## 29. Core Value Proposition

> "Build your own estimation system once, then reuse it for every client project."
