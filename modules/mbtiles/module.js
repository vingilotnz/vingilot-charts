import TileServer from './tileServer'

const { resolve, join } = require('path')

export default function (options) {

  if (!options.namespace) options.namespace = 'mbtileServer'
  if (!options.path) options.path = '/tiles'
  const { namespace, path } = options

  console.log (`Creating MBTile Server (${namespace}, ${path})\n`)

  const charts = []
  if (options && options.charts) charts.push(options.charts)
  if (this.options && this.options.charts) charts.push(this.options.charts)

  const tileServer = new TileServer({ charts, path: path.replace(/^\//,'') })

  // add all of the initial plugins
  const pluginsToSync = [
    //'components/index.js',
    //'store/index.js',
    //'plugins/index.js',
    //'debug.js',
  ]
  
  for (const pathString of pluginsToSync) {
    this.addPlugin({
      src: resolve(__dirname, pathString),
      fileName: join(namespace, pathString),
      options
    })
  }

  this.nuxt.hook('listen', async function (server, { port }) {
    console.log (`${namespace} will search the following directories for mbtiles : `)
    for ( const [chart] of charts) {
      console.log(` - '${chart}'`)
    }
    console.log(`\n`)
  
    return tileServer.start()
  })

  this.nuxt.hook('close', async function (server, { port }) {
    return tileServer.stop()
  })

  this.addServerMiddleware(
    {
      path,
      handler: tileServer.handler,
      prefix: false
    },
  )
}

module.exports.meta = require('./package.json')