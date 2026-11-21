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

## Context headers

The context interceptor sends:

- `X-School-ID`
- `X-Branch-ID`
- `X-Academic-Session-ID`

These values are UI context only. Backend authorization and tenant isolation remain mandatory.
