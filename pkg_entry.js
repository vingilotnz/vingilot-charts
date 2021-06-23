const { loadNuxt } = require('nuxt-start')
const chalk = require('chalk')
const boxen = require('boxen')
const { networkInterfaces } = require('os')

const { isIP } = require('net')
const bonjour = require('bonjour')()

const pkg_info = require('./package.json')

console.log(boxen(chalk`
{bold.hex('#4296f5') ${pkg_info.name}} | {bold.hex('#f59342') version ${pkg_info.version}}

-------------------------------------------

Author: ${pkg_info.author}
Licence: ${pkg_info.license}
`, {padding: 1, margin: 1, borderStyle: 'round', borderColor: 'grey'}))

// Import and Set Nuxt.js options
const config = require('./nuxt.config.js');

const host = (config.server && config.server.host) || 0
const port = (config.server && config.server.port) || 3000

// advertise an HTTP server on port 3000
if ( host && !isIP(host) )
{
    bonjour.publish({ name: "charts.vingilot.nz", host, type: 'https', port: port })
}

const args = process.argv.slice(2);

if (args.length) {
    config.charts = args
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
    if(temp_str.length) {
        res_str += `   ${name} : ${temp_str}\n`
    }
}

async function start () {
    const nuxt = await loadNuxt('start')
    await nuxt.listen(port, host)

    if(host) {
        console.log(boxen(chalk`
{bold.hex('#FFFFFF').bgHex('#368722') Server UP} Available on https://${host}:${port}/
`, {padding: 1, margin: 1, borderStyle: 'round', borderColor: '#368722'}))
    } else if (addresses.length == 1) {
        console.log(boxen(chalk`
{bold.hex('#FFFFFF').bgHex('#368722') Server UP} Available on https://${addresses[0]}:${port}/
`, {padding: 1, margin: 1, borderStyle: 'round', borderColor: '#368722'}))
    } else {
        console.log(boxen(chalk`
{bold.hex('#FFFFFF').bgHex('#368722') Server UP} Available on https://*:${port}/

Possible addresses (by network):
${res_str}`, {padding: 1, margin: 1, borderStyle: 'round', borderColor: 'grey'}))
    }





}

start()