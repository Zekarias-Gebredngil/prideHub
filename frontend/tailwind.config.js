/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,scss}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8B1538',
          50:  '#fdf2f4',
          100: '#fce7ec',
          200: '#f9d0da',
          300: '#f4abbe',
          400: '#ec789a',
          500: '#e04d77',
          600: '#cc2d5a',
          700: '#ab1f47',
          800: '#8B1538',
          900: '#781535',
          950: '#43061a',
        },
        secondary: {
          DEFAULT: '#D4AF37',
          50:  '#fefde8',
          100: '#fffcc3',
          200: '#fff48a',
          300: '#ffe647',
          400: '#ffd114',
          500: '#efb807',
          600: '#D4AF37',
          700: '#a07d0b',
          800: '#846410',
          900: '#705213',
          950: '#422c05',
        },
        accent:  '#F8F5F2',
        dark:    '#2B2B2B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(139, 21, 56, 0.12)',
        luxury: '0 20px 60px rgba(139, 21, 56, 0.15)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #8B1538 0%, #2B2B2B 100%)',
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #f0d060 100%)',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
    },
  },
  plugins: [],
};
