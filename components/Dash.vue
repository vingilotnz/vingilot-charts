<template>
  <div class="absolute z-10 inline-block text-left bottom-0 left-0 m-3">
    <!-- Symbols -->
    <svg xmlns="http://www.w3.org/2000/svg" class="hidden">
      <symbol id="icon_boat" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
        />
      </symbol>
      <symbol id="icon_boat_solid" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          fill="green"
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
        />
      </symbol>
      <symbol id="icon_boat_error" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          fill="red"
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
        />
      </symbol>
      <symbol id="icon_boat_stale" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          fill="grey"
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
        />
      </symbol>
      <symbol id="icon_cursor" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
        />
      </symbol>
    </svg>

    <div
      class="
        absolute
        left-0
        bottom-0
        flex
        w-max
        flex-col
        md:flex-row
        rounded-md
        shadow-lg
        bg-yellow-100
        ring-1 ring-black ring-opacity-5
        divide-y divide-x-0
        md:divide-y-0 md:divide-x
        divide-gray-600
        focus:outline-none
      "
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="menu-button"
      tabindex="-1"
    >
      <div class="flex flex-row p-2" @click="toggleFollowBoat()">
        <button class="pr-2" role="none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="m-auto h-5 w-5"
            stroke="currentColor"
          >
            <use v-if="locationError" xlink:href="#icon_boat_error" />
            <use v-else-if="followBoat" xlink:href="#icon_boat_solid" />
            <use v-else xlink:href="#icon_boat" />
          </svg>
        </button>
        <div v-if="position" class="my-auto pr-2">
          {{ latLongToString(position) }}
        </div>
        <div v-if="sog || cog" class="my-auto pr-2">|</div>
        <div v-if="sog" class="my-auto pr-2">{{ toDisplaySpeed(sog) }}</div>
        <div v-if="cog" class="my-auto pr-2">{{ toDisplayHeading(cog) }}</div>
      </div>
    </div>
  </div>
</template>

<script>
function normalizeDegrees(angle) {
  while (angle <= -180) angle += 360
  while (angle > 180) angle -= 360
  return angle
}

export default {
  computed: {
    cog() {
      return this.$store.state.boat.cog
    },
    sog() {
      return this.$store.state.boat.sog
    },
    position() {
      return this.$store.state.boat.position
    },
    followBoat() {
      return this.$store.state.chartTable.followBoat
    },
    locationError() {
      return this.$store.state.boat.stale
    },
  },
  methods: {
    formatDegrees(decDegrees) {
      decDegrees = normalizeDegrees(decDegrees)
      const degrees =
        Math.floor(Math.abs(decDegrees)) * (decDegrees < 0 ? -1 : 1)
      const decMinutes = (Math.abs(decDegrees) - Math.abs(degrees)) * 60
      const minutes = decMinutes % 60
      const seconds = (decMinutes - minutes) * 60
      return { decDegrees, degrees, decMinutes, minutes, seconds }
    },
    toDisplayDegrees(d) {
      d = this.formatDegrees(d)
      return `${d.degrees.toFixed(0)}° ${d.decMinutes.toFixed(3)}'`
    },
    toDisplaySpeed(s) {
      if (isNaN(s)) return `? Kts`
      s = (s * 1.94384).toFixed(2)
      return `${s} Kts`
    },
    toDisplayDistance(s) {
      if (isNaN(s)) return `? Nm`
      const n = (s / 1.852 / 1000).toFixed(2)
      const m = (s / 1000).toFixed(s > 2000 ? 1 : s > 1000 ? 2 : 3)
      return `${n} Nm (${m} Km)`
    },
    toDisplayHeading(h) {
      if (isNaN(h)) return `? T`
      if (h < 0) {
        h = h + 360
      }
      h = h.toFixed(2)
      return `${h}° T`
    },
    latLongToString(pos) {
      if (!pos || !pos.lon || !pos.lat) {
        return `Lat: -, Lng: -`
      }
      const lat = this.toDisplayDegrees(pos.lat)
      const lng = this.toDisplayDegrees(pos.lon)
      return `Lat: ${lat}, Lng: ${lng}`
    },
    toggleFollowBoat() {
      this.$store.commit('chartTable/toggleFollowBoat')
    },
  },
}
</script>
