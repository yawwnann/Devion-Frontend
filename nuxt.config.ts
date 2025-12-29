import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@nuxt/eslint", "@nuxt/ui", "@vueuse/nuxt", "@nuxtjs/color-mode"],

  runtimeConfig: {
    public: {
      useMock: process.env.NUXT_PUBLIC_USE_MOCK || "false",
      apiUrl: process.env.NUXT_PUBLIC_API_URL || "http://localhost:3000/api",
    },
  },

  devtools: {
    enabled: true,
  },

  colorMode: {
    preference: "system",
    fallback: "dark",
    classSuffix: "",
  },

  devServer: {
    port: 5173,
  },

  css: ["~/assets/css/main.css"],

  routeRules: {
    "/api/**": {
      cors: true,
    },
  },

  compatibilityDate: "2024-07-11",

  eslint: {
    config: {
      stylistic: {
        commaDangle: "never",
        braceStyle: "1tbs",
      },
    },
  },
  vite: { plugins: [tailwindcss()] },
});
