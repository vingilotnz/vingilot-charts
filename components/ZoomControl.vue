<template>
  <div class="absolute z-10 inline-block text-right m-3 right-0">
    <!-- Symbols -->
    <svg xmlns="http://www.w3.org/2000/svg" class="hidden">
      <symbol id="icon_plus" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </symbol>
      <symbol id="icon_minus" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20 12H4"
        />
      </symbol>
      <symbol id="icon_needle" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 7l4-4m0 0l4 4m-4-4v18"
        />
      </symbol>
    </svg>

    <div
      class="
        absolute
        right-0
        w-max
        rounded-md
        shadow-lg
        bg-white
        ring-1 ring-black ring-opacity-5
        divide-y divide-gray-100
        focus:outline-none
      "
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="menu-button"
      tabindex="-1"
    >
      <div>
        <button class="p-2" role="none" @click="map.zoomIn()">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="m-auto h-5 w-5"
            stroke="currentColor"
          >
            <use xlink:href="#icon_plus" />
          </svg>
        </button>
      </div>
      <div>
        <button class="p-2" role="none" @click="map.zoomOut()">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="m-auto h-5 w-5"
            stroke="currentColor"
          >
            <use xlink:href="#icon_minus" />
          </svg>
        </button>
      </div>
      <div>
        <button
          id="zoom_needle"
          class="p-2"
          role="none"
          @click="map.resetNorth()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="m-auto h-5 w-5"
            stroke="currentColor"
          >
            <use xlink:href="#icon_needle" />
          </svg>
        </button>
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
    }
  },
  watch: {
    map: {
      handler(map, oldValue) {
        this.bearing = map.getBearing()
        const needle = document.getElementById('zoom_needle')
        map.on('rotate', ({ target }) => {
          this.bearing = target.getBearing()
          needle.style.transform = `rotate(${-this.bearing}deg)`
        })
      },
    },
  },
}
</script>
