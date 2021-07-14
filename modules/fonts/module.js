import FontServer from './fontServer'

const { resolve, join } = require('path')

export default function (options) {

  if (!options.namespace) options.namespace = 'fontServer'
  if (!options.path) options.path = '/fonts'
  const { namespace, path } = options

  console.log (`Creating Font Server (${namespace}, ${path})\n`)

  const fonts = []
  if (options && options.fonts) fonts.push(options.fonts)
  if (this.options && this.options.fonts) fonts.push(this.options.fonts)

  const fontServer = new FontServer({ font_folder: fonts, path: path.replace(/^\//,'') })


  this.nuxt.hook('listen', async function (server, { port }) {
    console.log (`${namespace} will search the following directories for fonts : `)
    for ( const [font_path] of fonts) {
      console.log(` - '${font_path}'`)
    }
    console.log(`\n`)
  
    return fontServer.start()
  })

  this.nuxt.hook('close', async function (server, { port }) {
    return fontServer.stop()
  })

  this.addServerMiddleware(
    {
      path,
      handler: fontServer.handler,
      prefix: false
    },
  )
}

module.exports.meta = require('./package.json')