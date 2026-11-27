import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LookupEngine } from '../core/metadata/lookup.service';
import { EntityMetadataRegistry } from '../core/metadata/entity-registry.service';
import { ApiClientService } from '../core/services/api-client.service';
import { CrudEngine } from '../core/crud/crud-engine.service';
import { DomainWorkflowService } from '../core/services/domain-workflow.service';
import { API_ENDPOINTS } from '../core/config/api-endpoints';
import { ApiError } from '../core/models/api.models';
import { LookupOption } from '../core/metadata/metadata.models';
import { AuthService } from '../core/auth/auth.service';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface AttendanceForm {
  date: FormControl<string>;
  classId: FormControl<string>;
  sectionId: FormControl<string>;
}

@Component({
  selector: 'app-attendance-capture',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="attendance-page">
      <header class="page-heading">
        <div>
          <p>Attendance</p>
          <h1>Class attendance</h1>
          <span>Capture daily attendance for a class and section.</span>
        </div>
        <a routerLink="/management/student-attendance">Attendance records</a>
      </header>

      <form class="attendance-context" [formGroup]="form" (ngSubmit)="loadStudents(1)">
        <label>Date
          <input type="date" formControlName="date" (change)="invalidateRoster()" />
        </label>
        <label>Class
          <select formControlName="classId" (change)="onClassChanged()" [disabled]="classLoading()">
            <option value="">Select class</option>
            @for (option of classes(); track option.value) { <option [value]="option.value">{{ option.label }}</option> }
          </select>
          @if (classError()) { <small role="alert">{{ classError() }}</small> }
        </label>
        <label>Section
          <select formControlName="sectionId" (change)="invalidateRoster()" [disabled]="!form.controls.classId.value || sectionLoading()">
            <option value="">Select section</option>
            @for (option of sections(); track option.value) { <option [value]="option.value">{{ option.label }}</option> }
          </select>
          @if (sectionError()) { <small role="alert">{{ sectionError() }}</small> }
        </label>
        <button type="submit" [disabled]="form.invalid || loading()">{{ loading() ? 'Loading…' : 'Load students' }}</button>
      </form>

      @if (error()) { <p class="error-message" role="alert">{{ error() }}</p> }
      @if (success()) { <p class="success-message" role="status">{{ success() }}</p> }

      @if (loading()) {
        <section class="roster-state" role="status">Loading students…</section>
      } @else if (rosterLoaded() && !students().length) {
        <section class="roster-state">No students found for this class and section.</section>
      } @else if (students().length) {
        <section class="roster">
          <header class="roster-heading">
            <h2>Students</h2>
            <span>{{ total() }} records · Page {{ page() }} of {{ totalPages() }}</span>
          </header>
          @for (student of students(); track studentId(student)) {
            <div class="student-row">
              <div>
                <strong>{{ studentName(student) }}</strong>
                @if (student['admissionNumber']) { <small>{{ student['admissionNumber'] }}</small> }
              </div>
              <label [attr.for]="'attendance-' + studentId(student)">Status</label>
              <select [id]="'attendance-' + studentId(student)" [value]="statusFor(student)" (change)="setStatus(student, $event)">
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
            </div>
          }
          <footer class="roster-footer">
            <button type="button" [disabled]="page() <= 1 || loading()" (click)="loadStudents(page() - 1)">Previous</button>
            <button type="button" [disabled]="page() >= totalPages() || loading()" (click)="loadStudents(page() + 1)">Next</button>
            <button type="button" class="primary-action" [disabled]="saving() || pageRecorded()" (click)="recordPage()">
              {{ saving() ? 'Recording…' : pageRecorded() ? 'Page recorded' : 'Record this page' }}
            </button>
          </footer>
        </section>
      }
    </main>
  `,
  styleUrl: './attendance-capture.scss',
})
export class AttendanceCaptureComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly registry = inject(EntityMetadataRegistry);
  private readonly api = inject(ApiClientService);
  private readonly lookup = inject(LookupEngine);
  private readonly crud = inject(CrudEngine);
  private readonly workflows = inject(DomainWorkflowService);
  private readonly auth = inject(AuthService);

  readonly classes = signal<LookupOption[]>([]);
  readonly sections = signal<LookupOption[]>([]);
  readonly students = signal<Array<Record<string, unknown>>>([]);
  readonly statuses = signal<Record<string, AttendanceStatus>>({});
  readonly classLoading = signal(false);
  readonly sectionLoading = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly rosterLoaded = signal(false);
  readonly pageRecorded = signal(false);
  readonly page = signal(1);
  readonly total = signal(0);
  readonly totalPages = signal(1);
  readonly classError = signal('');
  readonly sectionError = signal('');
  readonly error = signal('');
  readonly success = signal('');

  readonly form = new FormGroup<AttendanceForm>({
    date: new FormControl(new Date().toISOString().slice(0, 10), { nonNullable: true, validators: [Validators.required] }),
    classId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    sectionId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    if (!this.auth.hasPermission('studentAttendance.create')) return;
    this.registry.loadFromBackend(this.api).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.loadClasses(),
      error: (error: ApiError) => this.error.set(error.message ?? 'Unable to load attendance metadata.'),
    });
  }

  onClassChanged(): void {
    this.sections.set([]);
    this.form.controls.sectionId.setValue('');
    this.invalidateRoster();
    const classId = this.form.controls.classId.value;
    if (!classId) return;
    this.sectionLoading.set(true);
    this.sectionError.set('');
    this.lookup.search({
      endpoint: API_ENDPOINTS.sections,
      labelField: 'name',
      valueField: 'id',
      params: { classId },
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (options) => { this.sections.set(options); this.sectionLoading.set(false); },
      error: (error: ApiError) => { this.sectionError.set(error.message); this.sectionLoading.set(false); },
    });
  }

  invalidateRoster(): void {
    this.rosterLoaded.set(false);
    this.students.set([]);
    this.statuses.set({});
    this.pageRecorded.set(false);
    this.success.set('');
  }

  loadStudents(page: number): void {
    const metadata = this.registry.get('students');
    if (!metadata || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.pageRecorded.set(false);
    this.crud.list<Record<string, unknown>>(metadata, {
      page,
      limit: 100,
      filters: {
        classId: this.form.controls.classId.value,
        sectionId: this.form.controls.sectionId.value,
      },
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.students.set(result.items);
        this.total.set(result.pagination.total);
        this.totalPages.set(result.pagination.totalPages);
        this.page.set(result.pagination.page);
        this.statuses.set(Object.fromEntries(result.items.map((student) => [String(this.studentId(student)), 'present'])));
        this.rosterLoaded.set(true);
        this.loading.set(false);
      },
      error: (error: ApiError) => { this.error.set(error.message); this.loading.set(false); },
    });
  }

  studentId(student: Record<string, unknown>): string {
    return String(student['id'] ?? '');
  }

  studentName(student: Record<string, unknown>): string {
    const name = student['fullName'];
    if (typeof name === 'string' && name) return name;
    return [student['firstName'], student['middleName'], student['lastName']]
      .filter((part): part is string => typeof part === 'string' && part.length > 0)
      .join(' ') || this.studentId(student);
  }

  statusFor(student: Record<string, unknown>): AttendanceStatus {
    return this.statuses()[this.studentId(student)] ?? 'present';
  }

  setStatus(student: Record<string, unknown>, event: Event): void {
    const status = (event.target as HTMLSelectElement).value as AttendanceStatus;
    this.statuses.update((current) => ({ ...current, [this.studentId(student)]: status }));
    this.pageRecorded.set(false);
  }

  recordPage(): void {
    if (!this.auth.hasPermission('studentAttendance.create') || !this.rosterLoaded() || !this.students().length || this.pageRecorded()) return;
    this.saving.set(true);
    this.error.set('');
    this.workflows.recordStudentAttendance({
      date: this.form.controls.date.value,
      records: this.students().map((student) => ({
        studentId: this.studentId(student),
        classId: this.form.controls.classId.value,
        sectionId: this.form.controls.sectionId.value,
        status: this.statusFor(student),
      })),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.saving.set(false); this.pageRecorded.set(true); this.success.set(`Attendance recorded for ${this.students().length} student(s).`); },
      error: (error: ApiError) => { this.saving.set(false); this.error.set(error.message); },
    });
  }

  private loadClasses(): void {
    this.classLoading.set(true);
    this.classError.set('');
    this.lookup.search({ endpoint: API_ENDPOINTS.classes, labelField: 'name', valueField: 'id' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (options) => { this.classes.set(options); this.classLoading.set(false); },
        error: (error: ApiError) => { this.classError.set(error.message); this.classLoading.set(false); },
      });
  }
}