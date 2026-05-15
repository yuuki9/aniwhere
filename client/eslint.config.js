import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dist-static', '.granite']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@toss/tds-mobile',
              message: 'Use @aniwhere/tds-mobile so public domain builds resolve to the local fallback.',
            },
            {
              name: '@toss/tds-mobile-ait',
              message: 'Import this only inside the Apps in Toss runtime adapter.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/shared/ui/tdsMobile/apps-in-toss.tsx', 'src/shared/ui/tdsRuntime/apps-in-toss.tsx'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
])
