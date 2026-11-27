# API Integration Contract

## Configuration

Set `apiBaseUrl` in `src/environments/environment.ts` or the production environment. Components must not define API URLs.

All endpoint paths are centralized in `src/app/core/config/api-endpoints.ts`. `ApiClientService` adds the base URL and supports GET, POST, PUT, PATCH, and DELETE.

## Interceptors

- `authInterceptor` adds the bearer access token.
- `contextInterceptor` adds optional tenant, school, branch, and academic-session headers.
- `errorInterceptor` handles authentication failures centrally.

## Authentication

The frontend currently expects:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/change-password`

The login response adapter currently expects:

```text
{
  success: boolean,
  data: {
    user: AuthUser,
    tokens: AuthTokens
  },
  message?: string
}
```

This contract must be replaced or adapted after inspecting the backend repository.

## Paginated responses

`PaginatedData<T>` defines:

```text
{
  items: T[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

If the backend uses different names or nesting, adapt responses in feature services rather than components.

## Service repository status

The `NJONE/school-mgmt-erp-service` repository is available, but the current `master` branch contains only `README.md` and no route, DTO, or controller source. API and pagination contracts are therefore not verifiable from the service repository in its present state.

## Phase 5 endpoint mapping

The following paths are centralized in `src/app/core/config/api-endpoints.ts`:

- `/schools`
- `/branches`
- `/academic-sessions`
- `/classes`
- `/sections`
- `/subjects`
- `/students`
- `/parents`
- `/staff`
- `/users`
- `/roles`
- `/permissions`

These names follow the endpoint structure documented in `MASTER DEVELOPMENT PROMPT.txt`. The backend repository is not present in this workspace, so route availability, DTO fields, lookup response shapes, and pagination contracts remain unverified.

## Phase 5 traceability

The registered entities use the shared metadata-driven CRUD route and engine. Endpoint names and request/response contracts below are assumptions, not backend-verified integrations.

| Entity | UI route | Endpoint assumption | Focused coverage |
| --- | --- | --- | --- |
| Schools | `/management/schools` | `/schools` | Registry metadata |
| Branches | `/management/branches` | `/branches` | Registry metadata |
| Academic sessions | `/management/academic-sessions` | `/academic-sessions` | Registry metadata |
| Classes | `/management/classes` | `/classes` | Registry metadata |
| Sections | `/management/sections` | `/sections` | Registry metadata |
| Subjects | `/management/subjects` | `/subjects` | Registry metadata |
| Students | `/management/students` | `/students` | Registry metadata and filter definitions |
| Parents | `/management/parents` | `/parents` | Registry metadata |
| Staff | `/management/staff` | `/staff` | Registry metadata |
| Users | `/management/users` | `/users` | Registry metadata |
| Roles | `/management/roles` | `/roles` | Registry metadata |
| Permissions | `/management/permissions` | `/permissions` | Registry metadata |

All entities currently share list, create, edit, details, delete, search, pagination, and permission-aware actions through the CRUD engine. The student list filters are `academicSessionId`, `classId`, `sectionId`, `gender`, `status`, `admissionDate`, and `admissionType`; the first three load their options from the corresponding lookup endpoints. Query parameter names and date-filter semantics still require service verification.

**Release blocker:** the backend repository and its route/DTO documentation were unavailable in this workspace. Do not treat Phase 5 API mappings as verified or release these flows against production until endpoint availability, authorization, DTO fields, lookup response shapes, pagination, and filter semantics are checked against `school-mgmt-erp-service`.

## Phase 6 and 7 endpoint mapping

The frontend also registers the following service paths:

- `/teacher-assignments`, `/timetables`, `/attendance`
- `/examinations`, `/marks`, `/grades`, `/results`, `/report-cards`
- `/fee-categories`, `/fee-structures`, `/student-fees`
- `/installments`, `/fee-collections`, `/receipts`
- `/discounts`, `/scholarships`, `/expenses`, `/accounts`

These endpoints and field names are integration assumptions derived from the project prompt because the backend repository was not available. Verify routes and DTOs before production use; no mock API or mock success data is used.

## Phase 6 traceability

The academic records below use the shared management route and CRUD engine. The route and endpoint mappings are assumptions until verified against `school-mgmt-erp-service`.

| Entity | UI route | Endpoint assumption | Academic filters | Focused coverage |
| --- | --- | --- | --- | --- |
| Teacher assignments | `/management/teacher-assignments` | `/teacher-assignments` | Session, class, section, subject, teacher, status | Registry/filter metadata |
| Timetables | `/management/timetables` | `/timetables` | Class, section, day, subject, teacher, status | Registry/filter metadata and time input types |
| Student attendance | `/management/attendance` | `/attendance` | Date, class, section, student, attendance status | Registry/filter metadata |
| Examinations | `/management/examinations` | `/examinations` | Session, class, start date, status | Registry/filter metadata |
| Marks | `/management/marks` | `/marks` | Student, examination, subject | Registry/filter metadata |
| Grades | `/management/grades` | `/grades` | Search and pagination | Registry metadata |
| Results | `/management/results` | `/results` | Student, examination, result status | Registry/filter metadata |
| Report cards | `/management/report-cards` | `/report-cards` | Session, class, student, examination, status | Registry/filter metadata |

Generic list/search/filter/pagination/create/edit/details/delete flows are available for these records. Lookup-backed filters use existing academic lookup endpoints. Timetable start/end fields use time-only controls.

**Unverified workflows:** the current backend contract does not establish batch attendance capture/corrections, exam-subject scheduling, batch mark entry, result calculation/publication, or report-card generation/publication endpoints. These must not be simulated through client-side calculations or presented as completed workflows. Confirm their routes, DTOs, permissions, and transactional behavior before adding dedicated actions. Filter query names and lookup pagination/response shapes also require verification.

## Phase 7 traceability

The finance entities below use shared metadata-driven CRUD. Endpoint and query parameter mappings remain assumptions until verified against `school-mgmt-erp-service`.

| Entity | UI route | Endpoint assumption | Finance filters | Focused coverage |
| --- | --- | --- | --- | --- |
| Fee categories | `/management/fee-categories` | `/fee-categories` | Status | Registry metadata |
| Fee structures | `/management/fee-structures` | `/fee-structures` | Session, class, fee category, status | Registry/filter metadata |
| Student fees | `/management/student-fees` | `/student-fees` | Student, fee structure, due date, status | Registry/filter metadata |
| Installments | `/management/installments` | `/installments` | Student fee, due date, status | Registry/filter metadata |
| Fee collections | `/management/fee-collections` | `/fee-collections` | Student, student fee, payment date, method | Registry/filter metadata |
| Receipts | `/management/receipts` | `/receipts` | Student, payment date, method, status | Registry/filter metadata |
| Discounts | `/management/discounts` | `/discounts` | Type, status | Registry/filter metadata |
| Scholarships | `/management/scholarships` | `/scholarships` | Student, session, status | Registry/filter metadata |
| Expenses | `/management/expenses` | `/expenses` | Account, expense date, status | Registry/filter metadata |
| Accounts | `/management/accounts` | `/accounts` | Type, status | Registry/filter metadata |

Lookup-backed filters load options from the existing registered endpoints; all filter fields correspond to fields already present in the entity forms. The shared CRUD UI supports list/search/filter/pagination/create/edit/details/delete, but does not calculate balances, post payments, generate receipts, apply discounts, approve scholarships, or reconcile ledger entries.

**Release blocker:** payment collection/voiding, receipt issuance, refund handling, scholarship/discount approval, installment reconciliation, and account transaction/ledger workflows need verified backend endpoints, DTOs, permissions, and transaction semantics. Do not treat generic record CRUD as completing these finance operations or infer accounting calculations in the frontend.

## Phase 8 traceability

The current operational screens use the shared management route and generic CRUD metadata. These route and endpoint mappings are assumptions pending backend verification.

| Module | UI route | Endpoint assumption | Filters | Focused coverage |
| --- | --- | --- | --- | --- |
| HR records | `/management/hr` | `/hr` | Staff, record type, start/end date, status | Registry/filter metadata |
| Payroll | `/management/payroll` | `/payroll` | Staff, pay period, payment date, status | Registry/filter metadata |
| Library | `/management/library` | `/library` | Author, category, availability | Registry/filter metadata |
| Transport | `/management/transport` | `/transport` | Route, driver, status | Registry/filter metadata |
| Inventory | `/management/inventory` | `/inventory` | Category, status | Registry/filter metadata |
| Assets | `/management/assets` | `/assets` | Category, location, purchase date, status | Registry/filter metadata |
| Communication | `/management/communication` | `/communication` | Type, audience, status | Registry/filter metadata |
| Documents | `/management/documents` | `/documents` | Category, owner type/ID, file type, status | Registry/filter metadata |
| Reports | `/management/reports` | `/reports` | Type, format, generated date, status | Registry/filter metadata |

These records currently share list/search/filter/pagination/create/edit/details/delete behavior. The registered aggregate endpoints do not establish dedicated leave types/policies/requests, staff attendance, payroll components or payslips, library issue/return, transport routes/stops/assignments/maintenance, purchase orders or stock movements, asset assignments/maintenance, communication templates/threads/messages, document uploads/access control, or report-generation/export workflows.

**Release blocker:** verify the actual backend resources, DTOs, permissions, and transaction workflows before exposing these operations. In particular, do not implement issue/return, stock movement, payroll calculation, document upload/access control, or report generation as client-side CRUD shortcuts. The endpoint and query parameter assumptions above are not confirmed by the service contract.

## Phase 9 traceability

SaaS administration uses the shared management route and generic CRUD metadata. Endpoint and query parameter mappings below are prompt-derived assumptions, not verified service contracts.

| Entity | UI route | Endpoint assumption | Filters | Focused coverage |
| --- | --- | --- | --- | --- |
| Tenants | `/management/tenants` | `/tenants` | Domain, status | Registry/filter metadata |
| Subscription plans | `/management/subscription-plans` | `/subscription-plans` | Billing cycle, status | Registry/filter metadata |
| Subscriptions | `/management/subscriptions` | `/subscriptions` | Tenant, plan, start/end dates, status | Registry/filter metadata |
| Billing | `/management/billing` | `/billing` | Tenant, invoice/due dates, status | Registry/filter metadata |
| Usage | `/management/usage` | `/usage` | Tenant, metric, period, recorded date | Registry/filter metadata |
| Platform configuration | `/management/platform-configuration` | `/platform-configuration` | Group, public/private | Registry/filter metadata and boolean serialization |

These entities currently support shared list/search/filter/pagination/create/edit/details/delete behavior. The SaaS endpoints must be restricted by backend authorization and platform-admin permissions; the UI permission check is not an authorization boundary. Platform configuration responses must not expose secrets to the browser or to school-level users.

**Release blocker:** backend contracts are still needed for tenant onboarding and feature flags, plan entitlements/pricing, subscription activation/cancellation, invoice/payment/credit workflows, usage aggregation and limits, and platform configuration schema/access rules. Generic CRUD does not complete billing or subscription lifecycle workflows. Verify endpoint routes, DTOs, role/permission policies, tenant isolation, and secret handling before production use.

## UI workflows requiring contract verification

The following UI behaviors use endpoint/field assumptions and must be checked against the service before release:

- Dashboard filters attendance by `date` and fee collections by `paymentDate`; staff totals use `status=active`.
- Global search fans out a debounced `search` query to the registered student, parent, staff, class, fee-collection, and document endpoints. Each endpoint must support the shared query and pagination parameters.
- The notification center reads `GET /api/v1/notifications` and currently recognizes array or `{ items }` data with `title`, `message`/`body`, `createdAt`, and read-state fields. Mark-read actions are intentionally absent until their endpoint and contract are known.
- Dynamic import submits a file to `POST <entity-endpoint>/import` and currently supports CSV/JSON selection. The endpoint, accepted formats, preview, validation, and result format are unverified.
- CSV/JSON export is generated from the currently loaded page in the browser; it is not a full filtered/server-side export.
- Student form sections include profile, admission, guardian, contact, medical, transport, document-notes, and additional fields. These request property names, lookup relationships, and validation rules need backend DTO verification.

Do not treat these assumptions as a confirmed API contract. Adapt the centralized endpoint and typed service layer after inspecting the backend routes and DTOs.

## Phase 8 and 9 endpoint mapping

The following paths are centrally mapped for frontend integration:

- `/hr`, `/payroll`
- `/library`, `/transport`, `/inventory`, `/assets`
- `/communication`, `/documents`, `/reports`
- `/tenants`, `/subscription-plans`, `/subscriptions`
- `/billing`, `/usage`, `/platform-configuration`

These paths and module DTOs remain unverified until the actual backend repository or route documentation is available.

## Context headers

The context interceptor sends:

- `X-Tenant-ID`
- `X-School-ID`
- `X-Branch-ID`
- `X-Academic-Session-ID`

Changing tenant clears the selected school, branch, and academic session. Changing school clears branch and session selections. These values are UI context only; backend authorization and tenant isolation remain mandatory.
