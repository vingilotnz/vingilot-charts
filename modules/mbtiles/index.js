import MBTiles from '@mapbox/mbtiles'
import chokidar, { watch } from 'chokidar'
import { path } from 'osenv'
import { sources } from 'webpack'

export default function (moduleOptions) {

  console.log("Starting MBTile Server...")

  let mbtiles = new Map();

  // Setup File Watcher

  function addDatabase(path) {
    if (!path.match(/\.mbtiles$/)) {
      return
    }

    console.log(`Detected possible mbtile database ${path}`)
    new MBTiles(path + "?mode=ro", function (err, instance) {
      if (err) {
        console.error(`Could not load '${path}' (${err})`)
        return
      }

      instance.getInfo((err, info) => {
        if (err) {
          console.error(`Could not get metadata from '${path}' (${err})`)
          return
        }

        let mbtile = {
          path: path,
          instance: instance
        }

        for (let key of ['name', 'minzoom', 'maxzoom', 'format']) {
          if (!(key in info)) {
            console.error(`Could not process '${path}' ( '${key}' not present in metadata )`)
            return
          }

          mbtile[key] = info[key]
        }

        if (mbtiles.has(info.name)) {
          console.error(`Could not process '${path}' ( name '${info.name}' already used by '${mbtiles.get(info.name).path}' )`)
          return
        }

        console.log(`Loaded ${path} (${JSON.stringify(info)})`)

        mbtiles.set(info.name, mbtile)

        // TODO : Force update of tile list in client.
      })
    })
  }

  function removeDatabase(path) {
    mbtiles.forEach((mbtile, name) => {
      if (mbtile.path == path) {
        console.log(`Unloading '${path}' (${name})`)
        mbtiles.delete(name)
        // TODO : Force update of tile list in client.
        return;
      }
    })
  }


  const file_watcher = chokidar.watch(
    moduleOptions.charts,
    {
      persistent: true,
      awaitWriteFinish: true,
    }
  ).on('error', (error) => {
    console.error("File watcher error")
    console.error(error)
  })

  file_watcher.on('add', addDatabase)
    .on('unlink', removeDatabase)
    .on('change', (path) => {
      removeDatabase(path)
      addDatabase(path)
    })
    .on('ready', () => {
      console.log(file_watcher.getWatched())
    })


  this.nuxt.hook('listen', async function (server, { port }) {
  })

  // Disconnect when closing nuxt
  this.nuxt.hook('close', async function () {
    return file_watcher.close()
  })

  function getSourceList() {
    let sources = {}
    for (let [name, { minzoom, maxzoom, format }] of mbtiles) {
      sources[name] = {
        type: 'raster',
        tiles: [`tiles/${name}/{z}/{x}/{y}.{${format}}`],
        minzoom: minzoom,
        maxzoom: maxzoom,
        tileSize: 256,
      }
    }
    return sources
  }


  // Tile request handler

  // Uses "Connect" https://github.com/senchalabs/connect#appuseroute-fn
  function tileRequestHandler(req, res, next) {
    const mapbox_url_format = /^\/?(?:(?<tileset_id>[\w\.]+)\/)?(?<zoom>\d+)\/(?<x>\d+)\/(?<y>\d+)(?<dpi>@2x)?(?:\.(?<format>[\w\.]+))?/
    let args = req.url.match(mapbox_url_format)

    if ((args == undefined) || (args.groups == undefined)) {
      tileListHandler(req, res, next)
      return
    }

    args = args.groups

    let mbtiles_instance = 0;

    if (args.tileset_id) {
      if (!(mbtiles.has(args.tileset_id))) {
        res.writeHead(404, { 'Content-Type': "text/plain" });
        res.end(`Source not found (${args.tileset_id}), valid options are : ${Array.from(mbtiles.keys()).join(", ")}`);
        return;
      }
      mbtiles_instance = mbtiles.get(args.tileset_id).instance
    }
    else {
      mbtiles_instance = mbtiles.values().next().value.instance
    }

    switch (args.format) {
      default: {
        res.writeHead(400, { 'Content-Type': "text/plain" });
        res.end('ERROR ! Malformed request :' + req.url)
        return;
      }

      // Handle grid requests
      case "grid.json": {
        mbtiles_instance.getGrid(args.zoom, args.x, args.y,
          (err, grid, headers) => {
            if (err) {
              res.writeHead(404, { 'Content-Type': "text/plain" })
              res.end(`Grid not found (${err})`)
            } else {
              res.writeHead(200, headers)
              res.write(grid)
              res.end()
            }
          })
        return;
      }

      // Handle probable image requests
      case undefined:
      case "png":
      case "png32":
      case "png64":
      case "png128":
      case "png256":
      case "jpg":
      case "jpg70":
      case "jpg80":
      case "jpg90": {
        mbtiles_instance.getTile(args.zoom, args.x, args.y,
          (err, tile, headers) => {
            //console.log("Request : ")
            //console.log(args)
            //console.log(headers)
            if (err) {
              res.writeHead(404, { 'Content-Type': "text/plain" })
              res.end(`Tile not found (${err})`)
            } else {
              res.writeHead(200, headers)
              res.write(tile)
              res.end()
            }
          })
        return;
      }
    }
  }

  function tileListHandler(req, res, next) {
    let sources = getSourceList()
    let json = JSON.stringify(sources, null, 2)
    res.writeHead(200, { 'Content-Type': "application/json" })
    res.write(json)
    res.end()
  }

  this.addServerMiddleware(
    {
      path: '/tiles',
      handler: tileRequestHandler,
      prefix: false
    },
  )

}

  // REQUIRED if publishing the module as npm package
  //module.exports.meta = require('./package.json')