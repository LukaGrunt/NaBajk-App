/**
 * NaBajk Brand Design Tokens
 * Strict color system — use these exact values only
 */

export const Colors = {
  // Brand Colors
  brandGreen: '#0BBF76',      // Primary — CTAs, active states, interactive elements
  greenDark: '#089958',        // Pressed/hover states
  greenLight: '#33CC91',       // Subtle highlights, Easy difficulty

  // Neutrals
  background: '#0A0A0B',       // App background
  surface1: '#131214',         // Cards, containers
  surface2: '#1A1A1D',         // Elevated elements
  border: '#2A2A2E',           // Dividers, separators, card outlines

  // Text
  textPrimary: '#FAFAFA',      // Headings, main text
  textSecondary: '#8A8A8F',    // Captions, muted text

  // Accent (USE SPARINGLY — only for highlights and achievements)
  accentOrange: '#FF6B35',     // Difficulty Medium, rare highlights

  // Semantic (difficulty badges, errors)
  difficultyHard: '#EF4444',   // Hard difficulty badge
  errorRed: '#EF4444',         // Errors, destructive actions

  // Legacy aliases (for gradual migration — will be removed)
  /** @deprecated Use surface1 */ cardSurface: '#131214',
  /** @deprecated Use surface2 */ elevatedSurface: '#1A1A1D',
  /** @deprecated Use textMuted or textSecondary */ textMuted: '#8A8A8F',
};

export default Colors;
