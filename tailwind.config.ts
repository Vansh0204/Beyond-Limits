import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        nordic: {
          midnight: '#121E26',
          slate: '#4A555E',
          steel: '#7E94A8',
          mist: '#CAD3D7',
          ice: '#F4FAF9',
        },
        emerald: {
          50: '#F4FAF9',
          100: '#CAD3D7',
          500: '#7E94A8',
          600: '#4A555E',
          700: '#121E26',
        },
        rose: {
          50: '#F4FAF9',
          100: '#CAD3D7',
          500: '#7E94A8',
          600: '#4A555E',
          700: '#121E26',
        },
        indigo: {
          50: '#F4FAF9',
          100: '#CAD3D7',
          500: '#7E94A8',
          600: '#4A555E',
          700: '#121E26',
        },
        purple: {
          50: '#F4FAF9',
          100: '#CAD3D7',
          500: '#7E94A8',
          600: '#4A555E',
          700: '#121E26',
        }
      },
    },
  },
  plugins: [],
};
export default config;
