export const state = () => ({
  layers: [],
  overlays: [],
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
  setLayerContrast(state, { layer, contrast }) {
    layer.contrast = contrast
  },
  addOverlay(state, overlay) {
    state.overlays.push(overlay)
  },
  removeOverlay(state, overlay) {
    state.overlays.splice(state.overlays.indexOf(overlay), 1)
  },
  setOrderOverlay(state, overlay, order) {
    overlay.order = order
  },
  setVisibleOverlay(state, overlay, visible) {
    overlay.visible = visible
  },
  toggleOverlay(state, overlay) {
    overlay.visible = !overlay.visible
  },
  selectOverlay(state, overlay) {
    state.overlays.forEach((o) => {
      o.visible = o === overlay
    })
  },
  setOverlayOpacity(state, { overlay, opacity }) {
    overlay.opacity = Math.max(Math.min(opacity, 1), 0.0001)
  },
}

export const getters = {
  getLayerById: (state) => (id) => {
    return state.layers.filter((layer) => layer.id === id)
  },
  getOverlayById: (state) => (id) => {
    return state.overlays.filter((overlay) => overlay.id === id)
  },
  getActiveLayers(state) {
    return state.layers.filter((layer) => layer.visible)
  },
  getActiveOverlays(state) {
    return state.overlays.filter((overlay) => overlay.visible)
  },
}
