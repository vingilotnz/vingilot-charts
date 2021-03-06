export const state = () => ({
  position: false,
  accuracy: false,
  cog: false,
  sog: false,
  updated: false,
  attempted: false,
  stale: true,
  staleTimeout: 10,
  raw: {
    type: '',
    data: {},
  },
  track: [],
})

export const mutations = {
  _setPosition(
    state,
    {
      position,
      accuracy = false,
      sog = false,
      cog = false,
      raw = { type: '', data: {} },
      timestamp = new Date(),
    }
  ) {
    state.position = position
    state.accuracy = accuracy
    state.sog = sog
    state.cog = cog
    state.updated = timestamp
    state.attempted = timestamp
    state.stale = false
    state.raw = raw
  },
  recordFailedAttempt(state) {
    const now = new Date()
    state.attempted = now
  },
  stale(state) {
    state.stale = true
  },
  addToTrack(state, { position, accuracy, timestamp, sog, cog, wasStale }) {
    state.track.push({ position, accuracy, timestamp, sog, cog, wasStale })
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
