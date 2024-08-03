import scrollbar from "tailwind-scrollbar";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        red: {
          full: "#ff0000",
        },
        green: {
          full: "#00ff00",
        },
        blue: {
          full: "#0000ff",
        },
      },
    },
  },
  plugins: [scrollbar()],
};
