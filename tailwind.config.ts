import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand scale — derived from the logo's dominant orange
        brand: {
          50:  "#FFF8F0",
          100: "#FEECD8",
          200: "#FDD4A8",
          300: "#FBB978",
          400: "#F89A48",
          500: "#F57E20",
          600: "#E86515",  // primary action colour
          700: "#C4500F",
          800: "#9E3E0A",
          950: "#5E2005",
        },
        // Logo accent colours
        "tv-amber":   "#F5A820",  // yellow-amber (top triangle)
        "tv-magenta": "#C0145C",  // hot pink (bottom right)
        "tv-blue":    "#4A6ED4",  // blue (left panel)
        "tv-cyan":    "#48BEDA",  // cyan-blue (bottom left)
        "tv-charcoal":"#4A4D5A",  // dark shadow accent
      },
    },
  },
  plugins: [],
};
export default config;
