import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export type Language = 'ka' | 'en';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly LOCALE_STORAGE_KEY = 'app_locale';
  private currentLang = signal<Language>('ka');
  private translations = signal<Record<string, any>>({});

//davcacho
  private translationsCache = {
    ka: {} as Record<string, any>,
    en: {} as Record<string, any>
  };

  private loadedModules = {
    ka: new Set<string>(),
    en: new Set<string>()
  };

  constructor(private http: HttpClient) {
    const savedLocale = this.getSavedLocale();
    this.currentLang.set(savedLocale);
    this.loadBothLanguages();
  }

  private getSavedLocale(): Language {
    const saved = localStorage.getItem(this.LOCALE_STORAGE_KEY);
    return (saved === 'en' || saved === 'ka') ? saved : 'ka';
  }

  private loadBothLanguages(): void {
    forkJoin({
      ka: this.http.get<Record<string, any>>('/assets/i18n/ka.json').pipe(catchError(() => of({}))),
      en: this.http.get<Record<string, any>>('/assets/i18n/en.json').pipe(catchError(() => of({})))
    }).subscribe(({ ka, en }) => {
      this.translationsCache.ka = ka as Record<string, any>;
      this.translationsCache.en = en as Record<string, any>;

      const currentLang = this.currentLang();
      this.translations.set(this.translationsCache[currentLang]);
    });
  }

  loadModule(moduleName: string): Observable<any> {
    const lang = this.currentLang();

    // Check if module is already loaded for current language
    if (this.loadedModules[lang].has(moduleName)) {
      return of(null);
    }

    // Load module for both languages to avoid future HTTP calls
    return forkJoin({
      ka: this.http.get<Record<string, any>>(`/assets/i18n/ka/${moduleName}.json`).pipe(catchError(() => of({}))),
      en: this.http.get<Record<string, any>>(`/assets/i18n/en/${moduleName}.json`).pipe(catchError(() => of({})))
    }).pipe(
      tap((result: { ka: any; en: any }) => {
        // Merge into cache
        this.translationsCache.ka = { ...this.translationsCache.ka, ...result.ka };
        this.translationsCache.en = { ...this.translationsCache.en, ...result.en };

        // Mark as loaded for both languages
        this.loadedModules.ka.add(moduleName);
        this.loadedModules.en.add(moduleName);

        // Update current translations
        const currentLang = this.currentLang();
        this.translations.set(this.translationsCache[currentLang]);
      })
    );
  }

  switchLanguage(lang: Language): void {
    localStorage.setItem(this.LOCALE_STORAGE_KEY, lang);
    this.currentLang.set(lang);

    // Just switch to cached translations - no HTTP call!
    this.translations.set(this.translationsCache[lang]);
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
