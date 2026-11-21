# School Management ERP UI

Angular 22 standalone frontend for the School Management ERP platform.

## Development

```bash
npm install
npm start
```

The application uses a configurable API base URL:

- Development: `src/environments/environment.development.ts`
- Production: `src/environments/environment.production.ts`
- Central endpoints: `src/app/core/config/api-endpoints.ts`

## Phase 1 and 2 status

Implemented:

- Standalone Angular routing and strict TypeScript configuration
- Responsive ERP shell with sidebar, topbar, mobile navigation, and theme switching
- Reactive login screen
- JWT auth state, login/logout API, auth guard, permission guard, and HTTP interceptors
- Tenant, school, branch, and academic-session signal context
- Central API client and centralized HTTP error mapping
- Lazy-loaded dashboard and management route shells
- Unauthorized and backend-integration placeholder states

## Backend integration

The `school-mgmt-erp-service` repository is not available in this workspace. The frontend uses the documented `/api/v1` endpoint structure, but no route or response contract has been verified.

Before Phase 3 or module integration, verify:

- Authentication routes and DTOs
- Pagination format
- Lookup endpoints
- Upload endpoints
- Validation error shape
- School, branch, and tenant headers or query parameters

Full details are in [docs/API-INTEGRATION.md](docs/API-INTEGRATION.md).
