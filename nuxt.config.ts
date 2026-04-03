import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode',
    '@nuxtjs/i18n'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'system',
    fallback: 'dark',
    classSuffix: ''
  },

  i18n: {
    locales: [
      { code: 'id', name: 'Bahasa Indonesia', file: 'id.json' },
      { code: 'en', name: 'English', file: 'en.json' }
    ],
    // lazy: false,
    langDir: 'locales/',
    defaultLocale: 'id',
    strategy: 'no_prefix',
    detectBrowserLanguage: false
  },

  runtimeConfig: {
    public: {
      useMock: process.env.NUXT_PUBLIC_USE_MOCK || 'false',
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3000/api'
    }
  },

  routeRules: {
    '/api/**': {
      cors: true
    }
  },

  devServer: {
    port: 5173
  },

  compatibilityDate: '2024-07-11',
  vite: { 
    plugins: [
      tailwindcss() 
    ] 
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})