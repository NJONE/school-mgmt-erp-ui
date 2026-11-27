import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { DomainWorkflowService } from './domain-workflow.service';

describe('DomainWorkflowService backend routes', () => {
  it('uses the verified workflow paths and payloads', () => {
    const api = { post: vi.fn(() => of({ success: true, data: {} })) };
    TestBed.configureTestingModule({
      providers: [DomainWorkflowService, { provide: ApiClientService, useValue: api }],
    });
    const workflows = TestBed.inject(DomainWorkflowService);

    workflows.promoteStudent({ studentId: 's1', classId: 'c1', sectionId: 'sec1', academicSessionId: 'as1' }).subscribe();
    workflows.recordStudentAttendance({ date: '2026-11-26', records: [{ studentId: 's1', classId: 'c1', sectionId: 'sec1', status: 'present' }] }).subscribe();
    workflows.recordFeePayment({ studentId: 's1', amount: 125, paymentDate: '2026-11-26T09:00:00.000Z', paymentMethod: 'cash' }).subscribe();
    workflows.publishExamination('exam1').subscribe();
    workflows.processPayrollRun('run1').subscribe();
    workflows.sendNotification({ recipientId: 'u1', channel: 'in-app', body: 'Notice' }).subscribe();
    workflows.generateDocument({ templateId: 'template1', documentType: 'enrollment' }).subscribe();

    expect(api.post).toHaveBeenNthCalledWith(1, '/workflows/student-promotions', {
      studentId: 's1', classId: 'c1', sectionId: 'sec1', academicSessionId: 'as1',
    });
    expect(api.post).toHaveBeenNthCalledWith(2, '/workflows/attendance/student', {
      date: '2026-11-26',
      records: [{ studentId: 's1', classId: 'c1', sectionId: 'sec1', status: 'present' }],
    });
    expect(api.post).toHaveBeenNthCalledWith(3, '/workflows/fees/payments', {
      studentId: 's1', amount: 125, paymentDate: '2026-11-26T09:00:00.000Z', paymentMethod: 'cash',
    });
    expect(api.post).toHaveBeenNthCalledWith(4, '/workflows/examinations/exam1/publish');
    expect(api.post).toHaveBeenNthCalledWith(5, '/workflows/payroll/runs/run1/process');
    expect(api.post).toHaveBeenNthCalledWith(6, '/workflows/notifications/send', {
      recipientId: 'u1', channel: 'in-app', body: 'Notice',
    });
    expect(api.post).toHaveBeenNthCalledWith(7, '/workflows/documents/generate', {
      templateId: 'template1', documentType: 'enrollment',
    });
  });
});