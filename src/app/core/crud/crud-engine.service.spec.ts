import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClientService } from '../services/api-client.service';
import { EntityMetadata } from '../metadata/metadata.models';
import { CrudEngine } from './crud-engine.service';

describe('CrudEngine', () => {
  const entity: EntityMetadata = {
    key: 'students',
    label: 'Student',
    pluralLabel: 'Students',
    endpoint: '/entities/students',
    fields: [],
  };

  it('passes query filters through and normalizes a paginated API response', () => {
    const api = {
      get: vi.fn(() => of({
        success: true,
        data: [{ id: 'student-1' }],
        meta: { page: 1, pageSize: 10, totalRecords: 14, totalPages: 2 },
      })),
    };
    TestBed.configureTestingModule({
      providers: [CrudEngine, { provide: ApiClientService, useValue: api }],
    });

    const crud = TestBed.inject(CrudEngine);
    let result: unknown;
    crud.list(entity, { page: 1, limit: 10, filters: { date: '2026-11-26' } }).subscribe((page) => {
      result = page;
    });

    expect(api.get).toHaveBeenCalledWith('/entities/students', {
      page: 1,
      pageSize: 10,
      filters: '{"date":"2026-11-26"}',
    });
    expect(result).toEqual({
      items: [{ id: 'student-1' }],
      pagination: { page: 1, limit: 10, total: 14, totalPages: 2 },
    });
  });

  it('surfaces unsupported response formats instead of showing an empty list', () => {
    const api = { get: vi.fn(() => of({ success: true, data: { unexpected: [] } })) };
    TestBed.configureTestingModule({
      providers: [CrudEngine, { provide: ApiClientService, useValue: api }],
    });

    const crud = TestBed.inject(CrudEngine);
    let errorMessage = '';
    crud.list(entity, { page: 1, limit: 10 }).subscribe({
      error: (error: Error) => { errorMessage = error.message; },
    });

    expect(errorMessage).toBe('The service returned a list response in an unsupported format.');
  });

  it('uses the service query vocabulary and excludes sensitive fields from list projections', () => {
    const api = {
      get: vi.fn(() => of({
        success: true,
        data: [{ id: 'student-1', admissionDate: '2026-01-01' }],
        meta: { page: 2, pageSize: 25, totalRecords: 26, totalPages: 2 },
      })),
    };
    const scopedEntity: EntityMetadata = {
      ...entity,
      fields: [
        { key: 'id', label: 'ID' },
        { key: 'admissionDate', label: 'Admission date' },
        { key: 'status', label: 'Status' },
        { key: 'medicalConditions', label: 'Medical conditions', sensitive: true },
      ],
    };
    TestBed.configureTestingModule({
      providers: [CrudEngine, { provide: ApiClientService, useValue: api }],
    });

    TestBed.inject(CrudEngine).list(scopedEntity, {
      page: 2,
      limit: 25,
      sortBy: 'admissionDate',
      sortDirection: 'desc',
      filters: { status: 'active' },
    }).subscribe();

    expect(api.get).toHaveBeenCalledWith('/entities/students', {
      page: 2,
      pageSize: 25,
      sortBy: 'admissionDate',
      sortOrder: 'desc',
      filters: '{"status":"active"}',
      fields: 'id,admissionDate,status',
    });
  });
});
