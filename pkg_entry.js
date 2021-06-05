const { loadNuxt } = require('nuxt-start')

// Import and Set Nuxt.js options
let config = require('./nuxt.config.js')


async function start () {
    const nuxt = await loadNuxt('start')
    await nuxt.listen(3000, "localhost")
}

start()