/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pauv Brand Colors
        background: "#000000",
        box: "#171717",
        "box-light": "#262626",
        "box-outline": "#404040",
        accent: {
          red: "#EF4444",
          logo: "#E5C68D",
          green: "#6EE7B7",
        },
      },
      fontFamily: {
        sans: ["var(--font-fira-code)", "Fira Code", "monospace"],
        mono: ["var(--font-fira-code)", "Fira Code", "monospace"],
        serif: [
          "var(--font-instrument-serif)",
          "Instrument Serif",
          "Georgia",
          "serif",
        ],
        garamond: [
          "var(--font-eb-garamond)",
          "EB Garamond",
          "Garamond",
          "Georgia",
          "serif",
        ],
      },
    },
  },
  plugins: [],
};

