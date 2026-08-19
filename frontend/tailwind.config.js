/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta del tema oscuro: azul profundo institucional, no gris neutro
        noche: {
          950: '#060B14',
          900: '#0B1421',
          850: '#111C2D',
          800: '#16243A',
          700: '#1F3352',
          600: '#2B456B',
          500: '#3A5A87'
        },
        institucional: {
          50: '#F2F6FA',
          100: '#E1EAF4',
          200: '#C2D5E8',
          300: '#94B6D6',
          400: '#5F91BF',
          500: '#3B72A5',
          600: '#2A5A88',
          700: '#1D6FB8',
          800: '#15406B',
          900: '#0F2A47'
        }
      },
      fontFamily: {
        sans: ['Segoe UI', 'Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        panel: '0 1px 2px rgba(15, 42, 71, 0.06), 0 8px 24px rgba(15, 42, 71, 0.08)'
      }
    }
  },
  plugins: []
};
