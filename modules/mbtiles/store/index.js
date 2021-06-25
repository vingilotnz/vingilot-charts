import tiles from './tiles.js'

// get the options out using lodash templates
const options = JSON.parse(`<%= JSON.stringify(options) %>`)
// extract the namespace var
const { namespace } = options

// create the plugin
export default ({ store }, inject) => {
  store.registerModule(namespace, tiles(options), {
    preserveState: Boolean(store.state[namespace]) // if the store module already exists, preserve it
  })
}