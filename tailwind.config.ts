import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ClickHouse surface ladder — RGB triplets resolved against
        // the active theme's CSS vars (dark default / light overrides).
        surface: {
          canvas: "rgb(var(--surface-canvas) / <alpha-value>)",
          soft: "rgb(var(--surface-soft) / <alpha-value>)",
          card: "rgb(var(--surface-card) / <alpha-value>)",
          elevated: "rgb(var(--surface-elevated) / <alpha-value>)",
          modal: "rgb(var(--surface-modal) / <alpha-value>)",
          border: "rgb(var(--surface-border) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          hover: "rgb(var(--accent-hover) / <alpha-value>)",
          muted: "rgb(var(--accent-muted) / <alpha-value>)",
        },
        // Semantic status colors (data-state only)
        status: {
          success: "rgb(var(--status-success) / <alpha-value>)",
          warning: "rgb(var(--status-warning) / <alpha-value>)",
          danger: "rgb(var(--status-danger) / <alpha-value>)",
          info: "rgb(var(--status-info) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "sans-serif",
        ],
        display: [
          "var(--font-display)",
          "Anton",
          "Impact",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "JetBrains Mono",
          "Fira Code",
          "Consolas",
          "Monaco",
          "Courier New",
          "monospace",
        ],
      },
      fontSize: {
        // ClickHouse type scale: tight, technical, purposeful
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.02em' }],
        'sm': ['0.8125rem', { lineHeight: '1.55', letterSpacing: '0.01em' }],
        'base': ['0.9375rem', { lineHeight: '1.6', letterSpacing: '0' }],
        'lg': ['1.0625rem', { lineHeight: '1.55', letterSpacing: '-0.01em' }],
        'xl': ['1.25rem', { lineHeight: '1.45', letterSpacing: '-0.015em' }],
        '2xl': ['1.5rem', { lineHeight: '1.35', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '1.25', letterSpacing: '-0.025em' }],
        '4xl': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.03em' }],
        '5xl': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.035em' }],
        '6xl': ['5rem', { lineHeight: '1.05', letterSpacing: '-0.04em' }],
        '7xl': ['7rem', { lineHeight: '1', letterSpacing: '-0.045em' }],
        // Stat callout sizes
        'stat-sm': ['2rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'stat-base': ['3rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'stat-lg': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.035em' }],
        'stat-xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
        ultra: '0.2em',
        // ClickHouse specific
        'mono-tight': '0.08em',
        'mono-wide': '0.15em',
      },
      spacing: {
        // 4px base unit
        '0': '0',
        '1': '0.25rem',   // 4px
        '2': '0.5rem',    // 8px
        '3': '0.75rem',   // 12px
        '4': '1rem',      // 16px
        '5': '1.25rem',   // 20px
        '6': '1.5rem',    // 24px
        '7': '1.75rem',   // 28px
        '8': '2rem',      // 32px
        '9': '2.25rem',   // 36px
        '10': '2.5rem',   // 40px
        '11': '2.75rem',  // 44px
        '12': '3rem',     // 48px
        '14': '3.5rem',   // 56px
        '16': '4rem',     // 64px
        '20': '5rem',     // 80px
        '24': '6rem',     // 96px (section rhythm)
        '28': '7rem',     // 112px
        '32': '8rem',     // 128px
      },
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',   // 4px
        'DEFAULT': '0.375rem', // 6px
        'md': '0.5rem',    // 8px
        'lg': '0.75rem',   // 12px
        'xl': '1rem',      // 16px
        '2xl': '1.5rem',   // 24px
        'full': '9999px',
      },
      boxShadow: {
        // ClickHouse: no shadows, only hairline borders for elevation
        'hairline': '0 0 0 1px rgb(42 42 42)',
        'card': '0 0 0 1px rgb(42 42 42)',
        'elevated': '0 0 0 1px rgb(42 42 42), 0 4px 16px -4px rgb(0 0 0 / 0.4)',
        'modal': '0 0 0 1px rgb(42 42 42), 0 8px 32px -8px rgb(0 0 0 / 0.5)',
      },
      transitionDuration: {
        'instant': '0ms',
        'fast': '100ms',
        'normal': '150ms',
        'slow': '200ms',
      },
      transitionTimingFunction: {
        'clickhouse': 'cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [],
};

export default config;