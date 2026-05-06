/**
 * ProGarden — Centralized Color Tokens
 * Single source of truth for all colors used across the app.
 * Import as: import { C } from '../constants/colors';
 */

// ─── Brand ──────────────────────────────────────────────────────────────────
export const PRIMARY    = '#134E3A';
export const HEADER_BG  = '#0A3D2E';
export const ACCENT     = '#FF8A00';
export const ROSE       = '#F43F5E';

// ─── Greens ─────────────────────────────────────────────────────────────────
export const GREEN_50   = '#F0FDF4';
export const GREEN_100  = '#D1FAE5';
export const GREEN_200  = '#EFFAF2';
export const GREEN_400  = '#48BB78';
export const GREEN_500  = '#10B981';
export const GREEN_600  = '#059669';
export const GREEN_800  = '#065F46';
export const GREEN_900  = '#021F17';

// ─── Light Mode ─────────────────────────────────────────────────────────────
export const BG_LIGHT       = '#F8FAFC';
export const BG_LIGHT_ALT   = '#F4F6F8';
export const CARD_LIGHT     = '#FFFFFF';
export const BORDER_LIGHT   = '#E2E8F0';
export const BORDER_LIGHT_2 = '#E8EDF2';
export const BORDER_LIGHT_3 = '#F1F5F9';
export const TEXT_MAIN       = '#0F172A';
export const TEXT_SUB        = '#64748B';
export const TEXT_MUTED      = '#94A3B8';
export const TEXT_FAINT      = '#9CA3AF';
export const INPUT_BG        = '#F8FAFC';

// ─── Dark Mode ──────────────────────────────────────────────────────────────
export const BG_DARK         = '#121212';
export const BG_DARK_ALT     = '#111111';
export const CARD_DARK       = '#1E1E1E';
export const CARD_DARK_2     = '#1C1C1E';
export const BORDER_DARK     = '#2C2C2E';
export const BORDER_DARK_2   = '#3A3A3C';
export const TEXT_DARK_MAIN   = '#F5F5F5';
export const TEXT_DARK_SUB    = '#A1A1AA';
export const INPUT_BG_DARK    = '#2C2C2E';

// ─── Semantic ───────────────────────────────────────────────────────────────
export const SUCCESS     = '#10B981';
export const WARNING     = '#F6AD55';
export const ERROR       = '#EF4444';
export const INFO        = '#3B82F6';

// ─── Status Badge Colors ────────────────────────────────────────────────────
export const STATUS = {
  ACTIVE:    { bg: '#D1FAE5', text: '#065F46' },
  INACTIVE:  { bg: '#FEE2E2', text: '#991B1B' },
  QUOTED:    { bg: '#FEF3C7', text: '#92400E' },
  CONVERTED: { bg: '#DBEAFE', text: '#1E40AF' },
};

// ─── Avatar Palettes ────────────────────────────────────────────────────────
export const AVATAR_PALETTES = [
  { bg: '#D1FAE5', text: '#065F46' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#DBEAFE', text: '#1E40AF' },
  { bg: '#EDE9FE', text: '#5B21B6' },
  { bg: '#FCE7F3', text: '#9D174D' },
  { bg: '#FFEDD5', text: '#9A3412' },
];

/**
 * Shorthand helper — returns dark/light value based on isDark flag.
 * Usage: themed(isDark, '#1E1E1E', '#FFFFFF')
 */
export const themed = (isDark, dark, light) => isDark ? dark : light;

/**
 * Full palette object for convenience.
 */
export const C = {
  PRIMARY, HEADER_BG, ACCENT, ROSE,
  BG_LIGHT, BG_DARK, CARD_LIGHT, CARD_DARK,
  BORDER_LIGHT, BORDER_DARK, TEXT_MAIN, TEXT_SUB,
  TEXT_DARK_MAIN, TEXT_DARK_SUB, INPUT_BG, INPUT_BG_DARK,
  SUCCESS, WARNING, ERROR, INFO, STATUS, AVATAR_PALETTES,
  themed,
};

export default C;
