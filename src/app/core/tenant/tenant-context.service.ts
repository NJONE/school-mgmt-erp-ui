import { Injectable, signal } from '@angular/core';

export interface ContextOption {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class TenantContextService {
  readonly tenantId = signal<string | null>(this.read('erp.tenantId'));
  readonly schoolId = signal<string | null>(this.read('erp.schoolId'));
  readonly branchId = signal<string | null>(this.read('erp.branchId'));
  readonly academicSessionId = signal<string | null>(this.read('erp.academicSessionId'));

  readonly tenants = signal<ContextOption[]>([]);
  readonly schools = signal<ContextOption[]>([]);
  readonly branches = signal<ContextOption[]>([]);
  readonly academicSessions = signal<ContextOption[]>([]);
  readonly revision = signal(0);

  setTenant(id: string | null): void {
    this.tenantId.set(id);
    this.persist('erp.tenantId', id);
    this.schoolId.set(null);
    this.branchId.set(null);
    this.academicSessionId.set(null);
    this.persist('erp.schoolId', null);
    this.persist('erp.branchId', null);
    this.persist('erp.academicSessionId', null);
    this.schools.set([]);
    this.branches.set([]);
    this.academicSessions.set([]);
    this.changed();
  }

  setSchool(id: string | null): void {
    this.schoolId.set(id);
    this.branchId.set(null);
    this.academicSessionId.set(null);
    this.persist('erp.schoolId', id);
    this.persist('erp.branchId', null);
    this.persist('erp.academicSessionId', null);
    this.branches.set([]);
    this.academicSessions.set([]);
    this.changed();
  }

  setBranch(id: string | null): void {
    this.branchId.set(id);
    this.persist('erp.branchId', id);
    this.changed();
  }

  setAcademicSession(id: string | null): void {
    this.academicSessionId.set(id);
    this.persist('erp.academicSessionId', id);
    this.changed();
  }

  private persist(key: string, value: string | null): void {
    if (typeof localStorage === 'undefined') return;
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  }

  private read(key: string): string | null {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  }

  private changed(): void {
    this.revision.update((value) => value + 1);
  }
}
