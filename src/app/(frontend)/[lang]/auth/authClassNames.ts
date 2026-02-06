/**
 * Shared AuthView classNames — single source of truth for auth page styling.
 * Import and spread into each page's <AuthView classNames={...} />.
 */
export const authClassNames = {
  base: 'bg-white/75 dark:bg-background text-base-900 dark:text-foreground',
  content: 'font-montserrat text-base-900 dark:text-foreground',
  description: 'text-base-700 dark:text-base-400',
  title:
    'xl:text-5xl md:text-4xl sm:text-3xl text-2xl font-bebas font-light text-base-900 dark:text-foreground',
  form: {
    button: 'bg-base-900 text-foreground dark:bg-base-200 dark:text-base-900',
    providerButton: 'bg-base-100 text-base-900 dark:bg-base-800 dark:text-foreground',
    input: 'placeholder:text-base-600 dark:placeholder:text-base-400',
  },
  footer: 'text-base-700 dark:text-base-400',
  footerLink: 'text-accent hover:text-brand-800 dark:hover:text-brand-300',
} as const
