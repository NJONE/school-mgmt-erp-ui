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
  | 'time'
  | 'datetime'
  | 'url'
  | 'lookup'
  | 'multiselect';

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
  sensitive?: boolean;
  searchable?: boolean;
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
  apiEntityCode?: string;
  label: string;
  pluralLabel: string;
  description?: string;
  module?: string;
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
    import?: string;
    export?: string;
    approve?: string;
    publish?: string;
  };
  features?: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    import?: boolean;
    export?: boolean;
  };
}

export interface BackendEntityMetadata {
  entityCode: string;
  title: string;
  pluralTitle: string;
  description: string;
  module: string;
  apiEndpoint: string;
  primaryKey: string;
  fields: BackendFieldMetadata[];
  permissions: Array<{ action: string; permission: string }>;
  formLayout: {
    tabs: Array<{
      title: string;
      sections: Array<{
        title: string;
        columns?: number;
        fields: Array<{ field: string; readonly?: boolean }>;
      }>;
    }>;
  };
  tableLayout: {
    columns: Array<{ field: string; label?: string; width?: number }>;
    pageSize?: number;
  };
  filterLayout: {
    fields: Array<{ field: string; type?: string; label?: string }>;
  };
  features: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    import?: boolean;
    export?: boolean;
  };
  export?: { enabled: boolean; formats?: string[] };
  import?: { enabled: boolean; templateFields?: string[] };
  displayField: string;
  searchFields: string[];
  defaultPageSize: number;
}

export interface BackendFieldMetadata {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  visibleInForm?: boolean;
  visibleInTable?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  sensitive?: boolean;
  width?: number;
  defaultValue?: unknown;
  placeholder?: string;
  helpText?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  options?: FieldOption[];
  lookup?: {
    entity: string;
    valueField: string;
    labelField: string;
    filters?: Record<string, string | number | boolean>;
  };
  relation?: {
    entity: string;
    displayField?: string;
    foreignKey?: string;
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
