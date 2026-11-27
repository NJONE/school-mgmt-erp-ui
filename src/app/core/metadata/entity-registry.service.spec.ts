import { EntityMetadataRegistry } from './entity-registry.service';
import { DynamicFilterEngine } from './dynamic-filter.service';
import { of } from 'rxjs';

describe('EntityMetadataRegistry Phase 5 entities', () => {
  const registry = new EntityMetadataRegistry();
  const coreEntities = [
    'schools',
    'branches',
    'academic-sessions',
    'classes',
    'sections',
    'subjects',
    'students',
    'parents',
    'staff',
    'users',
    'roles',
    'permissions',
  ];

  it('registers each core entity with a usable CRUD definition', () => {
    for (const key of coreEntities) {
      const metadata = registry.get(key);

      expect(metadata, `${key} metadata`).toBeDefined();
      expect(metadata?.endpoint.startsWith('/')).toBe(true);
      expect(metadata?.form?.fields.length).toBeGreaterThan(0);
      expect(metadata?.table?.columns.length).toBeGreaterThan(0);
      expect(metadata?.permissions).toEqual({
        list: `${key}.view`,
        create: `${key}.create`,
        update: `${key}.edit`,
        delete: `${key}.delete`,
      });
    }
  });

  it('exposes all required student list filters', () => {
    const student = registry.get('students');
    const filterKeys = student?.filters?.map((filter) => filter.key) ?? [];

    expect(filterKeys).toEqual(expect.arrayContaining([
      'academicSessionId',
      'classId',
      'sectionId',
      'gender',
      'status',
      'admissionDate',
      'admissionType',
    ]));
    expect(student?.filters?.find((filter) => filter.key === 'academicSessionId')?.lookup?.endpoint).toBe('/entities/academicSessions');
    expect(student?.filters?.find((filter) => filter.key === 'classId')?.lookup?.endpoint).toBe('/entities/classes');
    expect(student?.filters?.find((filter) => filter.key === 'sectionId')?.lookup?.endpoint).toBe('/entities/sections');
  });
});

describe('EntityMetadataRegistry Phase 6 entities', () => {
  const registry = new EntityMetadataRegistry();
  const academicEntities = [
    'teacher-assignments',
    'timetables',
    'attendance',
    'examinations',
    'marks',
    'grades',
    'results',
    'report-cards',
  ];

  it('registers each academic entity with CRUD metadata and permissions', () => {
    for (const key of academicEntities) {
      const metadata = registry.get(key);

      expect(metadata, `${key} metadata`).toBeDefined();
      expect(metadata?.endpoint.startsWith('/')).toBe(true);
      expect(metadata?.form?.fields.length).toBeGreaterThan(0);
      expect(metadata?.table?.columns.length).toBeGreaterThan(0);
      expect(metadata?.permissions?.list).toBe(`${key}.view`);
    }
  });

  it('provides contextual filters for academic records', () => {
    const requiredFilters: Record<string, string[]> = {
      'teacher-assignments': ['academicSessionId', 'classId', 'sectionId', 'subjectId', 'teacherId'],
      timetables: ['classId', 'sectionId', 'day', 'subjectId', 'teacherId'],
      attendance: ['date', 'classId', 'sectionId', 'studentId', 'status'],
      examinations: ['academicSessionId', 'classId', 'startDate', 'status'],
      marks: ['studentId', 'examinationId', 'subjectId'],
      results: ['studentId', 'examinationId', 'resultStatus'],
      'report-cards': ['academicSessionId', 'classId', 'studentId', 'examinationId', 'status'],
    };

    for (const [entityKey, expectedKeys] of Object.entries(requiredFilters)) {
      const filterKeys = registry.get(entityKey)?.filters?.map((filter) => filter.key) ?? [];
      expect(filterKeys, `${entityKey} filters`).toEqual(expect.arrayContaining(expectedKeys));
    }

    expect(registry.get('teacher-assignments')?.filters?.find((filter) => filter.key === 'teacherId')?.lookup?.endpoint).toBe('/entities/staff');
    expect(registry.get('marks')?.filters?.find((filter) => filter.key === 'examinationId')?.lookup?.endpoint).toBe('/entities/examinations');
  });

  it('uses time-only inputs for timetable periods', () => {
    const fields = registry.get('timetables')?.form?.fields;

    expect(fields?.find((field) => field.key === 'startTime')?.type).toBe('time');
    expect(fields?.find((field) => field.key === 'endTime')?.type).toBe('time');
  });
});

