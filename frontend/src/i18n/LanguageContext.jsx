import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import ru from './ru.json';
import en from './en.json';
import az from './az.json';

const LOCALES = { ru, en, az };
const LanguageContext = createContext(null);

function getNestedValue(obj, keyPath) {
  return keyPath.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => (vars[key] !== undefined ? vars[key] : `{${key}}`));
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('azbaku_lang') || 'ru');

  const changeLang = useCallback((newLang) => {
    if (!LOCALES[newLang]) return;
    setLang(newLang);
    localStorage.setItem('azbaku_lang', newLang);
    document.documentElement.lang = newLang;
  }, []);

  // t() is THE ONLY way any visible string should reach the page.
  // Never hardcode user-facing text directly in a component - always add a key to all
  // three locale files and call t('section.key') instead. This is what LUXE MAISON got wrong.
  const t = useCallback((key, vars) => {
    const value = getNestedValue(LOCALES[lang], key);
    if (value === undefined) {
      console.warn(`[i18n] Missing key "${key}" for locale "${lang}"`);
      return key;
    }
    return interpolate(value, vars);
  }, [lang]);

  const value = useMemo(() => ({ lang, changeLang, t }), [lang, changeLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
