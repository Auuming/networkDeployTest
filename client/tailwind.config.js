/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#473472',
          dark: '#3A2A5C',
          light: '#5A4478',
        },
        'primary-dark': '#3A2A5C',
        secondary: {
          DEFAULT: '#53629E',
          light: '#6B7AB8',
        },
        accent: {
          DEFAULT: '#87BAC3',
          light: '#A5D0D8',
        },
        light: {
          DEFAULT: '#D6F4ED',
        },
      },
    },
  },
  plugins: [],
}

