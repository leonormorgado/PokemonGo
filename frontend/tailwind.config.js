import { colors } from './src/shared/styles/colors.ts';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors,
    },
  },
  plugins: [],
};
