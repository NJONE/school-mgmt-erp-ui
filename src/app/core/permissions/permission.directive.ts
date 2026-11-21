import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Directive({ selector: '[hasPermission]' })
export class PermissionDirective {
  readonly hasPermission = input.required<string>();
  private readonly auth = inject(AuthService);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly view = inject(ViewContainerRef);

  constructor() {
    effect(() => {
      const permission = this.hasPermission();
      this.view.clear();
      if (this.auth.hasPermission(permission)) this.view.createEmbeddedView(this.template);
    });
  }
}
