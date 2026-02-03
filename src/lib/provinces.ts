// Polish voivodeships with slugs for search params
export const POLISH_PROVINCES = [
  { label: { en: 'Lower Silesian', pl: 'Dolnośląskie' }, value: 'dolnoslaskie' },
  { label: { en: 'Kuyavian-Pomeranian', pl: 'Kujawsko-Pomorskie' }, value: 'kujawsko-pomorskie' },
  { label: { en: 'Lublin', pl: 'Lubelskie' }, value: 'lubelskie' },
  { label: { en: 'Lubusz', pl: 'Lubuskie' }, value: 'lubuskie' },
  { label: { en: 'Łódź', pl: 'Łódzkie' }, value: 'lodzkie' },
  { label: { en: 'Lesser Poland', pl: 'Małopolskie' }, value: 'malopolskie' },
  { label: { en: 'Masovian', pl: 'Mazowieckie' }, value: 'mazowieckie' },
  { label: { en: 'Opole', pl: 'Opolskie' }, value: 'opolskie' },
  { label: { en: 'Subcarpathian', pl: 'Podkarpackie' }, value: 'podkarpackie' },
  { label: { en: 'Podlaskie', pl: 'Podlaskie' }, value: 'podlaskie' },
  { label: { en: 'Pomeranian', pl: 'Pomorskie' }, value: 'pomorskie' },
  { label: { en: 'Silesian', pl: 'Śląskie' }, value: 'slaskie' },
  { label: { en: 'Holy Cross', pl: 'Świętokrzyskie' }, value: 'swietokrzyskie' },
  { label: { en: 'Warmian-Masurian', pl: 'Warmińsko-Mazurskie' }, value: 'warminsko-mazurskie' },
  { label: { en: 'Greater Poland', pl: 'Wielkopolskie' }, value: 'wielkopolskie' },
  { label: { en: 'West Pomeranian', pl: 'Zachodniopomorskie' }, value: 'zachodniopomorskie' },
]

export type PolishProvince = (typeof POLISH_PROVINCES)[number]['value']
