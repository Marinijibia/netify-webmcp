/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Official Netify Navy Scale
        navy: {
          50: '#F0F6F9',
          100: '#DCEAF0',
          200: '#B9D5E0',
          300: '#8FB7C7',
          400: '#5F94A9',
          500: '#326F88',
          600: '#0F5470',
          700: '#003F5F',
          800: '#003658',
          900: '#003051', // Primary Brand
          950: '#001D31',
        },
        // Official Netify Teal Scale
        teal: {
          50: '#ECFDF8',
          100: '#D3F8ED',
          200: '#A8F0DB',
          300: '#72E2C4',
          400: '#3AD0A9',
          500: '#00B994',
          600: '#00A581', // Official Netify Teal (Primary Accent)
          700: '#008B6E',
          800: '#006F59',
          900: '#005542',
          950: '#003A2D',
        },
        // Netify Slate Scale
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        // Semantic Brand & Surface Tokens
        primary: {
          DEFAULT: '#003051',
          pressed: '#001D31',
          soft: '#F0F6F9',
        },
        accent: {
          DEFAULT: '#00A581',
          pressed: '#008B6E',
          soft: '#ECFDF8',
        },
        background: '#F8FAFC',
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F1F5F9',
          raised: '#FFFFFF',
          border: '#E2E8F0',
        },
        border: {
          DEFAULT: '#E2E8F0',
          strong: '#CBD5E1',
        },
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          900: '#14532D',
          DEFAULT: '#16A34A',
          soft: '#F0FDF4',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          900: '#78350F',
          DEFAULT: '#D97706',
          soft: '#FFFBEB',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          900: '#7F1D1D',
          DEFAULT: '#DC2626',
          soft: '#FEF2F2',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
    },
  },
  plugins: [],
};
