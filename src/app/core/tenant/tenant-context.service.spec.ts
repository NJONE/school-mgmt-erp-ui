import { TestBed } from '@angular/core/testing';
import { TenantContextService } from './tenant-context.service';

describe('TenantContextService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('clears dependent school, branch, and session selections when the tenant changes', () => {
    const context = TestBed.inject(TenantContextService);
    context.setTenant('tenant-1');
    context.setSchool('school-1');
    context.setBranch('branch-1');
    context.setAcademicSession('session-1');
    context.schools.set([{ id: 'school-1', name: 'North School' }]);
    context.branches.set([{ id: 'branch-1', name: 'Main Branch' }]);
    context.academicSessions.set([{ id: 'session-1', name: '2026–27' }]);
    const revision = context.revision();

    context.setTenant('tenant-2');

    expect(context.tenantId()).toBe('tenant-2');
    expect(context.schoolId()).toBeNull();
    expect(context.branchId()).toBeNull();
    expect(context.academicSessionId()).toBeNull();
    expect(context.schools()).toEqual([]);
    expect(context.branches()).toEqual([]);
    expect(context.academicSessions()).toEqual([]);
    expect(context.revision()).toBeGreaterThan(revision);
  });
});
