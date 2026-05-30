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
        "lipi-cream": "#F5F2EA",
        "lipi-green": "#C7F04F",
        "lipi-lavender": "#C9B6F5",
        "lipi-dark": "#123524",
        "lipi-text": "#111111",
        "lipi-border": "#111111",
        "lipi-muted": "#888888",
      },
      fontFamily: {
        "space-grotesk": ["var(--font-space-grotesk)", "sans-serif"],
        cormorant: ["var(--font-cormorant)", "serif"],
        caveat: ["var(--font-caveat)", "cursive"],
      },
      boxShadow: {
        brutal: "4px 4px 0px #111111",
        "brutal-sm": "2px 2px 0px #111111",
        "brutal-lg": "6px 6px 0px #111111",
        "brutal-hover": "2px 2px 0px #111111",
        "brutal-green": "4px 4px 0px #C7F04F",
        "brutal-lavender": "4px 4px 0px #C9B6F5",
      },
      borderWidth: {
        "3": "3px",
      },
      animation: {
        "marquee": "marquee 20s linear infinite",
        "float": "float 3s ease-in-out infinite",
        "wiggle": "wiggle 2s ease-in-out infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
