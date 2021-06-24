import MBTiles from '@mapbox/mbtiles'
import chokidar from 'chokidar'
import { basename } from 'path'

export default function ({charts}) {

  const mbtiles = new Map()

  let fileWatcher = undefined

  const addDatabase = (file_path)  => {
    
    if (!file_path.match(/\.mbtiles$/)) {
      return
    }
    

    console.log(`Detected possible mbtile database '${file_path}'`)
    new MBTiles(file_path + "?mode=ro", function (err, instance) {

      if (err) {
        console.error(`Could not load '${file_path}' (${err})`)
        return
      }

      instance.getInfo(function (err, info) {
        if (err) {
          console.error(`Could not get metadata from '${file_path}' (${err})`)
          return
        }

        let mbtile = {
          file_path: file_path,
          instance: instance
        }

        for (let key of ['name', 'description', 'attribution', 'minzoom', 'maxzoom', 'format', 'bounds', 'version']) {
          if (!(key in info)) {
            console.error(`Could not process '${file_path}' ( '${key}' not present in metadata )`)
            return
          }

          mbtile[key] = info[key]
        }

        mbtile['tileset_id'] = info['tileset_id'] || basename(file_path, '.mbtiles')

        if (mbtiles.has(mbtile['tileset_id'])) {
          console.error(`Could not process '${file_path}' ( tileset_id '${mbtile['tileset_id']}' already used by '${mbtiles.get(mbtile['tileset_id']).file_path}' )`)
          return
        }

        console.log(`Loaded '${file_path}' (${mbtile['name']})`)

        mbtiles.set(mbtile['tileset_id'], mbtile)
        //$store[namespace].ADD_TILE(mbtile['tileset_id'], mbtile)

        // TODO : Force update of tile list in client.
      })
    })
  }

  const removeDatabase = (file_path) => {
    mbtiles.forEach((mbtile, tileset_id) => {
      if (mbtile.file_path == file_path) {
        console.log(`Unloading '${file_path}' (${tileset_id})`)
        
        mbtiles.delete(tileset_id)
        //$store[namespace].REMOVE_TILE(mbtile['tileset_id'], mbtile)
      }
    })
  }

  this.start = async () => {
    fileWatcher = chokidar.watch(
      charts,
      {
        persistent: true,
        awaitWriteFinish: true,
      }
    ).on('error', (error) => {
      console.error("File watcher error")
      console.error(error)
    })

    fileWatcher.on('add', addDatabase)
      .on('unlink', removeDatabase)
      .on('change', (file_path) => {
        removeDatabase(file_path)
        addDatabase(file_path)
      })
      .on('ready', () => {
        //console.log(fileWatcher.getWatched())
      })
  }

  this.stop = async () => {
    fileWatcher.close()
  }


  // Tile request handler
  // Uses "Connect" https://github.com/senchalabs/connect#appuseroute-fn
  const tileRequestHandler = (req, res, next) => {

    const mapbox_url_format = /^\/(?:(?<tileset_id>[\w\.]+)\/)?(?<zoom>\d+)\/(?<x>\d+)\/(?<y>\d+)(?<dpi>@2x)?(?:\.(?<format>[\w\.]+))?/
    let args = req.url.match(mapbox_url_format)

    if ((args == undefined) || (args.groups == undefined)) {
      return false;
    }

    args = args.groups

    let mbtiles_instance;

    if (args.tileset_id) {
      if (!(mbtiles.has(args.tileset_id))) {
        res.writeHead(404, { 'Content-Type': "text/plain",
        'Access-Control-Allow-Origin' :'*' });
        res.end(`Tileset not found (${args.tileset_id}), valid options are : ${Array.from(mbtiles.keys()).join(", ")}`);
        return true;
      }
      mbtiles_instance = mbtiles.get(args.tileset_id).instance
    }
    else {
      mbtiles_instance = mbtiles.values().next().value.instance
    }

    switch (args.format) {
      default: {
        return false;
      }

      // Handle grid requests
      case "grid.json": {
        mbtiles_instance.getGrid(args.zoom, args.x, args.y,
          (err, grid, headers) => {
            if (err) {
              res.writeHead(404, { 'Content-Type': "text/plain",
              'Access-Control-Allow-Origin' :'*' })
              res.end(`Grid not found (${err})`)
            } else {
              headers['Access-Control-Allow-Origin'] = '*'
              res.writeHead(200, headers)
              res.write(grid)
              res.end()
            }
          })
        break;
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
              res.writeHead(404, { 'Content-Type': "text/plain",
              'Access-Control-Allow-Origin' :'*' })
              res.end(`Tile not found (${err})`)
            } else {
              headers['Access-Control-Allow-Origin'] = '*'
              res.writeHead(200, headers)
              res.write(tile)
              res.end()
            }
          })
        break;
      }
    }
    return true;
  }

  // Tile list handler
  const getSourceList = () => {
    let sources = {}
    for (let [tileset_id] of mbtiles) {
      sources[tileset_id] = {
        name: mbtiles.get(tileset_id).name,
        type: 'raster',
        url: `tiles/${tileset_id}.json`,
        tileSize: 256,
      }
    }
    const sorted = Object.keys(sources)
    .sort()
    .reduce((acc, key) => ({
      ...acc, [key]: sources[key]
    }), {})
    return sorted
  }

  const tileListHandler = (req, res, next) => {
    if (!req.url.match(/^\/(?:\?.*)?/)) {
      next()
      return false
    }
    let sources = this.getSourceList()
    let json = JSON.stringify(sources, null, 2)
    res.writeHead(200, { 'Content-Type': "application/json",
    'Access-Control-Allow-Origin' :'*' })
    res.write(json)
    res.end()

    return true
  }


  // Tile JSON handler

  const getTilesJson = ({ tileset_id, name, description, attribution, format, minzoom, maxzoom, bounds, version }) => {
    return {
      tilejson: '2.2.0',
      tiles: [`tiles/${tileset_id}/{z}/{x}/{y}.{${format}}`],
      name, version, description, attribution, minzoom, maxzoom, bounds,
    }
  }

  const tileJSONHandler = (req, res) => {
    let args = req.url.match(/^\/(?<tileset_id>[^\/]+?)(?:\.json)?(?:\?.*)?$/)
    if ((args == undefined) || (args.groups == undefined)) {
      return false;
    }

    args = args.groups

    let tileset;

    if (args.tileset_id) {
      if (!(mbtiles.has(args.tileset_id))) {
        res.writeHead(404, { 'Content-Type': "text/plain" });
        res.end(`Tileset not found (${args.tileset_id}), valid options are : ${Array.from(mbtiles.keys()).join(", ")}`);
        return true;
      }
      tileset = mbtiles.get(args.tileset_id)
    }
    else {
      tileset = mbtiles.values().next().value
    }

    let sources = getTilesJson(tileset)
    let json = JSON.stringify(sources, null, 2)
    res.writeHead(200, { 
      'Content-Type': "application/json",
      'Access-Control-Allow-Origin' :'*'
    })
    res.write(json)
    res.end()

    return true
  }

  this.getSourceList = getSourceList

  this.handler = (req, res, next) => {
    if (!(tileRequestHandler(req, res)
      || tileJSONHandler(req, res)
      || tileListHandler(req, res)
    )) {
      res.writeHead(400, { 'Content-Type': "text/plain",
      'Access-Control-Allow-Origin' :'*' });
      res.end('ERROR ! Malformed request :' + req.url)
      return;
    }
  }
}