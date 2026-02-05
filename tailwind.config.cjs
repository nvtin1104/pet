/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{vue,js,ts,jsx,tsx,html}',
    './src/pet/index.html',
    './src/settings/index.html',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Minimalist Color Palette
      colors: {
        // Mint Green Accent (unified across app)
        accent: {
          DEFAULT: '#64B48C',
          hover: '#7ac49e',
          light: '#8fd4ab',
          dark: '#4a9a72',
        },
        // Semantic colors
        danger: {
          DEFAULT: '#e74c3c',
          hover: '#c0392b',
        },
        warning: {
          DEFAULT: '#f39c12',
          hover: '#e67e22',
        },
        success: {
          DEFAULT: '#27ae60',
          hover: '#219a52',
        },
      },

      // Typography
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.75rem', { lineHeight: '2.25rem' }],
      },

      // Minimalist Border Radius
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
      },

      // Subtle Shadows
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        menu: '0 8px 32px rgba(0, 0, 0, 0.5)',
      },

      // Animations
      animation: {
        'fade-in': 'fadeIn 0.2s ease',
        'scale-in': 'scaleIn 0.15s ease-out',
        'blink': 'blink 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
      },

      // Transition timing
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
      },
    },
  },
  plugins: [],
};
