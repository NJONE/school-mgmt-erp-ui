import { Injectable, signal } from '@angular/core';

export interface ContextOption {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class TenantContextService {
  readonly tenantId = signal<string | null>(localStorage.getItem('erp.tenantId'));
  readonly schoolId = signal<string | null>(localStorage.getItem('erp.schoolId'));
  readonly branchId = signal<string | null>(localStorage.getItem('erp.branchId'));
  readonly academicSessionId = signal<string | null>(localStorage.getItem('erp.academicSessionId'));

  readonly schools = signal<ContextOption[]>([]);
  readonly branches = signal<ContextOption[]>([]);
  readonly academicSessions = signal<ContextOption[]>([]);

  setTenant(id: string | null): void {
    this.tenantId.set(id);
    this.persist('erp.tenantId', id);
  }

  setSchool(id: string | null): void {
    this.schoolId.set(id);
    this.branchId.set(null);
    this.persist('erp.schoolId', id);
    localStorage.removeItem('erp.branchId');
  }

  setBranch(id: string | null): void {
    this.branchId.set(id);
    this.persist('erp.branchId', id);
  }

  setAcademicSession(id: string | null): void {
    this.academicSessionId.set(id);
    this.persist('erp.academicSessionId', id);
  }

  private persist(key: string, value: string | null): void {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  }
}
