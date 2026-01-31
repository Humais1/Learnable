/**
 * High-contrast, accessible palette for visually impaired users.
 * WCAG AAA target for text; min 44pt touch targets enforced in layout.
 */
export const colors = {
  // Primary – strong contrast on dark
  primary: '#00D9A5',
  primaryDark: '#00B386',
  primaryLight: '#5CFFD0',

  // Surfaces
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceElevated: '#252542',
  card: '#1E1E35',

  // Text – high contrast
  text: '#FFFFFF',
  textSecondary: '#B8B8D1',
  textMuted: '#6B6B8A',
  onPrimary: '#0F0F1A',

  // Semantic
  success: '#00D9A5',
  warning: '#FFB84D',
  error: '#FF6B6B',
  info: '#6B9FFF',

  // Borders
  border: '#2D2D4A',
  borderLight: '#3D3D5C',
} as const;

export type ColorKey = keyof typeof colors;
