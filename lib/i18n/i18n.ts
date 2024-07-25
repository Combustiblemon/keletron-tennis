import { useLanguage } from '@/context/LanguageContext';

import { Errors } from '../api/common';
import localeEl from './locales/el.json';
import localeEn from './locales/en.json';

const locales = {
  el: localeEl,
  en: localeEn,
};

export type Language = keyof typeof locales;

type DeepKeys<T> = T extends object
  ? {
      [K in keyof T]: `${K & string}${string extends T[K] ? '' : '.'}${DeepKeys<T[K]>}`;
    }[keyof T]
  : '';

export type LocaleKeys = DeepKeys<typeof localeEl>;

const access = (
  path: LocaleKeys,
  obj: (typeof locales)[keyof typeof locales]
): string => {
  return path.split('.').reduce(
    // @ts-expect-error will need advanced TS that i don't want to write atm :)
    (acc, key) => acc[key as keyof typeof acc],
    obj
  ) as unknown as string;
};

export const i18n = (key: LocaleKeys, locale: Language): string => {
  return access(key, locales[locale]) || key;
};

export const getErrorTranslation = (error: Errors, language: Language) => {
  return i18n(`errors.${error}`, language);
};

export const useTranslation = () => {
  const { language } = useLanguage();

  return {
    t: (key: LocaleKeys) => i18n(key, language),
    tError: (error: Errors) => getErrorTranslation(error, language),
  };
};
