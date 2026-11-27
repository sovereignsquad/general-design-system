

/**
 * Initials from a display name: first grapheme of the first and last words, uppercased. One
 * word yields one initial; a name with no letter-like graphemes (an emoji handle) yields the
 * first grapheme alone — the mark never renders empty.
 */
export function gdsAvatarInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = [...words[0]][0] ?? '';
  const last = words.length > 1 ? [...words[words.length - 1]][0] ?? '' : '';
  return (first + last).toLocaleUpperCase();
}
