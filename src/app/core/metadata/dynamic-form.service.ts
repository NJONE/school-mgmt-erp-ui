import { Injectable, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FieldMetadata } from './metadata.models';

@Injectable({ providedIn: 'root' })
export class DynamicFormEngine {
  build(fields: FieldMetadata[], value: Record<string, unknown> = {}): FormGroup {
    const controls: Record<string, FormControl> = {};
    for (const field of fields.filter((item) => item.inForm !== false && !item.hidden)) {
      const validators = [];
      if (field.required) validators.push(Validators.required);
      if (field.minLength) validators.push(Validators.minLength(field.minLength));
      if (field.maxLength) validators.push(Validators.maxLength(field.maxLength));
      if (field.pattern) validators.push(Validators.pattern(field.pattern));
      if (field.type === 'email') validators.push(Validators.email);
      if (field.type === 'url') validators.push(Validators.pattern(/^https?:\/\/.+/i));
      if (field.type === 'number') validators.push(Validators.min(field.min ?? 0), Validators.max(field.max ?? Number.MAX_SAFE_INTEGER));
      const controlValue = value[field.key] ?? field.defaultValue ?? '';
      controls[field.key] = field.readonly
        ? new FormControl({ value: controlValue, disabled: true })
        : new FormControl(controlValue, validators);
    }
    return new FormGroup(controls);
  }

  isInvalid(form: FormGroup, key: string): boolean {
    const control = form.get(key);
    return !!control && control.invalid && (control.dirty || control.touched);
  }
}
