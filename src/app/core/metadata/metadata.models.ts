export type FieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'password'
  | 'tel'
  | 'textarea'
  | 'select'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'url'
  | 'lookup';

export interface FieldOption {
  label: string;
  value: string | number | boolean;
}

export interface LookupMetadata {
  endpoint: string;
  labelField?: string;
  valueField?: string;
  searchParam?: string;
  params?: Record<string, string | number | boolean>;
}

export interface FieldMetadata {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  readonly?: boolean;
  hidden?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  inTable?: boolean;
  inForm?: boolean;
  section?: string;
  placeholder?: string;
  options?: FieldOption[];
  lookup?: LookupMetadata;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  defaultValue?: unknown;
  width?: number;
  format?: (value: unknown, row?: Record<string, unknown>) => string;
}

export interface FormMetadata {
  fields: FieldMetadata[];
  columns?: 1 | 2;
  submitLabel?: string;
}

export interface TableColumnMetadata {
  key: string;
  label: string;
  sortable?: boolean;
  width?: number;
  format?: (value: unknown, row?: Record<string, unknown>) => string;
}

export interface TableMetadata {
  columns: TableColumnMetadata[];
  rowActions?: ('view' | 'edit' | 'delete')[];
  bulkActions?: ('delete' | 'export')[];
  pageSize?: number;
  searchable?: boolean;
}

export interface FilterMetadata {
  key: string;
  label: string;
  type: 'text' | 'select' | 'boolean' | 'date' | 'range';
  options?: FieldOption[];
  lookup?: LookupMetadata;
}

export interface RelationshipMetadata {
  key: string;
  label: string;
  type: 'one-to-one' | 'many-to-one' | 'one-to-many';
  targetEntity: string;
  foreignKey?: string;
  lookup?: LookupMetadata;
}

export interface EntityMetadata {
  key: string;
  label: string;
  pluralLabel: string;
  endpoint: string;
  idKey?: string;
  fields: FieldMetadata[];
  form?: FormMetadata;
  table?: TableMetadata;
  filters?: FilterMetadata[];
  relationships?: RelationshipMetadata[];
  permissions?: {
    list?: string;
    create?: string;
    update?: string;
    delete?: string;
  };
}

export interface CrudQuery {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: Record<string, string | number | boolean>;
}

export interface LookupOption {
  label: string;
  value: string | number | boolean;
  data?: Record<string, unknown>;
}
