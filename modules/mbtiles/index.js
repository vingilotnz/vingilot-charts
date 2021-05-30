import MBTiles from '@mapbox/mbtiles'

export default function (moduleOptions) {

  let mbtiles_instance

  const mapbox_url_format = /^\/?(?:(?<tileset_id>[\w\.]+)\/)?(?<zoom>\d+)\/(?<x>\d+)\/(?<y>\d+)(?<dpi>@2x)?(?:\.(?<format>[\w\.]+))?/
  const mbtilesLocation = moduleOptions.chart + "?mode=ro";

  console.log("Init Hook")
  console.log("Location : " + mbtilesLocation)

  this.nuxt.hook('listen', async function (server, { port }) {
    console.log("Listen Hook")
  })

  // Disconnect ngrok connection when closing nuxt
  this.nuxt.hook('close', function () {
    console.log("Close Hook")
  })

  // Uses "Connect" https://github.com/senchalabs/connect#appuseroute-fn
  let requestHandler = function(req, res, next) {
    console.log("\n\n\nRequest Handler ")
    let url = new URL(req.url, `http://${req.headers.host}`); 
    console.log(url.pathname);
    console.log(url.searchParams);

    let args = url.pathname.match(mapbox_url_format)

    if( args == undefined )
    {
      res.end('ERROR ! Malformed requests :' + req.url)
      return;
    }

    args = args.groups
    
    switch(args.format)
    {
      default : {
        console.log("Error");
        res.end('ERROR ! Malformed requests :' + req.url)
        return;
      }
      
      case "grid.json" : {
        mbtiles_instance.getGrid(args.zoom, args.x, args.y, function(err, grid, headers) {
          if (err) {
            res.end('ERROR ! Grid rendering error : ' + err)
          } else {
            for ( const header in headers ) {
              res.setHeader(header, headers[header])
            }
            res.end(grid);
          }
        });
        break;
      }

      case undefined:
      case "png" :	
      case "png32" :	
      case "png64" :	
      case "png128" :	
      case "png256" :
      case "jpg" :
      case "jpg70" :	
      case "jpg80" :	
      case "jpg90" : {
        mbtiles_instance.getTile(args.zoom, args.x, args.y, function(err, tile, headers) {
          console.log("Request : ")
          console.log(args)
          console.log(headers)
          if (err) {
            res.writeHead(500, { 'Content-Type' : "text/plain"});
            res.end("Tile error : " + err);
            console.log("Sent Error : " + err);
          } else {
            res.writeHead(200, headers);
            res.write(tile);
            res.end();
            console.log("Sent File ");
          }
        });
        break;
      }

    }

  }

  this.addServerMiddleware(
    {
      path: '/tiles',
      handler: requestHandler,
    }
  )

  new MBTiles(mbtilesLocation, function (err, instance) {
    if (err) throw err;
    mbtiles_instance = instance;
  });

}

  // REQUIRED if publishing the module as npm package
  //module.exports.meta = require('./package.json')