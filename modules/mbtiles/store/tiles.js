// store/tiles.js
export default options => ({
    namespaced: true,
    state: () => ({
      options,
      tiles: options.initialValue || new Map()
    }),
    mutations: {
      ADD_TILE(state, tileset) {
        state.tiles.add(tileset.tileset_id)
      },
      REMOVE_TILE(state, tileset) {
        state.remove(tileset.tileset_id, tileset_id)
      },
    },
    getters: {
      tiles: state => state.tiles
    }
  })