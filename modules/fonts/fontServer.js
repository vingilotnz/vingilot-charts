import { basename, dirname, join } from 'path'
import fs from 'fs'
const glob = require('glob')

export default function ({ font_folder, path }) {

  this.start = async () => {
  }

  this.stop = async () => {
  }


  // Route Request handler
  // Uses "Connect" https://github.com/senchalabs/connect#appuseroute-fn
  // 
  const fontRequestHandler = (req, res, next) => {
    const url = decodeURI(req.url)
    const font_url_format = /^\/(?<fontstack>.+?)\/(?<range>.+?)(?:\.pbf)?$/
    const args = url.match(font_url_format)

    if ((args == undefined) || (args.groups == undefined)) {
      return false
    }

    const { fontstack, range } = args.groups

    if (fontstack && range) {
      const fonts = fontstack.replace("%20", '0').split(',')
      for(const font of fonts) {
        for(const folder of font_folder.flat()) {
          if (fs.existsSync(join(folder,font))) {
            const filename = join(folder,font,`${range}.pbf`)
            if (fs.existsSync(filename)) {
              res.setHeader('Content-Type', 'application/x-protobuf')
              fs.createReadStream(filename).pipe(res)
              return true
            }
          }
        }
      }

      res.writeHead(404, {
        'Content-Type': "text/plain",
        'Access-Control-Allow-Origin': '*'
      });
      res.end(`Requested font${fonts.length > 1 ? 's' : ''} not found (${fonts}), valid options are : ${getFontList().join(", ")}`)
      return true
    }
  }

  const getFontList = () => {
    let fonts = []
    for(const folder of font_folder.flat()) {
      const fontFiles = glob.sync('**/0-255.pbf', {
        cwd: folder,
        root: folder,
      })
      fonts = fonts.concat(fontFiles.map((fontFile) => basename(dirname(fontFile))))
    }

    return fonts
  }

  const fontListHandler = (req, res, next) => {
    if (!req.url.match(/^\/(?:\?.*)?/)) {
      return false
    }
    const list = getFontList()
    const json = JSON.stringify(list, null, 2)
    res.writeHead(200, {
      'Content-Type': "application/json",
      'Access-Control-Allow-Origin': '*'
    })
    res.write(json)
    res.end()

    return true
  }


  this.handler = (req, res, next) => {
    if (!(fontRequestHandler(req, res)
      || fontListHandler(req, res)
    )) {
      res.writeHead(400, {
        'Content-Type': "text/plain",
        'Access-Control-Allow-Origin': '*'
      });
      res.end('ERROR ! Malformed request :' + req.url)
      return;
    }
  }
}
