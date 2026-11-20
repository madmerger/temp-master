import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import hooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': hooks },
    rules: {
      ...hooks.configs.recommended.rules,
      'no-restricted-syntax': ['error',
        { selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]', message: 'HTML文字列の挿入は禁止です。' },
        { selector: 'MemberExpression[property.name="innerHTML"]', message: 'HTML文字列の挿入は禁止です。' },
      ],
    },
  },
)
