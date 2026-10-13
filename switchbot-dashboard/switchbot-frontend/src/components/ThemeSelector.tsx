import { useTheme } from '../theme/ThemeProvider';
import type { ThemePreference } from '../theme/themePreference';

const options: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'ライト' },
  { value: 'dark', label: 'ダーク' },
  { value: 'system', label: 'システム' },
];

export function ThemeSelector() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      className="inline-flex rounded-lg border border-gray-300 bg-gray-100 p-1 dark:border-gray-600 dark:bg-gray-800"
      role="group"
      aria-label="Theme preference"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`rounded-md px-2 py-1 text-xs font-medium transition sm:px-3 ${
            preference === option.value
              ? 'bg-white text-gray-900 shadow dark:bg-gray-600 dark:text-white'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
          }`}
          aria-label={option.label}
          aria-pressed={preference === option.value}
          onClick={() => setPreference(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
