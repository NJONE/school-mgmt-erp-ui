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
    const entities: Array<{ key: string; label: string; endpoint: string }> = [
      { key: 'schools', label: 'School', endpoint: API_ENDPOINTS.schools },
      { key: 'branches', label: 'Branch', endpoint: API_ENDPOINTS.branches },
      { key: 'students', label: 'Student', endpoint: API_ENDPOINTS.students },
      { key: 'parents', label: 'Parent', endpoint: API_ENDPOINTS.parents },
      { key: 'staff', label: 'Staff', endpoint: API_ENDPOINTS.staff },
      { key: 'classes', label: 'Class', endpoint: API_ENDPOINTS.classes },
      { key: 'sections', label: 'Section', endpoint: API_ENDPOINTS.sections },
      { key: 'subjects', label: 'Subject', endpoint: API_ENDPOINTS.subjects },
      { key: 'academic-sessions', label: 'Academic session', endpoint: API_ENDPOINTS.academicSessions },
    ];

    const genericFields: FieldMetadata[] = [
      { key: 'name', label: 'Name', type: 'text', required: true, inTable: true, inForm: true, sortable: true },
      { key: 'code', label: 'Code', type: 'text', inTable: true, inForm: true, sortable: true },
      { key: 'status', label: 'Status', type: 'select', inTable: true, inForm: true, filterable: true, options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ] },
    ];

    for (const entity of entities) {
      this.register({
        key: entity.key,
        label: entity.label,
        pluralLabel: `${entity.label}s`,
        endpoint: entity.endpoint,
        idKey: 'id',
        fields: genericFields,
        form: { fields: genericFields, columns: 2, submitLabel: `Save ${entity.label}` },
        table: {
          columns: [
            ...genericFields.filter((field) => field.inTable).map((field) => ({
              key: field.key,
              label: field.label,
              sortable: field.sortable,
            })),
          ],
          rowActions: ['view', 'edit', 'delete'],
          bulkActions: ['delete', 'export'],
          pageSize: 10,
          searchable: true,
        },
        filters: [
          { key: 'status', label: 'Status', type: 'select', options: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ] },
        ],
        relationships: [],
      });
    }
  }
}
