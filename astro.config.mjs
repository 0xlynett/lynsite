import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@tailwindcss/vite";

import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), icon()],
  vite: {
    plugins: [
      tailwind({
        applyBaseStyles: false,
      }),
    ],
  },
});
