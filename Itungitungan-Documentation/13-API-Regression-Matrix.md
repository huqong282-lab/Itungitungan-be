# API Regression Matrix

Inventory audited against `10-API-Contract.md` and the routes registered by `src/app/app.ts` on 2026-10-20. Paths below are complete API paths. Every row names a route test that invokes the route through Fastify `app.inject()`; service or repository unit tests are not counted as endpoint coverage.

## Coverage summary

| Point | Covered | Partial | Missing | Total |
|---|---:|---:|---:|---:|
| Before BE-050 (BE-049 baseline) | 52 | 1 | 0 | 53 |
| After BE-050 | 52 | 1 | 0 | 53 |

The BE-049 baseline had 46 test files and 274 tests. BE-050 adds this maintained inventory; it does not duplicate endpoint assertions already present in the route suites. Logout is partial because its unauthenticated behavior conflicts with the documented authentication requirement (see [Known contract gap](#known-contract-gap)). No test coverage percentage is reported because the package has no coverage script/configuration.

## Inventory

| Method + Path | Auth | Test file | Main asserted scenarios | Status |
|---|---|---|---|---|
| GET `/api/health` | Public | `tests/health.test.ts` | `200`, `{data: {status: "ok"}}` without a session | Covered |
| POST `/api/auth/register` | Public | `tests/auth-register.test.ts` | Valid registration/cookie, invalid body, duplicate email, sensitive fields excluded | Covered |
| POST `/api/auth/login` | Public | `tests/auth-login.test.ts` | Valid credentials/cookie, invalid credentials use same `401` response, invalid input | Covered |
| GET `/api/auth/me` | Required | `tests/auth-me.test.ts` | Session identity and safe user response; missing session `401` | Covered |
| POST `/api/auth/logout` | Required by contract; optional in implementation | `tests/auth-logout.test.ts` | Revokes valid session and clears cookie; also asserts no-session request returns `204` | Partial |
| GET `/api/settings` | Required | `tests/settings-routes.test.ts` | Owner settings response; missing session `401` | Covered |
| PATCH `/api/settings` | Required | `tests/settings-routes.test.ts` | Updates current user's settings; invalid values rejected; missing session `401` | Covered |
| GET `/api/features` | Required | `tests/features-routes.test.ts` | Owner list and unauthorized request | Covered |
| GET `/api/features/:id` | Required | `tests/features-routes.test.ts` | Owned feature and option hierarchy; foreign feature hidden as `404` | Covered |
| POST `/api/features` | Required | `tests/features-routes.test.ts` | Creates under session owner; rejects `userId` body input | Covered |
| PATCH `/api/features/:id` | Required | `tests/features-routes.test.ts` | Owner update; foreign resource hidden | Covered |
| PATCH `/api/features/:id/status` | Required | `tests/features-routes.test.ts` | Owner status change; foreign resource hidden | Covered |
| POST `/api/features/:featureId/options` | Required | `tests/features-routes.test.ts` | Create option; missing/foreign parent and no-session errors | Covered |
| PATCH `/api/features/:featureId/options/:optionId` | Required | `tests/features-routes.test.ts` | Update option; missing/mismatched parent and option errors | Covered |
| POST `/api/features/:featureId/options/:optionId/values` | Required | `tests/features-routes.test.ts` | Create value; hierarchy ownership and input validation | Covered |
| PATCH `/api/features/:featureId/options/:optionId/values/:valueId` | Required | `tests/features-routes.test.ts` | Update value; mismatched IDs and invalid input | Covered |
| GET `/api/designs` | Required | `tests/designs-routes.test.ts` | Owner-scoped list and query filters; no-session `401` | Covered |
| GET `/api/designs/:id` | Required | `tests/designs-routes.test.ts` | Owned read; foreign ID `404` | Covered |
| POST `/api/designs` | Required | `tests/designs-routes.test.ts` | Owner create; forbidden ownership field and invalid input | Covered |
| PATCH `/api/designs/:id` | Required | `tests/designs-routes.test.ts` | Owner update; foreign ID hidden | Covered |
| PATCH `/api/designs/:id/status` | Required | `tests/designs-routes.test.ts` | Deactivate owned design; foreign ID hidden | Covered |
| GET `/api/hosting-plans` | Required | `tests/hosting-plans-routes.test.ts` | Owner-scoped list and filters; no-session `401` | Covered |
| GET `/api/hosting-plans/:id` | Required | `tests/hosting-plans-routes.test.ts` | Owned read; foreign ID hidden | Covered |
| POST `/api/hosting-plans` | Required | `tests/hosting-plans-routes.test.ts` | Owner create; ownership fields, enum, and prices validated | Covered |
| PATCH `/api/hosting-plans/:id` | Required | `tests/hosting-plans-routes.test.ts` | Owner update; foreign ID and disallowed fields rejected | Covered |
| PATCH `/api/hosting-plans/:id/status` | Required | `tests/hosting-plans-routes.test.ts` | Deactivate owned plan; foreign ID hidden | Covered |
| GET `/api/maintenance-plans` | Required | `tests/maintenance-plans-routes.test.ts` | Owner-scoped list and filters; no-session `401` | Covered |
| GET `/api/maintenance-plans/:id` | Required | `tests/maintenance-plans-routes.test.ts` | Owned read; foreign ID hidden | Covered |
| POST `/api/maintenance-plans` | Required | `tests/maintenance-plans-routes.test.ts` | Owner create; enum, price, and extra fields validated | Covered |
| PATCH `/api/maintenance-plans/:id` | Required | `tests/maintenance-plans-routes.test.ts` | Owner update; empty and forbidden-field patches rejected | Covered |
| PATCH `/api/maintenance-plans/:id/status` | Required | `tests/maintenance-plans-routes.test.ts` | Activate/deactivate; foreign ID hidden | Covered |
| GET `/api/projects` | Required | `tests/projects-routes.test.ts` | Owner list with pagination metadata | Covered |
| GET `/api/projects/:id` | Required | `tests/projects-routes.test.ts` | Owned detail; foreign ID `404` | Covered |
| POST `/api/projects` | Required | `tests/projects-routes.test.ts` | Create; required fields, types, deadline, and owner assignment | Covered |
| PATCH `/api/projects/:id` | Required | `tests/projects-routes.test.ts` | Owner update; forbidden fields and foreign ID rejected | Covered |
| POST `/api/projects/:projectId/features` | Required | `tests/project-features-routes.test.ts` | Create relation; inactive/foreign resources rejected; duplicate `409` | Covered |
| PATCH `/api/projects/:projectId/features/:projectFeatureId` | Required | `tests/project-features-routes.test.ts` | Update allowed fields; invalid hours and cross-parent relation rejected | Covered |
| DELETE `/api/projects/:projectId/features/:projectFeatureId` | Required | `tests/project-features-routes.test.ts` | Remove relation with `204`; foreign parent hidden | Covered |
| PUT `/api/projects/:projectId/features/:projectFeatureId/selections` | Required | `tests/project-features-routes.test.ts` | Replace selections; selection rules and cross-parent relation validated | Covered |
| PUT `/api/projects/:projectId/design` | Required | `tests/project-designs-routes.test.ts` | Set design; foreign/inactive resources and invalid body rejected | Covered |
| DELETE `/api/projects/:projectId/design` | Required | `tests/project-designs-routes.test.ts` | Remove assignment with `204`; authentication required | Covered |
| POST `/api/projects/:projectId/hostings` | Required | `tests/project-hostings-routes.test.ts` | Add plan or client-provided hosting; invalid plan/combination rejected | Covered |
| PATCH `/api/projects/:projectId/hostings/:hostingId` | Required | `tests/project-hostings-routes.test.ts` | Update relation; foreign relation, invalid fields rejected | Covered |
| DELETE `/api/projects/:projectId/hostings/:hostingId` | Required | `tests/project-hostings-routes.test.ts` | Remove relation with `204`; missing/foreign relation hidden | Covered |
| POST `/api/projects/:projectId/maintenances` | Required | `tests/project-maintenances-routes.test.ts` | Add plan; duplicate, foreign plan/project, and extra fields rejected | Covered |
| DELETE `/api/projects/:projectId/maintenances/:maintenanceId` | Required | `tests/project-maintenances-routes.test.ts` | Remove attached relation with `204`; foreign parent hidden | Covered |
| POST `/api/projects/:projectId/calculate` | Required | `tests/calculations-routes.test.ts` | Contract response, optional margin input, invalid inputs, foreign project `404`, no-session `401` | Covered |
| POST `/api/projects/:projectId/quotations` | Required | `tests/quotations-routes.test.ts` | Draft response/status; duplicate draft, invalid body, foreign project, no-session errors | Covered |
| POST `/api/quotations/:quotationId/finalize` | Required | `tests/quotations-routes.test.ts` | Finalize draft; already-final, foreign/missing, invalid ID, no-session behavior | Covered |
| POST `/api/quotations/:quotationId/recalculate` | Required | `tests/quotations-routes.test.ts` | Recalculate draft; final, foreign/missing, no-session behavior | Covered |
| GET `/api/quotations` | Required | `tests/quotations-routes.test.ts` | Owner list, filters and pagination; invalid query and foreign project filter rejected | Covered |
| GET `/api/quotations/:quotationId` | Required | `tests/quotations-routes.test.ts` | Snapshot detail shape; foreign/missing ID and no-session errors | Covered |
| GET `/api/quotations/:quotationId/pdf` | Required | `tests/quotations-routes.test.ts` | PDF response/download name; no-session and foreign/missing IDs rejected | Covered |

## Known contract gap

`10-API-Contract.md` says `POST /api/auth/logout` requires authentication. `src/modules/auth/auth.routes.ts` has no authentication pre-handler, `auth.controller.ts` treats a missing token as a successful no-op, and `tests/auth-logout.test.ts` asserts `204` without a session. This is an observable contract mismatch. The current behavior is recorded without changing it in this testing-only task; decide in a separate contract/implementation change whether logout should require a valid session.

## Test execution model

Route suites use `app.inject()` and test-provided services/repositories, primarily in-memory. `tests/core-workflows.integration.test.ts` additionally runs actual auth, settings, and project services with in-memory repository adapters. These tests verify HTTP routing, validation, controller/service orchestration, and response handling; they do not exercise Prisma/PostgreSQL. No PostgreSQL test database was available during this audit.
