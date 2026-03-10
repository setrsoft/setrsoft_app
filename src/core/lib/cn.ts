/**
 * Merges class names. Supports strings, undefined, and arrays.
 * Can be replaced with a lib like clsx or tailwind-merge later.
 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ').trim() || '';
}
