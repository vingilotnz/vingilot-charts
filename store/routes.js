export const state = () => ({
  routes: [],
})

export const mutations = {
  add(state, route) {
    state.routes.push(route)
  },
  remove(state, route) {
    state.routes.splice(state.routes.indexOf(route), 1)
  },
  setOrder(state, route, order) {
    route.order = order
  },
  setVisible(state, route, visible) {
    route.visible = visible
  },
  toggle(state, route) {
    route.visible = !route.visible
  },
  select(state, route) {
    state.routes.forEach((l) => {
      l.visible = l === route
    })
  },
}

export const getters = {
  getRouteById: (state) => (id) => {
    return state.routes.filter((route) => route.id === id)
  },
  getVisibleRoutes(state) {
    return state.routes.filter((route) => route.visible)
  },
}
