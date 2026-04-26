import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        wb: {
          navy: '#002244',
          blue: '#009FDF',
          sky: '#4BA6DF',
          sand: '#F4F1EC',
          ink: '#0B0F14',
          line: '#D9DCE0',
        },
        ys: {
          teal: '#00A499',
          amber: '#F4B400',
          coral: '#E2553C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
