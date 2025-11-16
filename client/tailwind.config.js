/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00C300', // LINE green
          dark: '#00B300',
          light: '#00E676',
        },
        'primary-dark': '#00A000',
        secondary: {
          DEFAULT: '#00C300',
          light: '#00E676',
        },
        accent: {
          DEFAULT: '#00C300',
          light: '#00E676',
        },
        light: {
          DEFAULT: '#E8F5E9', // Light green background
        },
        line: {
          green: '#00C300',
          'green-dark': '#00B300',
          'green-light': '#00E676',
          background: '#F5F5F5',
          'chat-sent': '#DCF8C6',
          'chat-received': '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
}

