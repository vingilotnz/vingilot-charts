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
}
