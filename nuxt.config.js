const path = require('path')
const fs = require('fs')
module.exports = {
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  telemetry: false,

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'charts.vingilot.nz',
    htmlAttrs: {
      lang: 'en',
    },
    meta: [
      { charset: 'utf-8' },
      //{ name: 'viewport', content: 'user-scalable=no, width=device-width, minimum-scale=1,  maximum-scale=1' },
      //{ hid: 'description', name: 'description', content: '' },
      //{ name: 'apple-mobile-web-app-capable', content: 'yes' }
    ],
    link: [
      //{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      //{ rel: 'mask-icon', type: 'image/svg+xml', href: '/favicon.svg' }
    ],
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    { src: 'maplibre-gl/dist/maplibre-gl.css', lang: 'css' },
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    { src: '~/plugins/vuex-persist', ssr: false }
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module',
    // https://go.nuxtjs.dev/tailwindcss
    '@nuxtjs/tailwindcss',
    // https://pwa.nuxtjs.org/
    '@nuxtjs/pwa',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    '@nuxt/http',
    '~/modules/mbtiles',
    '~/modules/geodata',
    '~/modules/fonts',
  ],

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    loaders: {
      css: { // Ignore missing images in source css :/
        url(url) {
          return fs.existsSync(url)
        },
      },
    },
    plugins: [
    ],
  },

  server: {
    host: 0,
    port: 3000,
    https: {
      key: fs.readFileSync('./server.key'),
      cert: fs.readFileSync('./server.crt')
    }
  },

  pwa: {
    manifest: {
      start_url: '/'
    },
    meta: {
      mobileAppIOS: true,
      nativeUI: true
    },
    workbox: {
      workboxURL: '/workbox/workbox-sw.js'
    }
  },

  charts: [
    "../../Charts"
  ],
  routes: [
    "../../Routes"
  ],
  fonts: [
    "pkg/Fonts"
  ],

}
