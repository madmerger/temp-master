export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

export function readThemePreference(storage?: Storage): ThemePreference {
  try {
    const stored = (storage ?? window.localStorage).getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system'
      ? stored
      : 'system';
  } catch {
    return 'system';
  }
}

export function writeThemePreference(
  preference: ThemePreference,
  storage?: Storage,
): void {
  try {
    (storage ?? window.localStorage).setItem(THEME_STORAGE_KEY, preference);
  } catch {
    return;
  }
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  return preference === 'system'
    ? systemPrefersDark
      ? 'dark'
      : 'light'
    : preference;
}
