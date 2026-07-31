import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#f3f7fb',
        accent: '#123a6b',
        muted: '#7a8aa3',
        card: '#ffffff',
        ink: '#102240',
        brand: {
          blue: '#0b62cc',
          'blue-hover': '#0a55b3',
          green: '#1e9e63',
          'green-hover': '#188753',
          red: '#c93a3a',
        },
        border: '#e6edf6',
        pending: {
          bg: '#fff4e0',
          fg: '#9a6400',
        },
        approved: {
          bg: '#e4f6ec',
          fg: '#1e9e63',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Segoe UI', 'Arial', 'Helvetica', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 4px 16px rgba(10,20,40,0.06)',
        'publish-bar': '0 -4px 16px rgba(10,20,40,0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
