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

## Phase 6 and 7 endpoint mapping

The frontend also registers the following service paths:

- `/teacher-assignments`, `/timetables`, `/attendance`
- `/examinations`, `/marks`, `/grades`, `/results`, `/report-cards`
- `/fee-categories`, `/fee-structures`, `/student-fees`
- `/installments`, `/fee-collections`, `/receipts`
- `/discounts`, `/scholarships`, `/expenses`, `/accounts`

These endpoints and field names are integration assumptions derived from the project prompt because the backend repository was not available. Verify routes and DTOs before production use; no mock API or mock success data is used.

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