describe('EntityMetadataRegistry Phase 7 finance entities', () => {
  const registry = new EntityMetadataRegistry();
  const financeEntities = [
    'fee-categories',
    'fee-structures',
    'student-fees',
    'installments',
    'fee-collections',
    'receipts',
    'discounts',
    'scholarships',
    'expenses',
    'accounts',
  ];

  it('registers each finance entity with CRUD metadata and permissions', () => {
    for (const key of financeEntities) {
      const metadata = registry.get(key);

      expect(metadata, `${key} metadata`).toBeDefined();
      expect(metadata?.endpoint.startsWith('/')).toBe(true);
      expect(metadata?.form?.fields.length).toBeGreaterThan(0);
      expect(metadata?.table?.columns.length).toBeGreaterThan(0);
      expect(metadata?.permissions?.list).toBe(`${key}.view`);
    }
  });

  it('provides finance filters for the relevant student, date, and account dimensions', () => {
    const requiredFilters: Record<string, string[]> = {
      'fee-structures': ['academicSessionId', 'classId', 'feeCategoryId', 'status'],
      'student-fees': ['studentId', 'feeStructureId', 'dueDate', 'status'],
      installments: ['studentFeeId', 'dueDate', 'status'],
      'fee-collections': ['studentId', 'studentFeeId', 'paymentDate', 'paymentMethod'],
      receipts: ['studentId', 'paymentDate', 'paymentMethod', 'status'],
      discounts: ['type', 'status'],
      scholarships: ['studentId', 'academicSessionId', 'status'],
      expenses: ['accountId', 'expenseDate', 'status'],
      accounts: ['type', 'status'],
    };

    for (const [entityKey, expectedKeys] of Object.entries(requiredFilters)) {
      const filterKeys = registry.get(entityKey)?.filters?.map((filter) => filter.key) ?? [];
      expect(filterKeys, `${entityKey} filters`).toEqual(expect.arrayContaining(expectedKeys));
    }

    expect(registry.get('fee-structures')?.filters?.find((filter) => filter.key === 'academicSessionId')?.lookup?.endpoint).toBe('/entities/academicSessions');
    expect(registry.get('fee-collections')?.filters?.find((filter) => filter.key === 'studentId')?.lookup?.endpoint).toBe('/entities/students');
    expect(registry.get('expenses')?.filters?.find((filter) => filter.key === 'accountId')?.lookup?.endpoint).toBe('/entities/accounts');
  });
});

describe('EntityMetadataRegistry Phase 8 other modules', () => {
  const registry = new EntityMetadataRegistry();
  const moduleEntities = [
    'hr',
    'payroll',
    'library',
    'transport',
    'inventory',
    'assets',
    'communication',
    'documents',
    'reports',
  ];

  it('registers each module with CRUD metadata and permissions', () => {
    for (const key of moduleEntities) {
      const metadata = registry.get(key);

      expect(metadata, `${key} metadata`).toBeDefined();
      expect(metadata?.endpoint.startsWith('/')).toBe(true);
      expect(metadata?.form?.fields.length).toBeGreaterThan(0);
      expect(metadata?.table?.columns.length).toBeGreaterThan(0);
      expect(metadata?.permissions?.list).toBe(`${key}.view`);
    }
  });

  it('exposes module-specific filters for operational records', () => {
    const requiredFilters: Record<string, string[]> = {
      hr: ['staffId', 'recordType', 'startDate', 'endDate', 'status'],
      payroll: ['staffId', 'payPeriod', 'paymentDate', 'status'],
      library: ['author', 'category', 'status'],
      transport: ['routeName', 'driverName', 'status'],
      inventory: ['category', 'status'],
      assets: ['category', 'location', 'purchaseDate', 'status'],
      communication: ['type', 'audience', 'status'],
      documents: ['category', 'ownerType', 'ownerId', 'documentType', 'status'],
      reports: ['type', 'format', 'generatedAt', 'status'],
    };

    for (const [entityKey, expectedKeys] of Object.entries(requiredFilters)) {
      const filterKeys = registry.get(entityKey)?.filters?.map((filter) => filter.key) ?? [];
      expect(filterKeys, `${entityKey} filters`).toEqual(expect.arrayContaining(expectedKeys));
    }

    expect(registry.get('hr')?.filters?.find((filter) => filter.key === 'staffId')?.lookup?.endpoint).toBe('/entities/staff');
  });
});

