import displayNames from '../../../display_names.json'

export const DISPLAY_NAMES: Record<string, string> = displayNames

export function getDisplayName(name: string): string {
  return DISPLAY_NAMES[name] ?? name
}
