// get the options out using lodash templates
const options = JSON.parse(`<%= JSON.stringify(options) %>`)

// extract the namespace from the options
const { namespace, path } = options

// create the plugin
export default ({ $http }, inject) => {

  console.log($http)

  function getSources() {
    return $http.get(path)
  }

  function getLayers() {
    layers = []
    for ( [tilset_id, tileset] in getSources() ) {
      layers.push({
        id: tileset.name,
        type: tileset.type,
        source: tilset_id
      })
    }
    return layers
  }


  // inject an object of functions into the app
  inject(namespace, {
    getSources : getSources,
    getLayers : getLayers,
  })
}