import { Injectable } from '@angular/core';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { EntityMetadata, FieldMetadata } from './metadata.models';

@Injectable({ providedIn: 'root' })
export class EntityMetadataRegistry {
  private readonly entities = new Map<string, EntityMetadata>();

  constructor() {
    this.registerDefaults();
  }

  register(metadata: EntityMetadata): void {
    this.entities.set(metadata.key, metadata);
  }

  get(key: string): EntityMetadata | undefined {
    return this.entities.get(key);
  }

  has(key: string): boolean {
    return this.entities.has(key);
  }

  all(): EntityMetadata[] {
    return Array.from(this.entities.values());
  }

  private registerDefaults(): void {
    this.registerEntity('schools', 'School', 'Schools', API_ENDPOINTS.schools, [
      { key: 'name', label: 'School name', type: 'text', required: true, inTable: true, inForm: true, sortable: true, minLength: 2 },
      { key: 'code', label: 'School code', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'email', label: 'Email', type: 'email', inTable: true, inForm: true },
      { key: 'phone', label: 'Phone', type: 'tel', inTable: true, inForm: true },
      { key: 'address', label: 'Address', type: 'textarea', inForm: true },
      { key: 'city', label: 'City', type: 'text', inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: this.statusOptions() },
    ]);

    this.registerEntity('branches', 'Branch', 'Branches', API_ENDPOINTS.branches, [
      { key: 'name', label: 'Branch name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'code', label: 'Branch code', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'schoolId', label: 'School', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.schools, labelField: 'name', valueField: 'id' } },
      { key: 'email', label: 'Email', type: 'email', inTable: true, inForm: true },
      { key: 'phone', label: 'Phone', type: 'tel', inTable: true, inForm: true },
      { key: 'address', label: 'Address', type: 'textarea', inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: this.statusOptions() },
    ]);

    this.registerEntity('academic-sessions', 'Academic session', 'Academic Sessions', API_ENDPOINTS.academicSessions, [
      { key: 'name', label: 'Session name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'code', label: 'Session code', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'startDate', label: 'Start date', type: 'date', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'endDate', label: 'End date', type: 'date', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'isCurrent', label: 'Current session', type: 'boolean', inTable: true, inForm: true, defaultValue: false },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: this.statusOptions() },
    ]);

    this.registerEntity('classes', 'Class', 'Classes', API_ENDPOINTS.classes, [
      { key: 'name', label: 'Class name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'code', label: 'Class code', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'gradeLevel', label: 'Grade level', type: 'number', inTable: true, inForm: true, min: 1 },
      { key: 'academicSessionId', label: 'Academic session', type: 'lookup', inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.academicSessions, labelField: 'name', valueField: 'id' } },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: this.statusOptions() },
    ]);

    this.registerEntity('sections', 'Section', 'Sections', API_ENDPOINTS.sections, [
      { key: 'name', label: 'Section name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'code', label: 'Section code', type: 'text', inTable: true, inForm: true },
      { key: 'classId', label: 'Class', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.classes, labelField: 'name', valueField: 'id' } },
      { key: 'capacity', label: 'Capacity', type: 'number', inTable: true, inForm: true, min: 1 },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: this.statusOptions() },
    ]);

    this.registerEntity('subjects', 'Subject', 'Subjects', API_ENDPOINTS.subjects, [
      { key: 'name', label: 'Subject name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'code', label: 'Subject code', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'description', label: 'Description', type: 'textarea', inForm: true },
      { key: 'creditHours', label: 'Credit hours', type: 'number', inTable: true, inForm: true, min: 0 },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: this.statusOptions() },
    ]);

    this.registerEntity('students', 'Student', 'Students', API_ENDPOINTS.students, [
      { key: 'admissionNumber', label: 'Admission number', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'firstName', label: 'First name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'lastName', label: 'Last name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'email', label: 'Email', type: 'email', inTable: true, inForm: true },
      { key: 'phone', label: 'Phone', type: 'tel', inTable: true, inForm: true },
      { key: 'dateOfBirth', label: 'Date of birth', type: 'date', inForm: true },
      { key: 'gender', label: 'Gender', type: 'select', inTable: true, inForm: true, options: [{ label: 'Female', value: 'female' }, { label: 'Male', value: 'male' }, { label: 'Other', value: 'other' }] },
      { key: 'classId', label: 'Class', type: 'lookup', inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.classes, labelField: 'name', valueField: 'id' } },
      { key: 'sectionId', label: 'Section', type: 'lookup', inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.sections, labelField: 'name', valueField: 'id' } },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: this.statusOptions() },
    ]);

    this.registerEntity('parents', 'Parent', 'Parents', API_ENDPOINTS.parents, [
      { key: 'firstName', label: 'First name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'lastName', label: 'Last name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'email', label: 'Email', type: 'email', required: true, inTable: true, inForm: true },
      { key: 'phone', label: 'Phone', type: 'tel', inTable: true, inForm: true },
      { key: 'relationship', label: 'Relationship', type: 'select', inTable: true, inForm: true, options: [{ label: 'Father', value: 'father' }, { label: 'Mother', value: 'mother' }, { label: 'Guardian', value: 'guardian' }, { label: 'Other', value: 'other' }] },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: this.statusOptions() },
    ]);

    this.registerEntity('staff', 'Staff', 'Staff', API_ENDPOINTS.staff, [
      { key: 'employeeNumber', label: 'Employee number', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'firstName', label: 'First name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'lastName', label: 'Last name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'email', label: 'Email', type: 'email', required: true, inTable: true, inForm: true },
      { key: 'phone', label: 'Phone', type: 'tel', inTable: true, inForm: true },
      { key: 'department', label: 'Department', type: 'text', inTable: true, inForm: true },
      { key: 'designation', label: 'Designation', type: 'text', inTable: true, inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: this.statusOptions() },
    ]);

    this.registerEntity('users', 'User', 'Users', API_ENDPOINTS.users, [
      { key: 'name', label: 'Display name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'username', label: 'Username', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'email', label: 'Email', type: 'email', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'roleId', label: 'Role', type: 'lookup', inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.roles, labelField: 'name', valueField: 'id' } },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: this.statusOptions() },
    ]);

    this.registerEntity('roles', 'Role', 'Roles', API_ENDPOINTS.roles, [
      { key: 'name', label: 'Role name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'code', label: 'Role code', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'description', label: 'Description', type: 'textarea', inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: this.statusOptions() },
    ]);

    this.registerEntity('permissions', 'Permission', 'Permissions', API_ENDPOINTS.permissions, [
      { key: 'name', label: 'Permission name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'code', label: 'Permission code', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'module', label: 'Module', type: 'text', inTable: true, inForm: true, sortable: true },
      { key: 'action', label: 'Action', type: 'select', required: true, inTable: true, inForm: true, options: [{ label: 'View', value: 'view' }, { label: 'Create', value: 'create' }, { label: 'Edit', value: 'edit' }, { label: 'Delete', value: 'delete' }, { label: 'Export', value: 'export' }, { label: 'Import', value: 'import' }, { label: 'Approve', value: 'approve' }, { label: 'Reject', value: 'reject' }, { label: 'Manage', value: 'manage' }] },
      { key: 'description', label: 'Description', type: 'textarea', inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: this.statusOptions() },
    ]);

    this.registerEntity('teacher-assignments', 'Teacher assignment', 'Teacher Assignments', API_ENDPOINTS.teacherAssignments, [
      { key: 'teacherId', label: 'Teacher', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.staff, labelField: 'firstName', valueField: 'id' } },
      { key: 'classId', label: 'Class', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.classes, labelField: 'name', valueField: 'id' } },
      { key: 'sectionId', label: 'Section', type: 'lookup', inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.sections, labelField: 'name', valueField: 'id' } },
      { key: 'subjectId', label: 'Subject', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.subjects, labelField: 'name', valueField: 'id' } },
      { key: 'academicSessionId', label: 'Academic session', type: 'lookup', inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.academicSessions, labelField: 'name', valueField: 'id' } },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: this.statusOptions() },
    ]);

    this.registerEntity('timetables', 'Timetable', 'Timetables', API_ENDPOINTS.timetables, [
      { key: 'name', label: 'Name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'classId', label: 'Class', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.classes, labelField: 'name', valueField: 'id' } },
      { key: 'sectionId', label: 'Section', type: 'lookup', inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.sections, labelField: 'name', valueField: 'id' } },
      { key: 'day', label: 'Day', type: 'select', required: true, inTable: true, inForm: true, options: [{ label: 'Monday', value: 'monday' }, { label: 'Tuesday', value: 'tuesday' }, { label: 'Wednesday', value: 'wednesday' }, { label: 'Thursday', value: 'thursday' }, { label: 'Friday', value: 'friday' }, { label: 'Saturday', value: 'saturday' }, { label: 'Sunday', value: 'sunday' }] },
      { key: 'startTime', label: 'Start time', type: 'datetime', required: true, inTable: true, inForm: true },
      { key: 'endTime', label: 'End time', type: 'datetime', required: true, inTable: true, inForm: true },
      { key: 'subjectId', label: 'Subject', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.subjects, labelField: 'name', valueField: 'id' } },
      { key: 'teacherId', label: 'Teacher', type: 'lookup', inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.staff, labelField: 'firstName', valueField: 'id' } },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: this.statusOptions() },
    ]);

    this.registerEntity('attendance', 'Attendance record', 'Attendance', API_ENDPOINTS.attendance, [
      { key: 'studentId', label: 'Student', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.students, labelField: 'firstName', valueField: 'id' } },
      { key: 'classId', label: 'Class', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.classes, labelField: 'name', valueField: 'id' } },
      { key: 'sectionId', label: 'Section', type: 'lookup', inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.sections, labelField: 'name', valueField: 'id' } },
      { key: 'date', label: 'Date', type: 'date', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'status', label: 'Status', type: 'select', required: true, inTable: true, inForm: true, options: [{ label: 'Present', value: 'present' }, { label: 'Absent', value: 'absent' }, { label: 'Late', value: 'late' }, { label: 'Excused', value: 'excused' }] },
      { key: 'remarks', label: 'Remarks', type: 'textarea', inForm: true },
    ]);

    this.registerEntity('examinations', 'Examination', 'Examinations', API_ENDPOINTS.examinations, [
      { key: 'name', label: 'Examination name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'code', label: 'Exam code', type: 'text', inTable: true, inForm: true, sortable: true },
      { key: 'academicSessionId', label: 'Academic session', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.academicSessions, labelField: 'name', valueField: 'id' } },
      { key: 'classId', label: 'Class', type: 'lookup', inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.classes, labelField: 'name', valueField: 'id' } },
      { key: 'startDate', label: 'Start date', type: 'date', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'endDate', label: 'End date', type: 'date', required: true, inTable: true, inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: [{ label: 'Draft', value: 'draft' }, { label: 'Scheduled', value: 'scheduled' }, { label: 'In progress', value: 'in_progress' }, { label: 'Completed', value: 'completed' }, { label: 'Cancelled', value: 'cancelled' }] },
    ]);

    this.registerEntity('marks', 'Mark', 'Marks', API_ENDPOINTS.marks, [
      { key: 'studentId', label: 'Student', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.students, labelField: 'firstName', valueField: 'id' } },
      { key: 'examinationId', label: 'Examination', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.examinations, labelField: 'name', valueField: 'id' } },
      { key: 'subjectId', label: 'Subject', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.subjects, labelField: 'name', valueField: 'id' } },
      { key: 'marksObtained', label: 'Marks obtained', type: 'number', required: true, inTable: true, inForm: true, min: 0 },
      { key: 'maximumMarks', label: 'Maximum marks', type: 'number', required: true, inTable: true, inForm: true, min: 1 },
      { key: 'remarks', label: 'Remarks', type: 'textarea', inForm: true },
    ]);

    this.registerEntity('grades', 'Grade', 'Grades', API_ENDPOINTS.grades, [
      { key: 'name', label: 'Grade name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'code', label: 'Grade code', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'minimumPercentage', label: 'Minimum percentage', type: 'number', required: true, inTable: true, inForm: true, min: 0, max: 100 },
      { key: 'maximumPercentage', label: 'Maximum percentage', type: 'number', required: true, inTable: true, inForm: true, min: 0, max: 100 },
      { key: 'remarks', label: 'Remarks', type: 'textarea', inForm: true },
    ]);

    this.registerEntity('results', 'Result', 'Results', API_ENDPOINTS.results, [
      { key: 'studentId', label: 'Student', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.students, labelField: 'firstName', valueField: 'id' } },
      { key: 'examinationId', label: 'Examination', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.examinations, labelField: 'name', valueField: 'id' } },
      { key: 'totalMarks', label: 'Total marks', type: 'number', inTable: true, inForm: true, min: 0 },
      { key: 'percentage', label: 'Percentage', type: 'number', inTable: true, inForm: true, min: 0, max: 100 },
      { key: 'grade', label: 'Grade', type: 'text', inTable: true, inForm: true },
      { key: 'resultStatus', label: 'Result', type: 'select', required: true, inTable: true, inForm: true, options: [{ label: 'Pass', value: 'pass' }, { label: 'Fail', value: 'fail' }, { label: 'Pending', value: 'pending' }] },
      { key: 'remarks', label: 'Remarks', type: 'textarea', inForm: true },
    ]);

    this.registerEntity('report-cards', 'Report card', 'Report Cards', API_ENDPOINTS.reportCards, [
      { key: 'studentId', label: 'Student', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.students, labelField: 'firstName', valueField: 'id' } },
      { key: 'examinationId', label: 'Examination', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.examinations, labelField: 'name', valueField: 'id' } },
      { key: 'academicSessionId', label: 'Academic session', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.academicSessions, labelField: 'name', valueField: 'id' } },
      { key: 'classId', label: 'Class', type: 'lookup', inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.classes, labelField: 'name', valueField: 'id' } },
      { key: 'overallGrade', label: 'Overall grade', type: 'text', inTable: true, inForm: true },
      { key: 'overallPercentage', label: 'Overall percentage', type: 'number', inTable: true, inForm: true, min: 0, max: 100 },
      { key: 'teacherRemarks', label: 'Teacher remarks', type: 'textarea', inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: [{ label: 'Draft', value: 'draft' }, { label: 'Published', value: 'published' }] },
    ]);

    this.registerEntity('fee-categories', 'Fee category', 'Fee Categories', API_ENDPOINTS.feeCategories, [
      { key: 'name', label: 'Category name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'code', label: 'Category code', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'description', label: 'Description', type: 'textarea', inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: this.statusOptions() },
    ]);

    this.registerEntity('fee-structures', 'Fee structure', 'Fee Structures', API_ENDPOINTS.feeStructures, [
      { key: 'name', label: 'Structure name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'academicSessionId', label: 'Academic session', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.academicSessions, labelField: 'name', valueField: 'id' } },
      { key: 'classId', label: 'Class', type: 'lookup', inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.classes, labelField: 'name', valueField: 'id' } },
      { key: 'feeCategoryId', label: 'Fee category', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.feeCategories, labelField: 'name', valueField: 'id' } },
      { key: 'amount', label: 'Amount', type: 'number', required: true, inTable: true, inForm: true, min: 0 },
      { key: 'dueDate', label: 'Due date', type: 'date', inTable: true, inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: this.statusOptions() },
    ]);

    this.registerEntity('student-fees', 'Student fee', 'Student Fees', API_ENDPOINTS.studentFees, [
      { key: 'studentId', label: 'Student', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.students, labelField: 'firstName', valueField: 'id' } },
      { key: 'feeStructureId', label: 'Fee structure', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.feeStructures, labelField: 'name', valueField: 'id' } },
      { key: 'totalAmount', label: 'Total amount', type: 'number', required: true, inTable: true, inForm: true, min: 0 },
      { key: 'paidAmount', label: 'Paid amount', type: 'number', inTable: true, inForm: true, min: 0 },
      { key: 'dueAmount', label: 'Due amount', type: 'number', inTable: true, inForm: true, min: 0 },
      { key: 'dueDate', label: 'Due date', type: 'date', inTable: true, inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: [{ label: 'Pending', value: 'pending' }, { label: 'Partially paid', value: 'partial' }, { label: 'Paid', value: 'paid' }, { label: 'Overdue', value: 'overdue' }, { label: 'Cancelled', value: 'cancelled' }] },
    ]);

    this.registerEntity('installments', 'Installment', 'Installments', API_ENDPOINTS.installments, [
      { key: 'studentFeeId', label: 'Student fee', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.studentFees, labelField: 'id', valueField: 'id' } },
      { key: 'name', label: 'Installment name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'amount', label: 'Amount', type: 'number', required: true, inTable: true, inForm: true, min: 0 },
      { key: 'dueDate', label: 'Due date', type: 'date', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'paidAmount', label: 'Paid amount', type: 'number', inTable: true, inForm: true, min: 0 },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: [{ label: 'Pending', value: 'pending' }, { label: 'Partially paid', value: 'partial' }, { label: 'Paid', value: 'paid' }, { label: 'Overdue', value: 'overdue' }] },
    ]);

    this.registerEntity('fee-collections', 'Fee collection', 'Fee Collections', API_ENDPOINTS.feeCollections, [
      { key: 'receiptNumber', label: 'Receipt number', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'studentId', label: 'Student', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.students, labelField: 'firstName', valueField: 'id' } },
      { key: 'studentFeeId', label: 'Student fee', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.studentFees, labelField: 'id', valueField: 'id' } },
      { key: 'amount', label: 'Amount', type: 'number', required: true, inTable: true, inForm: true, min: 0 },
      { key: 'paymentDate', label: 'Payment date', type: 'date', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'paymentMethod', label: 'Payment method', type: 'select', required: true, inTable: true, inForm: true, options: [{ label: 'Cash', value: 'cash' }, { label: 'Card', value: 'card' }, { label: 'Bank transfer', value: 'bank_transfer' }, { label: 'Cheque', value: 'cheque' }, { label: 'Mobile money', value: 'mobile_money' }, { label: 'Online', value: 'online' }] },
      { key: 'reference', label: 'Reference', type: 'text', inTable: true, inForm: true },
      { key: 'remarks', label: 'Remarks', type: 'textarea', inForm: true },
    ]);

    this.registerEntity('receipts', 'Receipt', 'Receipts', API_ENDPOINTS.receipts, [
      { key: 'receiptNumber', label: 'Receipt number', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'studentId', label: 'Student', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.students, labelField: 'firstName', valueField: 'id' } },
      { key: 'amount', label: 'Amount', type: 'number', required: true, inTable: true, inForm: true, min: 0 },
      { key: 'paymentDate', label: 'Payment date', type: 'date', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'paymentMethod', label: 'Payment method', type: 'select', required: true, inTable: true, inForm: true, options: [{ label: 'Cash', value: 'cash' }, { label: 'Card', value: 'card' }, { label: 'Bank transfer', value: 'bank_transfer' }, { label: 'Cheque', value: 'cheque' }, { label: 'Mobile money', value: 'mobile_money' }, { label: 'Online', value: 'online' }] },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: [{ label: 'Issued', value: 'issued' }, { label: 'Voided', value: 'voided' }] },
    ]);

    this.registerEntity('discounts', 'Discount', 'Discounts', API_ENDPOINTS.discounts, [
      { key: 'name', label: 'Discount name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'code', label: 'Discount code', type: 'text', inTable: true, inForm: true, sortable: true },
      { key: 'type', label: 'Discount type', type: 'select', required: true, inTable: true, inForm: true, options: [{ label: 'Percentage', value: 'percentage' }, { label: 'Fixed amount', value: 'fixed' }] },
      { key: 'value', label: 'Value', type: 'number', required: true, inTable: true, inForm: true, min: 0 },
      { key: 'description', label: 'Description', type: 'textarea', inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: this.statusOptions() },
    ]);

    this.registerEntity('scholarships', 'Scholarship', 'Scholarships', API_ENDPOINTS.scholarships, [
      { key: 'name', label: 'Scholarship name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'code', label: 'Scholarship code', type: 'text', inTable: true, inForm: true, sortable: true },
      { key: 'studentId', label: 'Student', type: 'lookup', inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.students, labelField: 'firstName', valueField: 'id' } },
      { key: 'amount', label: 'Amount', type: 'number', inTable: true, inForm: true, min: 0 },
      { key: 'percentage', label: 'Percentage', type: 'number', inTable: true, inForm: true, min: 0, max: 100 },
      { key: 'academicSessionId', label: 'Academic session', type: 'lookup', inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.academicSessions, labelField: 'name', valueField: 'id' } },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: [{ label: 'Pending', value: 'pending' }, { label: 'Approved', value: 'approved' }, { label: 'Rejected', value: 'rejected' }, { label: 'Active', value: 'active' }, { label: 'Closed', value: 'closed' }] },
    ]);

    this.registerEntity('expenses', 'Expense', 'Expenses', API_ENDPOINTS.expenses, [
      { key: 'name', label: 'Expense name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'category', label: 'Category', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'accountId', label: 'Account', type: 'lookup', inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.accounts, labelField: 'name', valueField: 'id' } },
      { key: 'amount', label: 'Amount', type: 'number', required: true, inTable: true, inForm: true, min: 0 },
      { key: 'expenseDate', label: 'Expense date', type: 'date', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'reference', label: 'Reference', type: 'text', inTable: true, inForm: true },
      { key: 'description', label: 'Description', type: 'textarea', inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: [{ label: 'Draft', value: 'draft' }, { label: 'Approved', value: 'approved' }, { label: 'Paid', value: 'paid' }, { label: 'Cancelled', value: 'cancelled' }] },
    ]);

    this.registerEntity('accounts', 'Account', 'Accounts', API_ENDPOINTS.accounts, [
      { key: 'name', label: 'Account name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'code', label: 'Account code', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'type', label: 'Account type', type: 'select', required: true, inTable: true, inForm: true, options: [{ label: 'Asset', value: 'asset' }, { label: 'Liability', value: 'liability' }, { label: 'Income', value: 'income' }, { label: 'Expense', value: 'expense' }, { label: 'Equity', value: 'equity' }] },
      { key: 'openingBalance', label: 'Opening balance', type: 'number', inTable: true, inForm: true },
      { key: 'description', label: 'Description', type: 'textarea', inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: this.statusOptions() },
    ]);

    this.registerEntity('hr', 'HR record', 'HR', API_ENDPOINTS.hr, [
      { key: 'staffId', label: 'Staff', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.staff, labelField: 'firstName', valueField: 'id' } },
      { key: 'recordType', label: 'Record type', type: 'select', required: true, inTable: true, inForm: true, options: [{ label: 'Leave', value: 'leave' }, { label: 'Loan', value: 'loan' }, { label: 'Advance', value: 'advance' }, { label: 'Other', value: 'other' }] },
      { key: 'startDate', label: 'Start date', type: 'date', inTable: true, inForm: true },
      { key: 'endDate', label: 'End date', type: 'date', inTable: true, inForm: true },
      { key: 'amount', label: 'Amount', type: 'number', inTable: true, inForm: true, min: 0 },
      { key: 'reason', label: 'Reason', type: 'textarea', inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: [{ label: 'Pending', value: 'pending' }, { label: 'Approved', value: 'approved' }, { label: 'Rejected', value: 'rejected' }, { label: 'Completed', value: 'completed' }] },
    ]);

    this.registerEntity('payroll', 'Payroll', 'Payroll', API_ENDPOINTS.payroll, [
      { key: 'staffId', label: 'Staff', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.staff, labelField: 'firstName', valueField: 'id' } },
      { key: 'payPeriod', label: 'Pay period', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'basicSalary', label: 'Basic salary', type: 'number', required: true, inTable: true, inForm: true, min: 0 },
      { key: 'allowances', label: 'Allowances', type: 'number', inTable: true, inForm: true, min: 0 },
      { key: 'deductions', label: 'Deductions', type: 'number', inTable: true, inForm: true, min: 0 },
      { key: 'netSalary', label: 'Net salary', type: 'number', inTable: true, inForm: true, min: 0 },
      { key: 'paymentDate', label: 'Payment date', type: 'date', inTable: true, inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: [{ label: 'Draft', value: 'draft' }, { label: 'Approved', value: 'approved' }, { label: 'Paid', value: 'paid' }, { label: 'Cancelled', value: 'cancelled' }] },
    ]);

    this.registerEntity('library', 'Library record', 'Library', API_ENDPOINTS.library, [
      { key: 'title', label: 'Title', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'author', label: 'Author', type: 'text', inTable: true, inForm: true, sortable: true },
      { key: 'isbn', label: 'ISBN', type: 'text', inTable: true, inForm: true },
      { key: 'category', label: 'Category', type: 'text', inTable: true, inForm: true },
      { key: 'copies', label: 'Copies', type: 'number', inTable: true, inForm: true, min: 0 },
      { key: 'shelfLocation', label: 'Shelf location', type: 'text', inTable: true, inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: [{ label: 'Available', value: 'available' }, { label: 'Issued', value: 'issued' }, { label: 'Reserved', value: 'reserved' }, { label: 'Unavailable', value: 'unavailable' }] },
    ]);

    this.registerEntity('transport', 'Transport record', 'Transport', API_ENDPOINTS.transport, [
      { key: 'name', label: 'Name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'vehicleNumber', label: 'Vehicle number', type: 'text', inTable: true, inForm: true, sortable: true },
      { key: 'routeName', label: 'Route', type: 'text', inTable: true, inForm: true },
      { key: 'driverName', label: 'Driver', type: 'text', inTable: true, inForm: true },
      { key: 'capacity', label: 'Capacity', type: 'number', inTable: true, inForm: true, min: 1 },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: [{ label: 'Active', value: 'active' }, { label: 'Maintenance', value: 'maintenance' }, { label: 'Inactive', value: 'inactive' }] },
    ]);

    this.registerEntity('inventory', 'Inventory item', 'Inventory', API_ENDPOINTS.inventory, [
      { key: 'name', label: 'Item name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'code', label: 'Item code', type: 'text', inTable: true, inForm: true, sortable: true },
      { key: 'category', label: 'Category', type: 'text', inTable: true, inForm: true },
      { key: 'quantity', label: 'Quantity', type: 'number', inTable: true, inForm: true, min: 0 },
      { key: 'unit', label: 'Unit', type: 'text', inTable: true, inForm: true },
      { key: 'unitCost', label: 'Unit cost', type: 'number', inTable: true, inForm: true, min: 0 },
      { key: 'reorderLevel', label: 'Reorder level', type: 'number', inTable: true, inForm: true, min: 0 },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: this.statusOptions() },
    ]);

    this.registerEntity('assets', 'Asset', 'Assets', API_ENDPOINTS.assets, [
      { key: 'name', label: 'Asset name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'code', label: 'Asset code', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'category', label: 'Category', type: 'text', inTable: true, inForm: true },
      { key: 'location', label: 'Location', type: 'text', inTable: true, inForm: true },
      { key: 'purchaseDate', label: 'Purchase date', type: 'date', inTable: true, inForm: true },
      { key: 'purchaseCost', label: 'Purchase cost', type: 'number', inTable: true, inForm: true, min: 0 },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: [{ label: 'Available', value: 'available' }, { label: 'Assigned', value: 'assigned' }, { label: 'Maintenance', value: 'maintenance' }, { label: 'Retired', value: 'retired' }] },
    ]);

    this.registerEntity('communication', 'Communication', 'Communication', API_ENDPOINTS.communication, [
      { key: 'title', label: 'Title', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'type', label: 'Type', type: 'select', required: true, inTable: true, inForm: true, options: [{ label: 'Announcement', value: 'announcement' }, { label: 'Notification', value: 'notification' }, { label: 'Message', value: 'message' }] },
      { key: 'audience', label: 'Audience', type: 'text', inTable: true, inForm: true },
      { key: 'content', label: 'Content', type: 'textarea', required: true, inForm: true },
      { key: 'scheduledAt', label: 'Scheduled at', type: 'datetime', inTable: true, inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: [{ label: 'Draft', value: 'draft' }, { label: 'Scheduled', value: 'scheduled' }, { label: 'Published', value: 'published' }, { label: 'Archived', value: 'archived' }] },
    ]);

    this.registerEntity('documents', 'Document', 'Documents', API_ENDPOINTS.documents, [
      { key: 'name', label: 'Document name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'category', label: 'Category', type: 'text', inTable: true, inForm: true },
      { key: 'ownerType', label: 'Owner type', type: 'text', inTable: true, inForm: true },
      { key: 'ownerId', label: 'Owner ID', type: 'text', inTable: true, inForm: true },
      { key: 'documentType', label: 'File type', type: 'text', inTable: true, inForm: true },
      { key: 'description', label: 'Description', type: 'textarea', inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: [{ label: 'Active', value: 'active' }, { label: 'Archived', value: 'archived' }] },
    ]);

    this.registerEntity('reports', 'Report', 'Reports', API_ENDPOINTS.reports, [
      { key: 'name', label: 'Report name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'type', label: 'Report type', type: 'select', required: true, inTable: true, inForm: true, options: [{ label: 'Student', value: 'student' }, { label: 'Attendance', value: 'attendance' }, { label: 'Examination', value: 'examination' }, { label: 'Fee', value: 'fee' }, { label: 'Staff', value: 'staff' }, { label: 'Financial', value: 'financial' }, { label: 'Transport', value: 'transport' }, { label: 'Inventory', value: 'inventory' }] },
      { key: 'format', label: 'Format', type: 'select', inTable: true, inForm: true, options: [{ label: 'PDF', value: 'pdf' }, { label: 'CSV', value: 'csv' }, { label: 'Excel', value: 'excel' }] },
      { key: 'parameters', label: 'Parameters', type: 'textarea', inForm: true },
      { key: 'generatedAt', label: 'Generated at', type: 'datetime', inTable: true, inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: [{ label: 'Draft', value: 'draft' }, { label: 'Generated', value: 'generated' }, { label: 'Failed', value: 'failed' }] },
    ]);

    this.registerEntity('tenants', 'Tenant', 'Tenants', API_ENDPOINTS.tenants, [
      { key: 'name', label: 'Tenant name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'domain', label: 'Domain', type: 'text', inTable: true, inForm: true },
      { key: 'contactEmail', label: 'Contact email', type: 'email', inTable: true, inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: [{ label: 'Active', value: 'active' }, { label: 'Suspended', value: 'suspended' }, { label: 'Trial', value: 'trial' }, { label: 'Cancelled', value: 'cancelled' }] },
    ]);

    this.registerEntity('subscription-plans', 'Subscription plan', 'Subscription Plans', API_ENDPOINTS.subscriptionPlans, [
      { key: 'name', label: 'Plan name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'code', label: 'Plan code', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'price', label: 'Price', type: 'number', required: true, inTable: true, inForm: true, min: 0 },
      { key: 'billingCycle', label: 'Billing cycle', type: 'select', required: true, inTable: true, inForm: true, options: [{ label: 'Monthly', value: 'monthly' }, { label: 'Quarterly', value: 'quarterly' }, { label: 'Annual', value: 'annual' }] },
      { key: 'maxSchools', label: 'Maximum schools', type: 'number', inTable: true, inForm: true, min: 0 },
      { key: 'maxUsers', label: 'Maximum users', type: 'number', inTable: true, inForm: true, min: 0 },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: this.statusOptions() },
    ]);

    this.registerEntity('subscriptions', 'Subscription', 'Subscriptions', API_ENDPOINTS.subscriptions, [
      { key: 'tenantId', label: 'Tenant', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.tenants, labelField: 'name', valueField: 'id' } },
      { key: 'planId', label: 'Plan', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.subscriptionPlans, labelField: 'name', valueField: 'id' } },
      { key: 'startDate', label: 'Start date', type: 'date', required: true, inTable: true, inForm: true },
      { key: 'endDate', label: 'End date', type: 'date', required: true, inTable: true, inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: [{ label: 'Active', value: 'active' }, { label: 'Trial', value: 'trial' }, { label: 'Past due', value: 'past_due' }, { label: 'Cancelled', value: 'cancelled' }, { label: 'Expired', value: 'expired' }] },
    ]);

    this.registerEntity('billing', 'Billing record', 'Billing', API_ENDPOINTS.billing, [
      { key: 'tenantId', label: 'Tenant', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.tenants, labelField: 'name', valueField: 'id' } },
      { key: 'invoiceNumber', label: 'Invoice number', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'amount', label: 'Amount', type: 'number', required: true, inTable: true, inForm: true, min: 0 },
      { key: 'currency', label: 'Currency', type: 'text', inTable: true, inForm: true },
      { key: 'invoiceDate', label: 'Invoice date', type: 'date', required: true, inTable: true, inForm: true },
      { key: 'dueDate', label: 'Due date', type: 'date', required: true, inTable: true, inForm: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, options: [{ label: 'Draft', value: 'draft' }, { label: 'Open', value: 'open' }, { label: 'Paid', value: 'paid' }, { label: 'Overdue', value: 'overdue' }, { label: 'Void', value: 'void' }] },
    ]);

    this.registerEntity('usage', 'Usage record', 'Usage', API_ENDPOINTS.usage, [
      { key: 'tenantId', label: 'Tenant', type: 'lookup', required: true, inTable: true, inForm: true, lookup: { endpoint: API_ENDPOINTS.tenants, labelField: 'name', valueField: 'id' } },
      { key: 'metric', label: 'Metric', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'value', label: 'Value', type: 'number', required: true, inTable: true, inForm: true, min: 0 },
      { key: 'period', label: 'Period', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'recordedAt', label: 'Recorded at', type: 'datetime', inTable: true, inForm: true },
    ]);

    this.registerEntity('platform-configuration', 'Platform configuration', 'Platform Configuration', API_ENDPOINTS.platformConfiguration, [
      { key: 'key', label: 'Configuration key', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'value', label: 'Value', type: 'textarea', required: true, inForm: true },
      { key: 'group', label: 'Group', type: 'text', inTable: true, inForm: true, sortable: true },
      { key: 'isPublic', label: 'Public', type: 'boolean', inTable: true, inForm: true, defaultValue: false },
      { key: 'description', label: 'Description', type: 'textarea', inForm: true },
    ]);
  }

  private statusOptions(): FieldMetadata['options'] {
    return [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ];
  }

  private registerEntity(
    key: string,
    label: string,
    pluralLabel: string,
    endpoint: string,
    fields: FieldMetadata[],
  ): void {
    const tableFields = fields.filter((field) => field.inTable);
    const statusFilter = fields.find((field) => field.key === 'status');
    this.register({
      key,
      label,
      pluralLabel,
      endpoint,
      idKey: 'id',
      fields,
      form: { fields, columns: 2, submitLabel: `Save ${label}` },
      table: {
        columns: tableFields.map((field) => ({ key: field.key, label: field.label, sortable: field.sortable, width: field.width })),
        rowActions: ['view', 'edit', 'delete'],
        bulkActions: ['delete', 'export'],
        pageSize: 10,
        searchable: true,
      },
      filters: statusFilter
        ? [{ key: 'status', label: 'Status', type: 'select', options: this.statusOptions() }]
        : [],
      relationships: [],
      permissions: {
        list: `${key}.view`,
        create: `${key}.create`,
        update: `${key}.edit`,
        delete: `${key}.delete`,
      },
    });
  }
}
