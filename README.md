# School Management ERP UI

Angular 22 standalone frontend for a multi-tenant School Management ERP.

## Development

```bash
npm install
npm start
```

Configure the API base URL in `src/environments/environment.development.ts` and `src/environments/environment.production.ts`. Endpoint paths are centralized in `src/app/core/config/api-endpoints.ts`.

## Implemented UI

- Responsive application shell with grouped, permission-filtered navigation, tenant/school/branch/academic-session selectors, system/light/dark themes, global record search, notifications, and account actions.
- Dashboard with context-scoped student, staff, attendance, and fee-record counts, recent admissions, permission-aware quick actions, and explicit unavailable/restricted states.
- Reusable metadata-driven list/detail/form screens for every entity currently registered in `EntityMetadataRegistry`.
- CRUD screens support server search, filters, sorting, pagination/page size, column visibility, row selection, permission-gated actions, confirmed deletion, CSV/JSON export, and API-backed import.
- Dynamic forms support validation, lookup loading/error states, and sections. Student forms use the personal, admission, parent, contact, medical, transport, documents, and additional-information sections.
- Shared feedback, status-badge, and confirmation-dialog components; a Preferences page provides theme selection and the backend-backed change-password workflow.
- Login, forgot-password request, session-aware routing, permission checks, tenant context headers, centralized API error handling, and responsive layouts.

## Feature coverage and backend limitations

School, people, academic, attendance, examination, finance, HR/payroll, library, transport, inventory/assets, communication, documents, reports, and SaaS administration records are available through the shared CRUD engine when their metadata is registered.

The `school-mgmt-erp-service` repository is not available in this workspace. Therefore, endpoint paths, request/response DTOs, filters, permissions, and pagination assumptions have not been verified. In particular, several prompt workflows (for example student promotion/transfer, staff leave workflows, library issue/return, transport assignments, purchase orders, and report generation) need their actual backend routes and contracts before they can be safely implemented as operational actions. The current generic screens must not be treated as proof that those workflows are complete.

The student tab fields, dashboard filters, global-search categories, notification list shape, and import/export endpoints also require verification against the service. File upload, import preview/template validation, server-side export, notification read actions, and specialized domain workflows are not implemented until the required contracts are known. No successful API response is mocked.

See [docs/API-INTEGRATION.md](docs/API-INTEGRATION.md) for the current assumptions and integration checklist.

## Verification

```bash
npm test -- --watch=false
npm run build
```
