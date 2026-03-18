import { Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { getSavedLanguage, I18N, Language, saveLanguage } from 'lib/i18n/i18n';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLang = signal<Language>('ka');
  private translations = signal<Record<string, any>>({});
  constructor() {
    const savedLocale = getSavedLanguage();
    this.currentLang.set(savedLocale);
    this.translations.set(I18N[savedLocale]);
  }

  loadModule(moduleName: string): Observable<any> {
    return of(null);
  }

  switchLanguage(lang: Language): void {
    saveLanguage(lang);
    this.currentLang.set(lang);
    this.translations.set(I18N[lang]);
  }

  toggleLanguage(): void {
    const newLang = this.currentLang() === 'ka' ? 'en' : 'ka';
    this.switchLanguage(newLang);
  }

  getCurrentLanguage(): Language {
    return this.currentLang();
  }

  isGeorgian = computed(() => this.currentLang() === 'ka');
  isEnglish = computed(() => this.currentLang() === 'en');

  translate(key: string, params?: Record<string, any>): string {
    const keys = key.split('.');
    let value: any = this.translations();

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }

    let result = value || key;

    if (params && typeof result === 'string') {
      Object.keys(params).forEach(param => {
        result = result.replace(new RegExp(`{${param}}`, 'g'), params[param]);
      });
    }

    return result;
  }

  instant = computed(() => (key: string) => this.translate(key));
}
