/** @type {import('tailwindcss').Config} */

/*
 * Colours are exposed to Tailwind as CSS custom properties rather than as literal
 * hex values, so a single token definition in globals.css drives both themes.
 * The previous config had no colour tokens at all, which forced every component
 * to carry a `dark:` twin for each colour — the mechanism that let the dark
 * theme drift into unreadable text.
 */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./components/**/*.{js,ts,jsx,tsx,mdx}', './app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        sunken: 'var(--surface-sunken)',
        line: 'var(--border)',
        'line-strong': 'var(--border-strong)',
        ink: {
          DEFAULT: 'var(--ink)',
          muted: 'var(--ink-muted)',
          subtle: 'var(--ink-subtle)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
          ink: 'var(--accent-ink)',
        },
        under: { DEFAULT: 'var(--under)', soft: 'var(--under-soft)' },
        fair: { DEFAULT: 'var(--fair)', soft: 'var(--fair-soft)' },
        over: { DEFAULT: 'var(--over)', soft: 'var(--over-soft)' },
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        content: '1120px',
      },
    },
  },
  plugins: [],
}
