import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./mapa-unach-tux/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#94421A', // Sienna Bronce profundo
          hover: '#7D3412',
          active: '#63270A',
          light: '#F8EFEA',
          border: '#D99676',
        },
        copper: {
          50: '#fdf8f5',
          100: '#faede7',
          200: '#f4dacd',
          300: '#ebbea9',
          400: '#de997c',
          500: '#ce7452',
          600: '#b75b39',
          700: '#94421A', // Acento Sienna Bronce
          800: '#7D3412',
          900: '#63270A',
        },
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.02)',
        'modal': '0 12px 36px -4px rgba(0,0,0,0.08), 0 4px 12px -2px rgba(0,0,0,0.03)',
        'toast': '0 8px 24px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.02)',
        'skeuo-card': '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.95)',
        'skeuo-btn': '0 2px 4px rgba(148,66,26,0.22), 0 1px 2px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.25)',
        'skeuo-btn-neutral': '0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.95)',
        'skeuo-inset': 'inset 0 1px 2px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.85)',
        'skeuo-pill': '0 1px 3px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,1)',
        'skeuo-track': 'inset 0 1px 2px rgba(0,0,0,0.07), 0 1px 0 rgba(255,255,255,0.8)',
      },
      animation: {
        'fade-in': 'fadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