describe('EntityMetadataRegistry Phase 9 SaaS administration', () => {
  const registry = new EntityMetadataRegistry();
  const saasEntities = [
    'tenants',
    'subscription-plans',
    'subscriptions',
    'billing',
    'usage',
    'platform-configuration',
  ];

  it('registers each SaaS entity with CRUD metadata and permissions', () => {
    for (const key of saasEntities) {
      const metadata = registry.get(key);

      expect(metadata, `${key} metadata`).toBeDefined();
      expect(metadata?.endpoint.startsWith('/')).toBe(true);
      expect(metadata?.form?.fields.length).toBeGreaterThan(0);
      expect(metadata?.table?.columns.length).toBeGreaterThan(0);
      expect(metadata?.permissions?.list).toBe(`${key}.view`);
    }
  });

  it('exposes tenant, plan, billing, usage, and configuration filters', () => {
    const requiredFilters: Record<string, string[]> = {
      tenants: ['domain', 'status'],
      'subscription-plans': ['billingCycle', 'status'],
      subscriptions: ['tenantId', 'planId', 'startDate', 'endDate', 'status'],
      billing: ['tenantId', 'invoiceDate', 'dueDate', 'status'],
      usage: ['tenantId', 'metric', 'period', 'recordedAt'],
      'platform-configuration': ['group', 'isPublic'],
    };

    for (const [entityKey, expectedKeys] of Object.entries(requiredFilters)) {
      const filterKeys = registry.get(entityKey)?.filters?.map((filter) => filter.key) ?? [];
      expect(filterKeys, `${entityKey} filters`).toEqual(expect.arrayContaining(expectedKeys));
    }

    expect(registry.get('subscriptions')?.filters?.find((filter) => filter.key === 'tenantId')?.lookup?.endpoint).toBe('/entities/tenants');
    expect(registry.get('subscriptions')?.filters?.find((filter) => filter.key === 'planId')?.lookup?.endpoint).toBe('/entities/subscriptionPlans');
    expect(registry.get('platform-configuration')?.filters?.find((filter) => filter.key === 'isPublic')?.type).toBe('boolean');
  });

  it('preserves false values as active boolean filters', () => {
    const filters = registry.get('platform-configuration')?.filters ?? [];
    const serialized = new DynamicFilterEngine().serialize(filters, { isPublic: false });

    expect(serialized).toEqual({ isPublic: false });
  });
});

describe('EntityMetadataRegistry backend metadata adapter', () => {
  it('adapts service layouts and permissions without re-inventing entity fields', () => {
    const registry = new EntityMetadataRegistry();
    const api = {
      get: vi.fn(() => of({
        success: true,
        data: [{
          entityCode: 'studentAttendance',
          title: 'Student Attendance',
          pluralTitle: 'Student Attendances',
          description: 'Attendance records',
          module: 'attendance',
          apiEndpoint: '/entities/studentAttendance',
          primaryKey: 'id',
          fields: [
            { key: 'id', label: 'ID', type: 'readonly', readonly: true, visibleInForm: false },
            { key: 'date', label: 'Attendance Date', type: 'date', required: true, filterable: true },
            { key: 'status', label: 'Status', type: 'select', filterable: true, options: [{ label: 'Present', value: 'present' }] },
          ],
          permissions: [
            { action: 'read', permission: 'studentAttendance.read' },
            { action: 'create', permission: 'studentAttendance.create' },
          ],
          formLayout: { tabs: [{ title: 'Attendance', sections: [{ title: 'Record', fields: [{ field: 'date' }, { field: 'status' }] }] }] },
          tableLayout: { columns: [{ field: 'date' }, { field: 'status' }], pageSize: 20 },
          filterLayout: { fields: [{ field: 'date' }, { field: 'status' }] },
          features: { create: true, read: true, update: true, delete: true },
          export: { enabled: true, formats: ['csv'] },
          import: { enabled: false },
          displayField: 'date',
          searchFields: [],
          defaultPageSize: 20,
        }],
      })),
    };

    let adapted: ReturnType<EntityMetadataRegistry['all']> = [];
    registry.loadFromBackend(api as never).subscribe((entities) => { adapted = entities; });

    expect(api.get).toHaveBeenCalledWith('/metadata');
    expect(adapted).toHaveLength(1);
    expect(registry.get('student-attendance')).toMatchObject({
      key: 'student-attendance',
      apiEntityCode: 'studentAttendance',
      endpoint: '/entities/studentAttendance',
      permissions: { list: 'studentAttendance.read', create: 'studentAttendance.create' },
      table: { pageSize: 20, columns: [{ key: 'date' }, { key: 'status' }] },
    });
    expect(registry.get('student-attendance')?.form?.fields.map((field) => field.key)).toEqual(['date', 'status']);
    expect(registry.get('student-attendance')?.filters?.map((filter) => filter.key)).toEqual(['date', 'status']);
  });
});