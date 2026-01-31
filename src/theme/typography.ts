/**
 * Large, readable typography for accessibility.
 * Minimum 18sp body; headings scale up.
 */
export const fontSizes = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 22,
  xl: 26,
  xxl: 32,
  display: 40,
} as const;

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const lineHeights = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
} as const;
