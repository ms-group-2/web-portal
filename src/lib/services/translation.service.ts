import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export type Language = 'ka' | 'en';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly LOCALE_STORAGE_KEY = 'app_locale';
  private currentLang = signal<Language>('ka');
  private translations = signal<Record<string, any>>({});

  constructor(private http: HttpClient) {
    const savedLocale = this.getSavedLocale();
    this.currentLang.set(savedLocale);
    this.loadTranslations(savedLocale);
  }

  private getSavedLocale(): Language {
    const saved = localStorage.getItem(this.LOCALE_STORAGE_KEY);
    return (saved === 'en' || saved === 'ka') ? saved : 'ka';
  }

  loadTranslations(lang: Language): Observable<any> {
    return this.http.get(`/assets/i18n/${lang}.json`).pipe(
      tap((translations) => {
        this.translations.set(translations);
      }),
      catchError((error) => {
        console.error(`Failed to load translations for ${lang}`, error);
        return of({});
      })
    );
  }

  switchLanguage(lang: Language): void {
    localStorage.setItem(this.LOCALE_STORAGE_KEY, lang);
    this.currentLang.set(lang);
    this.loadTranslations(lang).subscribe();
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

  translate(key: string): string {
    const keys = key.split('.');
    let value: any = this.translations();

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }

    return value || key;
  }

  instant = computed(() => (key: string) => this.translate(key));
}
