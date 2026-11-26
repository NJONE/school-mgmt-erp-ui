import { Injectable, computed, signal } from '@angular/core';

export type ThemePreference = 'system' | 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly preferenceSignal = signal<ThemePreference>(this.readPreference());
  private readonly systemDark = signal(false);

  readonly preference = this.preferenceSignal.asReadonly();
  readonly isDark = computed(() => this.preferenceSignal() === 'dark'
    || (this.preferenceSignal() === 'system' && this.systemDark()));

  constructor() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemDark.set(media.matches);
      media.addEventListener('change', (event) => {
        this.systemDark.set(event.matches);
        this.apply();
      });
    }
    this.apply();
  }

  setPreference(preference: ThemePreference): void {
    this.preferenceSignal.set(preference);
    if (typeof localStorage !== 'undefined') localStorage.setItem('erp.theme', preference);
    this.apply();
  }

  toggle(): void {
    this.setPreference(this.isDark() ? 'light' : 'dark');
  }

  private readPreference(): ThemePreference {
    if (typeof localStorage === 'undefined') return 'system';
    const saved = localStorage.getItem('erp.theme');
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  }

  private apply(): void {
    if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark', this.isDark());
  }
}
