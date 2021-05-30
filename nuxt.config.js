import mbtiles from "./modules/mbtiles";
const webpack = require('webpack');
import { resolve } from 'path'

export default {
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'charts.vingilot.nz',
    htmlAttrs: {
      lang: 'en',
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'user-scalable=no, width=device-width, minimum-scale=1,  maximum-scale=1' },
      { hid: 'description', name: 'description', content: '' },
    ],
    link: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'mask-icon', type: 'image/svg+xml', href: '/favicon.svg' }
    ],
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    { src: 'mapbox-gl/dist/mapbox-gl.css', lang: 'css' },
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module',
    // https://go.nuxtjs.dev/tailwindcss
    '@nuxtjs/tailwindcss',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    ['~/modules/mbtiles', 
      //{ chart : "./charts/test.mbtiles" }
      { chart : "./charts/google_hybrid_satellite.mbtiles" }
    ]
  ],

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    plugins: [
      new webpack.ProvidePlugin({
        // global modules
        mapboxgl: 'mapbox-gl',
      })
    ],
  },


}
