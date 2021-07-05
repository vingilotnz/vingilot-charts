const chalk = require('chalk')
const boxen = require('boxen')
const { networkInterfaces } = require('os')

const { isIP } = require('net')
const bonjour = require('bonjour')()

const pkg_info = require('./package.json')

const fs = require('fs')
const express = require('express')
const https = require('https')
const path = require('path')

const { exit } = require('process')
import TileServer from './modules/mbtiles/tileServer.js'
import GeoServer from './modules/geodata/geoServer.js'


function getLocalFilePath(pathToFile) {
  if (path.isAbsolute(pathToFile)) return pathToFile;
  const cwd_path = path.join(process.cwd(), pathToFile)
  if (fs.existsSync(cwd_path)) return cwd_path
  const ep_path = path.join(path.dirname(process.execPath), pathToFile)
  return ep_path;
}

const default_config = {
  server: {
    host: "charts.local",
    port: 3000,
    https: {
      key: "./server.key",
      cert: "./server.crt"
    }
  },
  charts: [
    "./Charts"
  ],
  routes: [
    "./Routes"
  ]
}


console.log(boxen(chalk`
{bold.hex('#4296f5') ${pkg_info.name}} | {bold.hex('#f59342') version ${pkg_info.version}}

-------------------------------------------

Author: ${pkg_info.author}
Licence: ${pkg_info.license}
`, { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'grey' }))

// Load Config
const config_path = getLocalFilePath('./config.json');
let local_config = fs.existsSync(config_path)
let config = default_config;
if (local_config) {
  try {
    local_config = JSON.parse(fs.readFileSync(config_path))
    config = { ...config, ...local_config }
  } catch (err) {
    console.warn(`Failed to load '${config_path}' :\r\n\t${err}`)
    local_config = false
  }
}

config.charts = config.charts.map((chart) => getLocalFilePath(chart))
config.routes = config.routes.map((route) => getLocalFilePath(route))

if (!local_config) {
  console.warn(`Using default configuration!`)
}

console.log(config)

const host = (config.server && config.server.host) || 0
const port = (config.server && config.server.port) || 3000
const ssl = config.server.https || false


let protocol = 'http:'
const app = express()
let server = app;

app.use(express.static(getLocalFilePath('./dist')))

if (ssl) {
  const key_path = getLocalFilePath(ssl.key);
  const cert_path = getLocalFilePath(ssl.cert);

  if (!fs.existsSync(key_path)) {
    console.error(`SSL key '${key_path}' does not exist. Please check your ssl configuration.`);
    exit(1)
  }
  else {
    ssl.key = fs.readFileSync(key_path)
  }

  if (!fs.existsSync(cert_path)) {
    console.error(`SSL certificate '${cert_path}' does not exist. Please check your ssl configuration.`);
    exit(1)
  }
  else {
    ssl.cert = fs.readFileSync(cert_path)
  }

  server = https.createServer(ssl, app)
  app.use('/cert.crt', express.static(getLocalFilePath(cert_path)))
  protocol = 'https:'
}

const link = `${protocol}//${host}:${port}/`

// advertise an HTTP server on port 3000
if (host && !isIP(host)) {
  bonjour.publish({ name: "charts.vingilot.nz", host, type: ssl ? 'https' : 'http', port: port })
}


const nets = networkInterfaces()
const results = {}
const addresses = []
let res_str = ""

for (const name of Object.keys(nets)) {
  let temp_str = ""
  for (const net of nets[name]) {
    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    if (net.family === 'IPv4' && !net.internal) {
      if (!results[name]) {
        results[name] = [];
      }
      results[name].push(net.address);
      addresses.push(net.address)
      temp_str += `${net.address}, `
    }
  }
  if (temp_str.length) {
    res_str += `   ${name} : ${temp_str}\n`
  }
}




async function start() {

  const tileServer = new TileServer({ charts: config.charts, path: 'tiles' })
  tileServer.start()
  app.use('/tiles', tileServer.handler)

  const geoServer = new GeoServer({ route_folder: config.routes, path: 'routes' })
  geoServer.start()
  app.use('/routes', geoServer.handler)

  let availableOn = host ? `\n    - ${link}` : ``
  addresses.forEach((address) => {
    availableOn += `\n    - ${protocol}//${address}:${port}/`
  })

  server.listen(port)

  console.log(boxen(chalk`\n{bold.hex('#FFFFFF').bgHex('#368722') Server UP}\n\nAvailable on :${availableOn}\n`,
    { padding: { top: 1, bottom: 1, right: 4, left: 4 }, margin: { top: 1, bottom: 1, right: 4, left: 4 }, borderStyle: 'round', borderColor: '#368722' }))


}

start()