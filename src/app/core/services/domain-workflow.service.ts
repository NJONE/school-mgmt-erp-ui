import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { ApiClientService } from './api-client.service';

export interface StudentPromotionRequest {
  studentId: string;
  classId: string;
  sectionId: string;
  academicSessionId: string;
}

export interface StudentAttendanceBatchRequest {
  date: string;
  records: Array<{
    studentId: string;
    classId: string;
    sectionId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    remarks?: string;
  }>;
}

export interface FeePaymentRequest {
  studentId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank' | 'card' | 'upi' | 'cheque';
  referenceNumber?: string;
}

export interface NotificationSendRequest {
  recipientId: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'push' | 'in-app';
  subject?: string;
  body: string;
}

export interface DocumentGenerationRequest {
  templateId: string;
  documentType: string;
}

@Injectable({ providedIn: 'root' })
export class DomainWorkflowService {
  private readonly api = inject(ApiClientService);

  promoteStudent(request: StudentPromotionRequest): Observable<unknown> {
    return this.api.post<unknown>(API_ENDPOINTS.workflows.studentPromotions, request);
  }

  recordStudentAttendance(request: StudentAttendanceBatchRequest): Observable<unknown> {
    return this.api.post<unknown>(API_ENDPOINTS.workflows.studentAttendance, request);
  }

  recordFeePayment(request: FeePaymentRequest): Observable<unknown> {
    return this.api.post<unknown>(API_ENDPOINTS.workflows.feePayments, request);
  }

  publishExamination(examinationId: string): Observable<unknown> {
    return this.api.post<unknown>(API_ENDPOINTS.workflows.publishExamination(examinationId));
  }

  processPayrollRun(payrollRunId: string): Observable<unknown> {
    return this.api.post<unknown>(API_ENDPOINTS.workflows.processPayrollRun(payrollRunId));
  }

  sendNotification(request: NotificationSendRequest): Observable<unknown> {
    return this.api.post<unknown>(API_ENDPOINTS.workflows.notificationsSend, request);
  }

  generateDocument(request: DocumentGenerationRequest): Observable<unknown> {
    return this.api.post<unknown>(API_ENDPOINTS.workflows.documentsGenerate, request);
  }
}