import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      className="rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
    >
      {theme === 'dark' ? (
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M21 15.2A9 9 0 0 1 8.8 3 9 9 0 1 0 21 15.2Z" />
        </svg>
      )}
    </button>
  );
}
