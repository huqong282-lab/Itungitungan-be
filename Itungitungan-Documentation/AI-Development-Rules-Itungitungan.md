# Itungitungan — AI Development Rules

---

## 1. Project Context

Itungitungan adalah aplikasi untuk membantu developer menghitung harga project web, hosting, maintenance, dan membuat quotation untuk client.

Project ini adalah real project, bukan tutorial atau prototype sementara.

Semua implementasi harus mempertimbangkan maintainability dan perkembangan project jangka panjang.

---

## 2. Follow Project Documentation

Sebelum membuat perubahan yang berhubungan dengan architecture, database, API, atau business logic:

1. Periksa dokumentasi project yang relevan.
2. Ikuti keputusan yang sudah ditetapkan.
3. Jangan membuat keputusan yang bertentangan dengan dokumentasi tanpa alasan yang jelas.
4. Jika requirement bertentangan dengan dokumentasi, jelaskan conflict sebelum mengubah architecture.

Dokumentasi utama yang harus dianggap sebagai source of truth:

```text
PRD
ERD
PRISMA-SCHEMA
BUSINESS-RULES
USER-FLOW
API-CONTRACT
FE/BE TASKS
```

---

## 3. Do Not Guess Requirements

Jika requirement belum jelas:

- Jangan mengarang behaviour.
- Jangan membuat business rule sendiri.
- Jangan mengubah database schema berdasarkan asumsi.
- Jangan menambahkan fitur yang tidak diminta.

Jika keputusan tersebut berdampak pada architecture atau business logic, tanyakan atau jelaskan asumsi terlebih dahulu.

---

## 4. Separation of Concerns

Setiap bagian sistem harus memiliki tanggung jawab yang jelas.

Backend:

```text
server.ts
→ menjalankan server

app/
→ merakit aplikasi

routes/controllers
→ HTTP layer

modules
→ feature/business logic

infrastructure
→ database dan external services

shared
→ reusable code yang benar-benar shared
```

Frontend juga harus menjaga pemisahan antara:

```text
UI
State
API communication
Business logic
Reusable components
```

Jangan membuat satu file menjadi tempat semua logic.

---

## 5. Do Not Overengineer

Gunakan solusi paling sederhana yang memenuhi requirement.

Jangan menambahkan:

- abstraction yang belum diperlukan
- design pattern hanya untuk terlihat professional
- generic utility berlebihan
- dependency tambahan tanpa kebutuhan
- architecture kompleks tanpa alasan

Prinsip:

```text
Simple
→ Clear
→ Maintainable
→ Extend only when needed
```

---

## 6. Preserve Existing Architecture

Jangan mengubah architecture yang sudah berjalan hanya karena ada alternatif yang menurut AI lebih bagus.

Jika ingin mengubah:

- framework
- database structure
- folder structure
- API contract
- authentication strategy
- deployment architecture

jelaskan terlebih dahulu:

1. Masalah yang ingin diselesaikan.
2. Dampak perubahan.
3. Alternatif yang tersedia.
4. Kenapa perubahan diperlukan.

---

## 7. Minimal Change

Ketika mengerjakan satu task:

- Ubah hanya bagian yang diperlukan.
- Jangan melakukan refactor besar tanpa requirement.
- Jangan menghapus kode yang masih digunakan.
- Jangan mengubah behaviour fitur lain.
- Jangan mengubah dependency tanpa alasan.

Tujuan setiap task adalah:

```text
Implement requirement
+
Preserve existing functionality
```

---

## 8. Type Safety

Project menggunakan TypeScript.

Hindari:

```ts
any
```

kecuali benar-benar diperlukan dan memiliki alasan yang jelas.

Prioritaskan:

- explicit types
- inferred types jika jelas
- schema validation
- type-safe API contracts

Jangan menggunakan type assertion untuk menyembunyikan error.

---

## 9. Validation

Input dari external source harus dianggap tidak terpercaya.

Contoh:

```text
HTTP request
User input
Query parameter
Request body
Environment variable
External API response
```

Harus divalidasi sebelum digunakan.

Backend menggunakan TypeBox sesuai architecture project.

---

## 10. Error Handling

Error harus ditangani secara konsisten.

Jangan:

- silently ignore errors
- menggunakan empty catch tanpa alasan
- mengembalikan error internal mentah ke client
- membuat format error berbeda-beda tanpa alasan

Gunakan global error handling dan API error contract yang sudah ditentukan.

---

## 11. Security

Selalu pertimbangkan security ketika membuat fitur.

Jangan:

- expose secret
- commit `.env`
- hardcode password
- hardcode API key
- expose database credentials
- trust user input
- bypass authentication/authorization tanpa requirement

