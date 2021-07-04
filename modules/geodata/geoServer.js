import chokidar from 'chokidar'  
import { basename } from 'path'
const tj = require('@tmcw/togeojson')
import fs from 'fs'
import { DOMParser  } from 'xmldom'

export default function ({route_folder, path}) {

  const routes = new Map()

  let fileWatcher = undefined

  const addRoute = (route) => {
    const id = route.id
    if (routes.has(id)) {
      console.error(`Could not process '${route.file_path}' ( id '${id}' already used by '${routes.get(id).file_path}' )`)
      return
    }

    routes.set(id, route)

    console.log(`Loaded route '${route.name}'`)
  }

  const removeRoute = (id) => {
    console.log(`Unloading route '${id}'`)
    routes.has(id) && routes.delete(id)
  }

  const addRouteFile = (file_path)  => {
    
    if (!file_path.match(/\.gpx$/)) {
      return
    }
    
    console.log(`Detected gpx file '${file_path}'`)
    const file_name = basename(file_path, '.gpx')

    let routeCandidates = [] 

    try {
      const gpx = new DOMParser().parseFromString(fs.readFileSync(file_path, "utf8"))
      const geoJson = tj.gpx(gpx, { styles: true })
      routeCandidates = geoJson.features.filter((feature) => feature && feature.properties && feature.properties._gpxType == 'rte')
    } catch (err) {
      console.error(`Failed to load gpx file '${file_path}' due to ${err}`)
      return
    }

    let i = 0;
    routeCandidates.forEach(feature => {
      const name = feature.properties.name || `unamed_${i++}`
      const id = `${name}`.replaceAll(' ', '_')
      addRoute({
        id,
        name,
        file_path,
        feature,
      })
    })
  }

  const removeRouteFile = (file_path)  => {
    console.log(`Unloading route file '${file_path}'`)
    routes.forEach((route, id) => (route.file_path == file_path) && removeRoute(id))
  }

  this.start = async () => {
    fileWatcher = chokidar.watch(
      route_folder,
      {
        persistent: true,
        awaitWriteFinish: true,
      }
    ).on('error', (error) => {
      console.error("File watcher error")
      console.error(error)
    })

    fileWatcher.on('add', addRouteFile)
      .on('unlink', removeRouteFile)
      .on('change', (file_path) => {
        removeRouteFile(file_path)
        addRouteFile(file_path)
      })
      .on('ready', () => {})
  }

  this.stop = async () => {
    fileWatcher.close()
  }


  // Route Request handler
  // Uses "Connect" https://github.com/senchalabs/connect#appuseroute-fn
  // 
  const routeRequestHandler = (req, res, next) => {

    const route_url_format = /^\/(?<route_id>.+?)(?:\.geojson)?$/
    const args = req.url.match(route_url_format)

    if ((args == undefined) || (args.groups == undefined)) {
      return false;
    }

    const { route_id } = args.groups
    let route = false

    if (route_id) {
      if (!(routes.has(route_id))) {
        res.writeHead(404, { 'Content-Type': "text/plain",
        'Access-Control-Allow-Origin' :'*' });
        res.end(`Route not found (${route_id}), valid options are : ${Array.from(routes.keys()).join(", ")}`);
        return true;
      }
      route = routes.get(route_id)
    }
    else {
      return false
    }

    const geojsonObj = {
      type: 'FeatureCollection',
      features: [
        route.feature,
      ],
    }

    const json = JSON.stringify(geojsonObj, null, 2)
    res.writeHead(200, { 'Content-Type': "application/json",
    'Access-Control-Allow-Origin' :'*' })
    res.write(json)
    res.end()

    return true;
  }

  const getRouteList = () => {
    let routeList = {}
    for (let [route_id] of routes) {
      const route = routes.get(route_id)
      routeList[route_id] = {
        name: route.name,
        description: route.feature.properties.description || '',
        type: 'geojson',
        url: `${path}/${route_id}.geojson`,
      }
    }
    const sorted = Object.keys(routeList)
    .sort()
    .reduce((acc, key) => ({
      ...acc, [key]: routeList[key]
    }), {})
    return sorted
  }

  const routeListHandler = (req, res, next) => {
    if (!req.url.match(/^\/(?:\?.*)?/)) {
      return false
    }
    const list = getRouteList()
    const json = JSON.stringify(list, null, 2)
    res.writeHead(200, { 'Content-Type': "application/json",
    'Access-Control-Allow-Origin' :'*' })
    res.write(json)
    res.end()

    return true
  }


  this.handler = (req, res, next) => {
    if (!(routeRequestHandler(req, res)
      || routeListHandler(req, res)
    )) {
      res.writeHead(400, { 'Content-Type': "text/plain",
      'Access-Control-Allow-Origin' :'*' });
      res.end('ERROR ! Malformed request :' + req.url)
      return;
    }
  }
}