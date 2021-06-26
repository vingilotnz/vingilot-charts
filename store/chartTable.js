export const state = () => ({
  zoom: 1,
  targetZoom: 1,
  orientation: 0,
  targetOrientation: 0,
  maxZoom: 23,
  followBoat: true,
})

export const mutations = {
  setZoom(state, zoom) {
    state.zoom = zoom
  },
  zoomTo(state, zoom) {
    state.targetZoom = zoom
  },
  zoomIn(state) {
    state.targetZoom = Math.min(state.maxZoom, state.zoom + 1)
  },
  zoomOut(state) {
    state.targetZoom = Math.max(1, state.zoom - 1)
  },
  setOrientation(state, orientation) {
    state.orientation = orientation
  },
  orientTo(state, orientation) {
    state.targetOrientation = orientation
  },
  resetOrientation(state) {
    state.targetOrientation = 0
  },
  followBoat(state, follow = true) {
    state.followBoat = follow
  },
  toggleFollowBoat(state) {
    state.followBoat = !state.followBoat
  },
}
