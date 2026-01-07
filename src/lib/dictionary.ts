import 'server-only'

const dictionaries = {
  en: () => import('@/translations/frontend/en.json').then((module) => module.default),
  pl: () => import('@/translations/frontend/pl.json').then((module) => module.default),
}

export const getDictionary = async (locale: 'en' | 'pl') => dictionaries[locale]()
