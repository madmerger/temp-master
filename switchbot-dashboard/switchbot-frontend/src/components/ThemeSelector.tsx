import { THEMES } from '../themes/themes';
import type { ThemeId } from '../types';

interface ThemeSelectorProps {
  themeId: ThemeId;
  onChange: (id: ThemeId) => void;
}

export function ThemeSelector({ themeId, onChange }: ThemeSelectorProps) {
  return (
    <div className="theme-selector">
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          className={`theme-btn ${themeId === theme.id ? 'active' : ''}`}
          onClick={() => onChange(theme.id)}
          title={theme.label}
          aria-label={`Switch to ${theme.label} theme`}
        >
          {theme.label}
        </button>
      ))}
    </div>
  );
}
