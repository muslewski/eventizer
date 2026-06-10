// eslint-config-next@16 ships native flat config; wrapping it in FlatCompat
// crashes eslintrc's validator ("Converting circular structure to JSON").
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // React-Compiler diagnostics introduced by eslint-config-next@16. The
      // ~29 pre-existing hits are tracked in
      // eventizer-mind/tech-debt/react-compiler-lint-findings.md — downgraded
      // to warnings until those components are reworked, so CI can gate on
      // lint errors without freezing on legacy findings.
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/static-components': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    // OfferMap calls useEffect after an early return — a real rules-of-hooks
    // violation that predates the lint gate. Scoped down to a warning HERE
    // ONLY (the rule stays an error everywhere else) until the component is
    // restructured; see eventizer-mind/tech-debt/react-compiler-lint-findings.md.
    // NB: literal (frontend)/[lang] segments are glob metacharacters, hence **.
    files: ['**/ogloszenia/**/components/OfferMap/index.tsx'],
    rules: {
      'react-hooks/rules-of-hooks': 'warn',
    },
  },
  {
    ignores: ['.next/'],
  },
]

export default eslintConfig