Sensitive configuration harus berasal dari environment/configuration system.

---

## 12. Database

Database schema harus mengikuti ERD dan Prisma schema yang telah disepakati.

Jangan mengubah schema hanya untuk mempermudah implementasi satu endpoint.

Perhatikan:

- relation
- constraint
- unique
- nullable
- ownership
- cascade behaviour
- business rules

Setiap perubahan database harus dipertimbangkan dampaknya terhadap existing data dan application logic.

---

## 13. User Data Isolation

Data user harus terisolasi.

User A tidak boleh dapat mengakses atau memodifikasi data milik User B kecuali memang ada requirement yang secara eksplisit mengizinkannya.

Ownership harus diperiksa pada backend.

Jangan hanya mengandalkan frontend untuk menyembunyikan data.

---

## 14. API Contract

API harus mengikuti API contract yang telah ditentukan.

Perhatikan:

```text
HTTP method
URL
request
response
status code
authentication
validation
error format
```

Jangan mengubah API contract secara diam-diam.

Jika perubahan diperlukan, update contract terlebih dahulu atau jelaskan perubahan tersebut.

---

## 15. Testing

Setiap fitur penting harus dapat diuji.

Gunakan testing yang sesuai:

```text
Unit Test
→ logic kecil/isolated

Integration Test
→ interaction antar bagian sistem

API Test
→ endpoint behaviour
```

Untuk Fastify gunakan `app.inject()` untuk integration/API testing jika sesuai.

Test harus memverifikasi behaviour, bukan hanya coverage.

---

## 16. Verification

Setelah perubahan, jalankan verification yang relevan.

Minimal backend:

```bash
npm run typecheck
```

Jika terdapat test:

```bash
npm test
```

Jika terdapat database migration:

```text
verify migration
verify schema
verify application compatibility
```

Jangan mengatakan task selesai sebelum acceptance criteria terpenuhi.

---

## 17. Git

Gunakan branch berdasarkan task.

Contoh:

```text
feature/be-012-fastify-foundation
feature/be-013-health-endpoint
feature/fe-001-project-setup
```

Commit harus menjelaskan perubahan.

Contoh:

```text
feat(be-013): add health endpoint
fix(auth): handle invalid credentials
refactor(project): simplify project service
test(be-013): add health endpoint integration test
```

Jangan mencampurkan perubahan unrelated dalam satu task tanpa alasan.

---

## 18. Dependencies

Sebelum menambahkan dependency baru:

1. Periksa apakah functionality sudah tersedia.
2. Pertimbangkan apakah dependency benar-benar diperlukan.
3. Jangan menambahkan library hanya karena lebih nyaman.
4. Pastikan dependency sesuai dengan stack project.

---

## 19. Code Style

Ikuti style yang sudah digunakan project.

Jangan mencampur:

```text
ESM + CommonJS
different naming conventions
different architectural patterns
different error formats
```

Jika project sudah memiliki convention, ikuti convention tersebut.

---

## 20. Explain Important Decisions

Jika implementasi membutuhkan keputusan yang tidak obvious, jelaskan:

```text
Problem
→ Decision
→ Reason
→ Impact
```

Jangan hanya mengubah code tanpa menjelaskan keputusan architecture yang signifikan.

---

## 21. AI Must Not Silently Change Scope

AI tidak boleh secara diam-diam:

- menambahkan feature
- mengubah business rule
- mengubah API
- mengubah schema
- mengganti dependency
- melakukan refactor besar
- mengubah architecture

hanya karena menurut AI hal tersebut "lebih baik".

Jika diperlukan, jelaskan terlebih dahulu.

---

## 22. Task Completion

Setiap task harus dievaluasi berdasarkan:

```text
Requirement
↓
Implementation
↓
Testing
↓
Verification
↓
Acceptance Criteria
```

Jangan menentukan task selesai hanya karena kode berhasil compile.

---

## 23. Priority Order

Jika terdapat conflict antara keputusan, gunakan prioritas:

```text
1. Explicit user requirement
2. Project business rules
3. Project documentation
4. Existing architecture
5. Framework/library best practices
6. AI preference
```

AI preference memiliki prioritas paling rendah.

---

## 24. Core Principle

AI harus bertindak sebagai developer yang membantu menjaga project tetap konsisten, bukan sebagai developer yang bebas mendesain ulang project.

Prinsip utama:

```text
Understand before changing.

Follow the existing contract.

Do not guess business rules.

Keep responsibilities separated.

Prefer simple solutions.

Minimize unrelated changes.

Protect user data.

Test important behaviour.

Verify before declaring done.
```
