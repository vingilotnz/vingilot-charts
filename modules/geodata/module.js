import GeoServer from './geoServer'

const { resolve, join } = require('path')

export default function (options) {

  if (!options.namespace) options.namespace = 'geoServer'
  if (!options.path) options.path = '/routes'
  const { namespace, path } = options

  console.log (`Creating Geodata Server (${namespace}, ${path})\n`)

  const routes = []
  if (options && options.routes) routes.push(options.routes)
  if (this.options && this.options.routes) routes.push(this.options.routes)

  const geoServer = new GeoServer({ route_folder: routes, path: path.replace(/^\//,'') })


  this.nuxt.hook('listen', async function (server, { port }) {
    console.log (`${namespace} will search the following directories for routes : `)
    for ( const [route_path] of routes) {
      console.log(` - '${route_path}'`)
    }
    console.log(`\n`)
  
    return geoServer.start()
  })

  this.nuxt.hook('close', async function (server, { port }) {
    return geoServer.stop()
  })

  this.addServerMiddleware(
    {
      path,
      handler: geoServer.handler,
      prefix: false
    },
  )
}

module.exports.meta = require('./package.json')