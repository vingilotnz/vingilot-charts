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
        flex-row
        rounded-md
        shadow-lg
        bg-yellow-100
        ring-1 ring-black ring-opacity-5
        divide-x divide-gray-600
        focus:outline-none
      "
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="menu-button"
      tabindex="-1"
    >
      <div class="flex flex-row p-2">
        <button class="pr-2" role="none" @click="map.zoomIn()">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="m-auto h-5 w-5"
            stroke="currentColor"
          >
            <use xlink:href="#icon_boat" />
          </svg>
        </button>
        <div class="my-auto">{{ latLongToString(location) }}</div>
      </div>
      <div class="flex flex-row p-2">
        <button class="pr-2" role="none" @click="map.zoomIn()">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="m-auto h-5 w-5"
            stroke="currentColor"
          >
            <use xlink:href="#icon_cursor" />
          </svg>
        </button>
        <div class="my-auto">{{ latLongToString(cursorPosition) }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    map: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      show: false,
      bearing: 0,
      location: 0,
      cursorPosition: 0,
    }
  },
  methods: {
    normalizeAngle(angle) {
      while (angle <= -180) angle += 360
      while (angle > 180) angle -= 360
      return angle
    },
    getDegrees(decDegrees) {
      decDegrees = this.normalizeAngle(decDegrees)
      const degrees = Math.floor(decDegrees)
      const decMinutes = (decDegrees - degrees) * 60
      const minutes = decMinutes % 60
      const seconds = (decMinutes - minutes) * 60
      return { decDegrees, degrees, decMinutes, minutes, seconds }
    },
    toDisplayDegrees(d) {
      d = this.getDegrees(d)
      return `${d.degrees.toFixed(0)}° ${d.decMinutes.toFixed(3)}'`
    },
    latLongToString(pos) {
      if (!pos || !pos.lng || !pos.lat) {
        return `Lat: -, Lng: -`
      }
      const lat = this.toDisplayDegrees(pos.lat)
      const lng = this.toDisplayDegrees(pos.lng)
      return `Lat: ${lat}, Lng: ${lng}`
    },
  },
  watch: {
    map: {
      handler(map, oldValue) {
        map.on('click', ({ lngLat }) => {
          this.cursorPosition = lngLat
        })
      },
    },
  },
}
</script>
