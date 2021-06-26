export const state = () => ({
  position: false,
  accuracy: false,
  cog: false,
  sog: false,
  updated: false,
  attempted: false,
  stale: true,
  staleTimeout: 10,
})

export const mutations = {
  _setPosition(
    state,
    { position, accuracy = false, sog = false, cog = false }
  ) {
    state.position = position
    state.accuracy = accuracy
    state.sog = sog
    state.cog = cog
    const now = new Date()
    state.updated = now
    state.attempted = now
    state.stale = false
  },
  recordFailedAttempt(state) {
    const now = new Date()
    state.attempted = now
  },
  stale(state) {
    state.stale = true
  },
}

export const getters = {
  staleTimeout: (state) => {
    return state.staleTimeout
  },
}

let updateLocationTimeoutID = false

export const actions = {
  updateLocation({ commit, getters }, positionData) {
    commit('_setPosition', positionData)
    if (updateLocationTimeoutID) clearTimeout(updateLocationTimeoutID)
    updateLocationTimeoutID = setTimeout(() => {
      commit('stale')
      updateLocationTimeoutID = false
    }, getters.staleTimeout * 1000)
  },
}
