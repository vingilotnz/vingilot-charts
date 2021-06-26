export const state = () => ({
  layers: [],
})

export const mutations = {
  add(state, layer) {
    state.layers.push(layer)
  },
  remove(state, layer) {
    state.layers.splice(state.layers.indexOf(layer), 1)
  },
  setOrder(state, layer, order) {
    layer.order = order
  },
  setVisible(state, layer, visible) {
    layer.visible = visible
  },
  toggle(state, layer) {
    layer.visible = !layer.visible
  },
  select(state, layer) {
    state.layers.forEach((l) => {
      l.visible = l === layer
    })
  },
}

export const getters = {
  getLayerById: (state) => (id) => {
    return state.layers.filter((layer) => layer.id === id)
  },
}
