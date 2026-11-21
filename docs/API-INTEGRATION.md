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

These names follow the endpoint structure documented in `PROMPT.txt`. The backend repository is not present in this workspace, so route availability, DTO fields, lookup response shapes, and pagination contracts for Users and Permissions in particular remain to be verified against the actual service.

## Phase 6 and 7 endpoint mapping

The frontend also registers the following service paths:

- `/teacher-assignments`, `/timetables`, `/attendance`
- `/examinations`, `/marks`, `/grades`, `/results`, `/report-cards`
- `/fee-categories`, `/fee-structures`, `/student-fees`
- `/installments`, `/fee-collections`, `/receipts`
- `/discounts`, `/scholarships`, `/expenses`, `/accounts`

These endpoints and field names are integration assumptions derived from the project prompt because the backend repository was not available. Verify routes and DTOs before production use; no mock API or mock success data is used.

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

- `X-School-ID`
- `X-Branch-ID`
- `X-Academic-Session-ID`

These values are UI context only. Backend authorization and tenant isolation remain mandatory.
