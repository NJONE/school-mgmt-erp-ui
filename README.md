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

## Phase 3 and 4 status

Implemented:

- Metadata types and entity metadata registry
- Field, form, table, filter, and relationship metadata
- Dynamic form, table, filter, and lookup engines
- Generic CRUD engine for list, search, filters, sorting, pagination, create, edit, details, delete, bulk delete, import, and CSV/JSON export
- Dynamic management route replacing placeholder screens

## Phase 5 status

Implemented metadata-driven management screens for:

- Schools
- Branches
- Academic sessions
- Classes
- Sections
- Subjects
- Students
- Parents
- Staff
- Users
- Roles
- Permissions

The backend repository was not available in this workspace. The module endpoints are centralized and should be verified against the actual service route definitions before production use.

## Phase 6 and 7 status

Implemented metadata-driven screens for academic and finance modules:

- Teacher assignments, timetable, attendance
- Examinations, marks, grades, results, report cards
- Fee categories, fee structures, student fees
- Installments, fee collection, receipts
- Discounts, scholarships, expenses, accounts

## Phase 8 and 9 status

Implemented metadata-driven screens for:

- HR and payroll
- Library, transport, inventory, assets
- Communication, documents, reports
- Tenant management, subscription plans, subscriptions
- Billing, usage, platform configuration

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
