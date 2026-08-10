import { Moon, Sun } from 'lucide-react'

interface ThemeToggleProps {
  theme: 'light' | 'dark'
  toggle: () => void
}

export default function ThemeToggle({ theme, toggle }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full p-2 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-yellow-300 dark:hover:bg-gray-600 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}
